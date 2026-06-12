const express = require('express');
const User = require('../models/User');
const ShopItem = require('../models/ShopItem');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/users - List users
router.get('/users', async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const query = search
      ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
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

module.exports = router;
