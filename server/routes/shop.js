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
    const [user, item] = await Promise.all([User.findById(req.user.id), ShopItem.findById(itemId)]);
    if (!user || !item) return res.status(404).json({ message: 'User or item not found' });

    let coinPrice = item.price?.coins ?? 0;
    if (item.type === 'skin' && coinPrice <= 0) coinPrice = rarityCoinPrice[item.rarity] ?? 200;
    if (item.type === 'emote' && coinPrice <= 0) coinPrice = 100;
    if (item.type === 'emote') coinPrice = Math.max(100, Math.min(coinPrice, 300));
    const gemPrice = item.price?.gems ?? 0;
    if (user.coins < coinPrice || user.gems < gemPrice) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.coins -= coinPrice;
    user.gems -= gemPrice;
    if (item.type === 'skin') {
      user.ownedSkins.push(item.name);
    } else if (item.type === 'emote') {
      user.ownedEmotes.push(item.name);
    } else if (item.type === 'avatar_frame') {
      user.ownedAvatarFrames.push(item.name);
    }
    await user.save();

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


module.exports = router;
