// Shop routes for listing items, buying items, and fetching owned cosmetics.
const express = require('express');
const ShopItem = require('../models/ShopItem');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const {
  createCatalogItem,
  deleteCatalogItem,
  setCatalogItemStatus,
  updateCatalogItem,
} = require('../services/admin/catalogService');
const { getRuntimeLiveOpsConfig } = require('../services/admin/liveOpsService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();

function adminRequestContext(req) {
  return { requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') };
}

async function sendIdempotentMutation(req, res, { operation, payload, execute }) {
  const outcome = await executeIdempotentAdminOperation({
    actorId: req.admin.id,
    operation,
    requestId: req.adminMutation.requestId,
    payload,
    execute,
  });
  if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
  return res.status(outcome.statusCode).json(outcome.body);
}

const rarityCoinPrice = {
  common: 200,
  rare: 500,
  epic: 1000,
  legendary: 1500,
};

router.get('/items', async (_req, res, next) => {
  try {
    const liveOps = await getRuntimeLiveOpsConfig();
    if (liveOps.config.maintenanceMode || !liveOps.config.features.shop) throw new ApiError(503, 'FEATURE_UNAVAILABLE', 'Shop đang tạm dừng theo cấu hình Live Ops.');
    const now = new Date();
    const items = await ShopItem.find({
      isActive: { $ne: false },
      $or: [{ isLimited: false }, { availableUntil: { $gte: now } }],
    }).sort({ sortOrder: 1, createdAt: -1 });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

router.use(authMiddleware);

router.post('/buy', async (req, res, next) => {
  try {
    const liveOps = await getRuntimeLiveOpsConfig();
    if (liveOps.config.maintenanceMode || !liveOps.config.features.shop) throw new ApiError(503, 'FEATURE_UNAVAILABLE', 'Shop đang tạm dừng theo cấu hình Live Ops.');
    const { itemId } = req.body;
    const item = await ShopItem.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    let coinPrice = item.price?.coins ?? 0;
    if (item.type === 'skin' && coinPrice <= 0) coinPrice = rarityCoinPrice[item.rarity] ?? 200;
    if (item.type === 'emote' && coinPrice <= 0) coinPrice = 100;
    if (item.type === 'emote') coinPrice = Math.max(100, Math.min(coinPrice, 300));
    const gemPrice = item.price?.gems ?? 0;

    const updateQuery = {
      _id: req.user.id,
      coins: { $gte: coinPrice },
      gems: { $gte: gemPrice }
    };

    const updateFields = {
      $inc: { coins: -coinPrice, gems: -gemPrice }
    };

    if (item.type === 'skin') {
      updateQuery.ownedSkins = { $ne: item.name };
      updateFields.$push = { ownedSkins: item.name };
    } else if (item.type === 'emote') {
      updateQuery.ownedEmotes = { $ne: item.name };
      updateFields.$push = { ownedEmotes: item.name };
    } else if (item.type === 'avatar_frame') {
      updateQuery.ownedAvatarFrames = { $ne: item.name };
      updateFields.$push = { ownedAvatarFrames: item.name };
    }

    const user = await User.findOneAndUpdate(updateQuery, updateFields, { new: true });
    if (!user) {
      const checkUser = await User.findById(req.user.id);
      if (!checkUser) return res.status(404).json({ message: 'User not found' });

      let isOwned = false;
      if (item.type === 'skin') isOwned = checkUser.ownedSkins.includes(item.name);
      else if (item.type === 'emote') isOwned = checkUser.ownedEmotes.includes(item.name);
      else if (item.type === 'avatar_frame') isOwned = checkUser.ownedAvatarFrames.includes(item.name);

      if (isOwned) {
        return res.status(400).json({ message: 'Bạn đã sở hữu vật phẩm này rồi.' });
      }
      return res.status(400).json({ message: 'Số dư không đủ để thực hiện giao dịch.' });
    }

    if (coinPrice > 0) {
      await Transaction.create({
        userId: user._id,
        type: 'purchase',
        amount: coinPrice,
        currency: 'coin',
        source: `shop:${item._id}`,
        description: `Purchased ${item.name}`,
      });
    }

    if (gemPrice > 0) {
      await Transaction.create({
        userId: user._id,
        type: 'purchase',
        amount: gemPrice,
        currency: 'gem',
        source: `shop:${item._id}`,
        description: `Purchased ${item.name}`,
      });
    }

    return res.json({
      success: true,
      coins: user.coins,
      gems: user.gems,
      activeSkin: user.activeSkin,
      activeAvatarFrame: user.activeAvatarFrame,
    });
  } catch (error) {
    return next(error);
  }
});

const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');

router.get('/owned', async (req, res, next) => {
  try {
    const liveOps = await getRuntimeLiveOpsConfig();
    if (liveOps.config.maintenanceMode || !liveOps.config.features.shop) throw new ApiError(503, 'FEATURE_UNAVAILABLE', 'Shop đang tạm dừng theo cấu hình Live Ops.');
    const user = await User.findById(req.user.id).select('ownedSkins ownedEmotes ownedAvatarFrames');
    return res.json({
      ownedSkins: user?.ownedSkins ?? [],
      ownedEmotes: user?.ownedEmotes ?? [],
      ownedAvatarFrames: user?.ownedAvatarFrames ?? [],
    });
  } catch (error) {
    return next(error);
  }
});

// Admin-only endpoints for managing shop items
router.post('/items', adminMiddleware, requireAdminPermission('catalog.write'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    return await sendIdempotentMutation(req, res, {
      operation: 'catalog.item.create',
      payload: req.body,
      execute: async () => {
        const item = await createCatalogItem({
          actor: req.admin,
          input: req.body,
          mutation: req.adminMutation,
          request: adminRequestContext(req),
        });
        return { statusCode: 201, body: item };
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/items/:id', adminMiddleware, requireAdminPermission('catalog.write'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    return await sendIdempotentMutation(req, res, {
      operation: 'catalog.item.update',
      payload: { itemId: req.params.id, ...req.body },
      execute: async () => {
        const item = await updateCatalogItem({
          actor: req.admin,
          itemId: req.params.id,
          input: req.body,
          mutation: req.adminMutation,
          request: adminRequestContext(req),
        });
        return { statusCode: 200, body: item };
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/items/:id/status', adminMiddleware, requireAdminPermission('catalog.write'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    return await sendIdempotentMutation(req, res, {
      operation: 'catalog.item.status.change',
      payload: { itemId: req.params.id, isActive },
      execute: async () => {
        const item = await setCatalogItemStatus({
          actor: req.admin,
          itemId: req.params.id,
          isActive,
          mutation: req.adminMutation,
          request: adminRequestContext(req),
        });
        return { statusCode: 200, body: item };
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/items/:id', adminMiddleware, requireAdminPermission('catalog.write'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    return await sendIdempotentMutation(req, res, {
      operation: 'catalog.item.delete',
      payload: { itemId: req.params.id, reason: req.adminMutation.reason },
      execute: async () => {
        await deleteCatalogItem({
          actor: req.admin,
          itemId: req.params.id,
          mutation: req.adminMutation,
          request: adminRequestContext(req),
        });
        return { statusCode: 200, body: { success: true, message: 'Shop item deleted successfully' } };
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
