// Shop routes for listing items, buying items, and fetching owned cosmetics.
const express = require('express');
const mongoose = require('mongoose');
const ShopItem = require('../models/ShopItem');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const { createAdminMiddleware, requireAdminPermission } = require('../middleware/adminMiddleware');
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
const {
  SHOPPABLE_TYPES,
  equipCosmetic,
  isItemAvailableForPurchase,
  isSafeAssetUrl,
  purchaseCosmetic,
  resolveUserEquipment,
  toPublicCosmetic,
} = require('../services/shopEquipmentService');

function adminRequestContext(req) {
  return { requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') };
}

function assertValidItemId(itemId, { allowNull = false } = {}) {
  if (allowNull && (itemId === null || itemId === undefined || itemId === '')) return;
  if (!mongoose.isValidObjectId(itemId)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Item ID không hợp lệ.');
  }
}

async function sendIdempotentMutation(req, res, { operation, payload, execute }) {
  const outcome = await executeIdempotentAdminOperation({
    OperationModel: req.AdminOperationModel || require('../models/AdminOperation'),
    actorId: req.admin.id,
    operation,
    requestId: req.adminMutation.requestId,
    payload,
    execute,
  });
  if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
  return res.status(outcome.statusCode).json(outcome.body);
}

function createShopRouter({ UserModel = User, ShopItemModel = ShopItem, AdminOperationModel, AuditLogModel } = {}) {
  const router = express.Router();
  const adminMiddleware = createAdminMiddleware({ UserModel });

  router.use((req, _res, next) => {
    if (AdminOperationModel) req.AdminOperationModel = AdminOperationModel;
    if (AuditLogModel) req.AuditLogModel = AuditLogModel;
    next();
  });

  router.get('/items', async (_req, res, next) => {
    try {
      const liveOps = await getRuntimeLiveOpsConfig();
      if (liveOps.config.maintenanceMode || !liveOps.config.features.shop) {
        throw new ApiError(503, 'FEATURE_UNAVAILABLE', 'Shop đang tạm dừng theo cấu hình Live Ops.');
      }
      const now = new Date();
      const items = await ShopItemModel.find({
        isActive: { $ne: false },
        type: { $in: SHOPPABLE_TYPES },
        $or: [{ isLimited: false }, { availableUntil: { $gte: now } }],
      }).sort({ sortOrder: 1, createdAt: -1 });
      return res.json(items.filter((item) => isItemAvailableForPurchase(item, now)).map((item) => {
        const value = item.toObject ? item.toObject() : item;
        return {
          ...toPublicCosmetic(item),
          description: value.description || '',
          price: { coins: (value.price?.coins ?? 0) + (value.price?.gems ?? 0) * 50 },
          isLimited: Boolean(value.isLimited),
          availableUntil: value.availableUntil || null,
        };
      }));
    } catch (error) {
      return next(error);
    }
  });

  router.use(authMiddleware);

  router.post('/buy', async (req, res, next) => {
    try {
      assertValidItemId(req.body?.itemId);
      const liveOps = await getRuntimeLiveOpsConfig();
      if (liveOps.config.maintenanceMode || !liveOps.config.features.shop) {
        throw new ApiError(503, 'FEATURE_UNAVAILABLE', 'Shop đang tạm dừng theo cấu hình Live Ops.');
      }
      return res.json(await purchaseCosmetic({
        userId: req.user.id,
        itemId: req.body?.itemId,
        UserModel,
        ShopItemModel,
        TransactionModel: Transaction,
      }));
    } catch (error) {
      return next(error);
    }
  });

  router.get('/owned', async (req, res, next) => {
    try {
      const liveOps = await getRuntimeLiveOpsConfig();
      if (liveOps.config.maintenanceMode || !liveOps.config.features.shop) {
        throw new ApiError(503, 'FEATURE_UNAVAILABLE', 'Shop đang tạm dừng theo cấu hình Live Ops.');
      }
      const user = await UserModel.findById(req.user.id)
        .select('ownedSkins ownedEmotes ownedAvatarFrames ownedItemIds equippedCosmetics');
      if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
      const items = user.ownedItemIds?.length
        ? await ShopItemModel.find({ _id: { $in: user.ownedItemIds } })
        : [];
      return res.json({
        items: items.map(toPublicCosmetic),
        ownedItemIds: (user.ownedItemIds || []).map(String),
        equipped: await resolveUserEquipment(user, ShopItemModel),
        ownedSkins: user.ownedSkins ?? [],
        ownedEmotes: user.ownedEmotes ?? [],
        ownedAvatarFrames: user.ownedAvatarFrames ?? [],
      });
    } catch (error) {
      return next(error);
    }
  });

  router.put('/equipment/:slot', async (req, res, next) => {
    try {
      assertValidItemId(req.body?.itemId, { allowNull: true });
      const liveOps = await getRuntimeLiveOpsConfig();
      if (liveOps.config.maintenanceMode || !liveOps.config.features.shop) {
        throw new ApiError(503, 'FEATURE_UNAVAILABLE', 'Shop đang tạm dừng theo cấu hình Live Ops.');
      }
      const equipped = await equipCosmetic({
        userId: req.user.id,
        slot: req.params.slot,
        itemId: req.body?.itemId,
        UserModel,
        ShopItemModel,
      });
      return res.json({ success: true, equipped });
    } catch (error) {
      return next(error);
    }
  });

  // Admin-only endpoints for managing shop items
  router.get('/catalog', adminMiddleware, requireAdminPermission('catalog.read'), async (_req, res, next) => {
    try {
      const items = await ShopItemModel.find({}).sort({ sortOrder: 1, createdAt: -1 });
      return res.json(items.map((item) => {
        const value = item.toObject ? item.toObject() : item;
        return {
          ...value,
          imageUrl: isSafeAssetUrl(value.imageUrl) ? value.imageUrl.trim() : '',
          previewUrl: isSafeAssetUrl(value.previewUrl) ? value.previewUrl.trim() : '',
        };
      }));
    } catch (error) {
      return next(error);
    }
  });

  router.post('/items', adminMiddleware, requireAdminPermission('catalog.write'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
    try {
      return await sendIdempotentMutation(req, res, {
        operation: 'catalog.item.create',
        payload: req.body,
        execute: async () => {
          const item = await createCatalogItem({
            CatalogModel: ShopItemModel,
            AuditLogModel: req.AuditLogModel,
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
            CatalogModel: ShopItemModel,
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
            CatalogModel: ShopItemModel,
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
            CatalogModel: ShopItemModel,
            UserModel,
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

  return router;
}

module.exports = createShopRouter();
module.exports.createShopRouter = createShopRouter;
