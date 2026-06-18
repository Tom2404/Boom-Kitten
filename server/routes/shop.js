// Shop routes for listing items, buying items, and fetching owned cosmetics.
const express = require('express');
const ShopItem = require('../models/ShopItem');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const rarityCoinPrice = {
  common: 200,
  rare: 500,
  epic: 1000,
  legendary: 1500,
};

router.get('/items', async (_req, res, next) => {
  try {
    const now = new Date();
    const items = await ShopItem.find({
      $or: [{ isLimited: false }, { availableUntil: { $gte: now } }],
    });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

router.use(authMiddleware);

router.post('/buy', async (req, res, next) => {
  try {
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
        description: `Purchased ${item.name}`,
      });
    }

    if (gemPrice > 0) {
      await Transaction.create({
        userId: user._id,
        type: 'purchase',
        amount: gemPrice,
        currency: 'gem',
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

router.get('/owned', async (req, res, next) => {
  try {
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
router.post('/items', adminMiddleware, async (req, res, next) => {
  try {
    const { name, type, price, rarity, isLimited, availableUntil, imageUrl, previewUrl } = req.body;
    if (!name || !type) return res.status(400).json({ message: 'Name and type are required' });
    const item = await ShopItem.create({
      name,
      type,
      price: price ?? { coins: 0, gems: 0 },
      rarity: rarity ?? 'common',
      isLimited: isLimited ?? false,
      availableUntil,
      imageUrl: imageUrl ?? '',
      previewUrl: previewUrl ?? '',
    });
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
});

router.put('/items/:id', adminMiddleware, async (req, res, next) => {
  try {
    const { name, type, price, rarity, isLimited, availableUntil, imageUrl, previewUrl } = req.body;
    const item = await ShopItem.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          type,
          price,
          rarity,
          isLimited,
          availableUntil,
          imageUrl,
          previewUrl,
        },
      },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Shop item not found' });
    return res.json(item);
  } catch (error) {
    return next(error);
  }
});

router.delete('/items/:id', adminMiddleware, async (req, res, next) => {
  try {
    const item = await ShopItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Shop item not found' });
    return res.json({ success: true, message: 'Shop item deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
