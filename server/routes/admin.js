const express = require('express');
const User = require('../models/User');
const ShopItem = require('../models/ShopItem');
const Quest = require('../models/Quest');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/admin/users - List users
router.get('/users', async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const query = search
      ? {
          $or: [
            { username: { $regex: escapeRegExp(search), $options: 'i' } },
            { email: { $regex: escapeRegExp(search), $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/admin/users/:id - Update user details/bans
router.put('/users/:id', async (req, res, next) => {
  try {
    const { coins, gems, eloPoints, role, isBanned } = req.body;
    const updateData = {};
    if (coins !== undefined) updateData.coins = coins;
    if (gems !== undefined) updateData.gems = gems;
    if (eloPoints !== undefined) updateData.eloPoints = eloPoints;
    if (role !== undefined) updateData.role = role;
    if (isBanned !== undefined) updateData.isBanned = isBanned;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

// GET /api/admin/stats - Statistics dashboard
router.get('/stats', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalItems = await ShopItem.countDocuments();
    
    // Total transactions revenue
    const coinTransactions = await Transaction.aggregate([
      { $match: { type: 'purchase', currency: 'coin' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const gemTransactions = await Transaction.aggregate([
      { $match: { type: 'purchase', currency: 'gem' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const coinRevenue = coinTransactions[0]?.total ?? 0;
    const gemRevenue = gemTransactions[0]?.total ?? 0;

    // Active rooms count from socket server
    const io = req.app.get('io');
    let activeRoomsCount = 0;
    if (io) {
      const socketRooms = io.sockets.adapter.rooms;
      // Filter rooms that look like a 6-letter room code
      activeRoomsCount = Array.from(socketRooms.keys()).filter(key => key.length === 6).length;
    }

    return res.json({
      totalUsers,
      bannedUsers,
      totalItems,
      coinRevenue,
      gemRevenue,
      activeRoomsCount
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/admin/announcement - Broadcast announcement
router.post('/announcement', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Announcement text is required' });

    const io = req.app.get('io');
    if (io) {
      io.emit('server_announcement', {
        text,
        sentAt: new Date().toISOString(),
        sender: req.user.username
      });
    }

    return res.json({ success: true, message: 'Announcement broadcasted successfully' });
  } catch (error) {
    return next(error);
  }
});

// GET /api/admin/quests - List all quests
router.get('/quests', async (req, res, next) => {
  try {
    const quests = await Quest.find().sort({ createdAt: -1 });
    return res.json(quests);
  } catch (error) {
    return next(error);
  }
});

// POST /api/admin/quests - Create a new quest
router.post('/quests', async (req, res, next) => {
  try {
    const { title, description, actionType, targetCount, reward, isActive } = req.body;
    if (!title || !description || !actionType) {
      return res.status(400).json({ message: 'Title, description, and actionType are required' });
    }
    const quest = await Quest.create({
      title,
      description,
      actionType,
      targetCount: targetCount ?? 1,
      reward: reward ?? { coins: 0, gems: 0 },
      isActive: isActive ?? true
    });
    return res.status(201).json(quest);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/admin/quests/:id - Update an existing quest
router.put('/quests/:id', async (req, res, next) => {
  try {
    const { title, description, actionType, targetCount, reward, isActive } = req.body;
    const quest = await Quest.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title,
          description,
          actionType,
          targetCount,
          reward,
          isActive
        }
      },
      { new: true, runValidators: true }
    );
    if (!quest) return res.status(404).json({ message: 'Quest not found' });
    return res.json(quest);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/admin/quests/:id - Delete a quest
router.delete('/quests/:id', async (req, res, next) => {
  try {
    const quest = await Quest.findByIdAndDelete(req.params.id);
    if (!quest) return res.status(404).json({ message: 'Quest not found' });
    return res.json({ success: true, message: 'Quest deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

// Helper to determine season end Pink Coin reward based on rank
function getSeasonEndReward(rank) {
  if (!rank) return 5;
  if (rank === 'Legend') return 100;
  if (rank.startsWith('Diamond')) return 60;
  if (rank.startsWith('Platinum')) return 45;
  if (rank.startsWith('Gold')) return 30;
  if (rank.startsWith('Silver')) return 15;
  return 5; // Bronze
}

// POST /api/admin/season-reset - Reset season, award Pink Coins based on Rank, and reset ELO
router.post('/season-reset', async (req, res, next) => {
  try {
    const users = await User.find();
    let updatedCount = 0;

    await Promise.all(
      users.map(async (user) => {
        const currentRank = user.rank || 'Bronze IV';
        const reward = getSeasonEndReward(currentRank);

        // Grant reward
        user.gems = (user.gems || 0) + reward;
        
        // Reset ELO and landmarks for next season
        user.eloPoints = 1000;
        user.highestEloReached = 1000;
        
        await user.save();
        updatedCount++;

        // Log transaction
        await Transaction.create({
          userId: user._id,
          type: 'earn',
          amount: reward,
          currency: 'gem',
          description: `Seasonal End Reward for rank ${currentRank}`,
        });
      })
    );

    // Broadcast to everyone via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('server_announcement', {
        text: 'Mùa giải đã chính thức khép lại! Điểm ELO của bạn đã được thiết lập lại. Quà thăng hạng mùa giải (Xu Hồng) đã được gửi vào hòm đồ của bạn! Hãy sẵn sàng cho mùa giải mới!',
        sentAt: new Date().toISOString(),
        sender: 'Hệ Thống'
      });
    }

    return res.json({
      success: true,
      message: `Season reset processed successfully. Awarded and reset ${updatedCount} users.`,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
