const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const ShopItem = require('../models/ShopItem');
const Quest = require('../models/Quest');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Season = require('../models/Season');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { resolveLogUserIds } = require('../utils/adminLogFilters');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/admin/overview - Statistics dashboard
router.get('/overview', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isOnline: true });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalShopItems = await ShopItem.countDocuments();
    const activeShopItems = await ShopItem.countDocuments({ isActive: { $ne: false } });
    const totalMissions = await Quest.countDocuments();
    const activeMissions = await Quest.countDocuments({ isActive: true });

    // Active rooms count from socket server
    const io = req.app.get('io');
    let activeRoomsCount = 0;
    if (io) {
      const socketRooms = io.sockets.adapter.rooms;
      activeRoomsCount = Array.from(socketRooms.keys()).filter(key => key.length === 6).length;
    }

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalRooms: activeRoomsCount,
        activeRooms: activeRoomsCount,
        totalShopItems,
        activeShopItems,
        totalMissions,
        activeMissions
      }
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/admin/stats - Compatibility statistics dashboard (reused old endpoint name)
router.get('/stats', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalItems = await ShopItem.countDocuments();
    
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

    const io = req.app.get('io');
    let activeRoomsCount = 0;
    if (io) {
      const socketRooms = io.sockets.adapter.rooms;
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

// GET /api/admin/users - List users with filters, search, and pagination
router.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: escapeRegExp(search), $options: 'i' } },
        { email: { $regex: escapeRegExp(search), $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      if (status === 'banned') {
        query.isBanned = true;
      } else if (status === 'active') {
        query.isBanned = false;
      }
    }

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortQuery = { [sortBy]: sortOrder };

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/admin/users/:userId/status - Ban/Unban/Suspend User
router.patch('/users/:userId/status', async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể tự thay đổi trạng thái tài khoản của chính mình.' });
    }

    const userBefore = await User.findById(req.params.userId);
    if (!userBefore) return res.status(404).json({ message: 'User not found' });

    // isBanned is true for status 'banned' or 'suspended'
    const isBanned = (status === 'banned' || status === 'suspended');

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { isBanned } },
      { new: true }
    ).select('-passwordHash');

    await AuditLog.create({
      adminId: req.user.id,
      action: 'USER_BAN',
      targetType: 'user',
      targetId: user._id.toString(),
      before: { isBanned: userBefore.isBanned },
      after: { isBanned: user.isBanned },
      reason: reason || `Updated status to ${status}`,
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/admin/users/:userId/role - Change User Role
router.patch('/users/:userId/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required' });

    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể tự tước quyền Admin của chính mình.' });
    }

    const userBefore = await User.findById(req.params.userId);
    if (!userBefore) return res.status(404).json({ message: 'User not found' });

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { role } },
      { new: true }
    ).select('-passwordHash');

    await AuditLog.create({
      adminId: req.user.id,
      action: 'ROLE_CHANGE',
      targetType: 'user',
      targetId: user._id.toString(),
      before: { role: userBefore.role },
      after: { role: user.role },
      reason: 'Role updated via admin console',
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/admin/users/:userId/currency - Adjust User Currency
router.patch('/users/:userId/currency', async (req, res, next) => {
  try {
    const { currency, amount, operation, reason } = req.body;
    if (!currency || amount === undefined || !operation || !reason) {
      return res.status(400).json({ message: 'Missing fields: currency, amount, operation, reason' });
    }

    const val = Number(amount);
    if (isNaN(val) || val < 0) {
      return res.status(400).json({ message: 'Amount must be a non-negative number' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const field = currency === 'gem' ? 'gems' : 'coins';
    const balanceBefore = user[field] || 0;
    let balanceAfter = balanceBefore;

    if (operation === 'add') {
      balanceAfter += val;
    } else if (operation === 'subtract') {
      balanceAfter -= val;
    } else if (operation === 'set') {
      balanceAfter = val;
    } else {
      return res.status(400).json({ message: 'Invalid operation' });
    }

    if (balanceAfter < 0) {
      return res.status(400).json({ message: 'Số dư cuối cùng không thể âm.' });
    }

    user[field] = balanceAfter;
    await user.save();

    // Create Transaction Log
    await Transaction.create({
      userId: user._id,
      type: 'admin_adjust',
      amount: val,
      currency: currency === 'gem' ? 'gem' : 'coin',
      balanceBefore,
      balanceAfter,
      source: 'admin_adjustment',
      createdBy: req.user.username,
      description: `Admin E-Economy adjustment: ${operation} ${amount} (${reason})`,
    });

    // Create Audit Log
    await AuditLog.create({
      adminId: req.user.id,
      action: 'CURRENCY_ADJUST',
      targetType: 'user',
      targetId: user._id.toString(),
      before: { [field]: balanceBefore },
      after: { [field]: balanceAfter },
      reason,
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/admin/users/:userId/elo - Adjust User ELO
router.patch('/users/:userId/elo', async (req, res, next) => {
  try {
    const { elo, reason } = req.body;
    if (elo === undefined || !reason) {
      return res.status(400).json({ message: 'Missing fields: elo, reason' });
    }

    const newElo = Number(elo);
    if (isNaN(newElo) || newElo < 0) {
      return res.status(400).json({ message: 'ELO points must be a non-negative number' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const eloBefore = user.eloPoints || 1000;
    user.eloPoints = newElo;
    await user.save();

    // Create Transaction
    await Transaction.create({
      userId: user._id,
      type: 'elo_adjust',
      amount: Math.abs(newElo - eloBefore),
      currency: 'elo',
      balanceBefore: eloBefore,
      balanceAfter: newElo,
      source: 'admin_adjustment',
      createdBy: req.user.username,
      description: `Admin ELO adjustment to ${newElo} (${reason})`,
    });

    // Create Audit Log
    await AuditLog.create({
      adminId: req.user.id,
      action: 'ELO_ADJUST',
      targetType: 'user',
      targetId: user._id.toString(),
      before: { eloPoints: eloBefore },
      after: { eloPoints: newElo },
      reason,
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
});

// GET /api/admin/transactions - Transaction and Audit logs viewer
router.get('/transactions', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const logType = req.query.logType || 'transaction';
    const matchedUserIds = req.query.userId
      ? await resolveLogUserIds(req.query.userId, (search) => User.find({
          $or: [
            { username: { $regex: escapeRegExp(search), $options: 'i' } },
            { email: { $regex: escapeRegExp(search), $options: 'i' } },
          ],
        }).select('_id'))
      : null;

    if (logType === 'audit') {
      const query = {};
      if (matchedUserIds) {
        query.adminId = { $in: matchedUserIds };
      }
      if (req.query.type) {
        query.action = req.query.type;
      }

      const total = await AuditLog.countDocuments(query);
      const logs = await AuditLog.find(query)
        .populate('adminId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          }
        }
      });
    } else {
      const query = {};
      if (matchedUserIds) {
        query.userId = { $in: matchedUserIds };
      }
      if (req.query.type) {
        query.type = req.query.type;
      }
      if (req.query.currency) {
        query.currency = req.query.currency;
      }

      const total = await Transaction.countDocuments(query);
      const logs = await Transaction.find(query)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          }
        }
      });
    }
  } catch (error) {
    return next(error);
  }
});

// POST /api/admin/announcements - Broadcast server announcement
router.post(['/announcement', '/announcements'], async (req, res, next) => {
  try {
    const { title, message, type, durationSeconds } = req.body;
    const finalMessage = message || req.body.text; // Support text fallback from older versions
    
    if (!finalMessage) return res.status(400).json({ message: 'Announcement message is required' });

    const io = req.app.get('io');
    if (io) {
      // Emit announcement to all connected clients
      io.emit('announcement:broadcast', {
        title: title || 'Thông Báo Hệ Thống',
        message: finalMessage,
        type: type || 'info',
        durationSeconds: durationSeconds || 30,
        createdAt: new Date(),
        sender: req.user.username,
      });

      // Maintain legacy event compatibility
      io.emit('server_announcement', {
        text: finalMessage,
        sentAt: new Date().toISOString(),
        sender: req.user.username,
      });
    }

    await AuditLog.create({
      adminId: req.user.id,
      action: 'ANNOUNCEMENT_BROADCAST',
      targetType: 'announcement',
      reason: `Broadcasted: [${title || 'System'}] ${finalMessage}`,
    });

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

    await AuditLog.create({
      adminId: req.user.id,
      action: 'QUEST_CREATE',
      targetType: 'quest',
      targetId: quest._id.toString(),
      after: quest.toObject(),
      reason: 'Created daily quest',
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
    const questBefore = await Quest.findById(req.params.id);
    if (!questBefore) return res.status(404).json({ message: 'Quest not found' });

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

    await AuditLog.create({
      adminId: req.user.id,
      action: 'QUEST_UPDATE',
      targetType: 'quest',
      targetId: quest._id.toString(),
      before: questBefore.toObject(),
      after: quest.toObject(),
      reason: 'Updated daily quest parameters',
    });

    return res.json(quest);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/admin/quests/:id - Delete a quest
router.delete('/quests/:id', async (req, res, next) => {
  try {
    const questBefore = await Quest.findById(req.params.id);
    if (!questBefore) return res.status(404).json({ message: 'Quest not found' });

    await Quest.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      adminId: req.user.id,
      action: 'QUEST_DELETE',
      targetType: 'quest',
      targetId: req.params.id,
      before: questBefore.toObject(),
      reason: 'Deleted daily quest',
    });

    return res.json({ success: true, message: 'Quest deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

// Helper to determine season end Pink Coin reward based on rank
function getSeasonEndReward(rank) {
  if (!rank) return 10;
  if (rank === 'Legend') return 100;
  if (rank.startsWith('Diamond')) return 60;
  if (rank.startsWith('Platinum')) return 45;
  if (rank.startsWith('Gold')) return 30;
  if (rank.startsWith('Silver')) return 15;
  return 10; // Bronze
}

// POST /api/admin/season-reset - Reset season, award Pink Coins based on Rank, and reset ELO
// GET /api/admin/seasons - List all seasons
router.get('/seasons', async (req, res, next) => {
  try {
    const seasons = await Season.find().sort({ seasonNumber: -1 });
    return res.json({ success: true, seasons });
  } catch (error) {
    return next(error);
  }
});

// POST /api/admin/seasons - Create a new season
router.post('/seasons', async (req, res, next) => {
  try {
    const { seasonNumber, name, startDate, endDate, resetStrategy, softResetRatio, resetEloValue } = req.body;

    if (!seasonNumber || !name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc để tạo mùa giải.' });
    }

    // Check if season number already exists
    const existing = await Season.findOne({ seasonNumber });
    if (existing) {
      return res.status(400).json({ message: `Mùa giải số ${seasonNumber} đã tồn tại.` });
    }

    const season = await Season.create({
      seasonNumber,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      settings: {
        resetStrategy: resetStrategy || 'soft_reset_ratio',
        softResetRatio: softResetRatio !== undefined ? Number(softResetRatio) : 0.5,
        resetEloValue: resetEloValue !== undefined ? Number(resetEloValue) : 1000
      },
      createdBy: req.user.id
    });

    // Create Audit Log
    await AuditLog.create({
      adminId: req.user.id,
      action: 'SEASON_CREATE',
      targetType: 'season',
      targetId: season._id.toString(),
      after: season,
      reason: `Scheduled season ${seasonNumber}`
    });

    return res.json({ success: true, season });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/admin/seasons/:id - Update a season
router.put('/seasons/:id', async (req, res, next) => {
  try {
    const { name, startDate, endDate, resetStrategy, softResetRatio, resetEloValue, status } = req.body;
    const season = await Season.findById(req.params.id);

    if (!season) {
      return res.status(404).json({ message: 'Không tìm thấy mùa giải.' });
    }

    if (season.isResetExecuted && status === 'active') {
      return res.status(400).json({ message: 'Không thể kích hoạt lại mùa giải đã chạy reset.' });
    }

    const beforeState = JSON.parse(JSON.stringify(season));

    if (name) season.name = name;
    if (startDate) season.startDate = new Date(startDate);
    if (endDate) season.endDate = new Date(endDate);
    if (status) season.status = status;
    
    if (resetStrategy) season.settings.resetStrategy = resetStrategy;
    if (softResetRatio !== undefined) season.settings.softResetRatio = Number(softResetRatio);
    if (resetEloValue !== undefined) season.settings.resetEloValue = Number(resetEloValue);

    await season.save();

    // Create Audit Log
    await AuditLog.create({
      adminId: req.user.id,
      action: 'SEASON_UPDATE',
      targetType: 'season',
      targetId: season._id.toString(),
      before: beforeState,
      after: season,
      reason: 'Updated season details'
    });

    return res.json({ success: true, season });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/admin/seasons/:id - Delete a scheduled season
router.delete('/seasons/:id', async (req, res, next) => {
  try {
    const season = await Season.findById(req.params.id);
    if (!season) {
      return res.status(404).json({ message: 'Không tìm thấy mùa giải.' });
    }

    if (season.status === 'active' || season.isResetExecuted) {
      return res.status(400).json({ message: 'Không thể xóa mùa giải đang hoạt động hoặc đã hoàn thành.' });
    }

    const beforeState = JSON.parse(JSON.stringify(season));
    await Season.findByIdAndDelete(req.params.id);

    // Create Audit Log
    await AuditLog.create({
      adminId: req.user.id,
      action: 'SEASON_DELETE',
      targetType: 'season',
      targetId: req.params.id,
      before: beforeState,
      reason: 'Deleted scheduled season'
    });

    return res.json({ success: true, message: 'Xóa mùa giải thành công.' });
  } catch (error) {
    return next(error);
  }
});

function getTieredResetElo(rank) {
  if (!rank) return 1000;
  if (rank === 'Legend') return 1800; // Platinum IV
  if (rank.startsWith('Diamond')) return 1500; // Silver III
  if (rank.startsWith('Platinum')) return 1300; // Bronze I
  if (rank.startsWith('Gold')) return 1200; // Bronze II
  if (rank.startsWith('Silver')) return 1100; // Bronze I
  return 1000; // Bronze II
}

// POST /api/admin/season-reset - Reset season, award Pink Coins based on Rank, and reset ELO
router.post('/season-reset', async (req, res, next) => {
  try {
    const { confirmText, reason } = req.body;
    if (confirmText !== 'RESET') {
      return res.status(400).json({ message: 'Xác nhận RESET không hợp lệ.' });
    }
    if (!reason) {
      return res.status(400).json({ message: 'Lý do reset mùa giải là bắt buộc.' });
    }

    // Find the season to reset
    const seasonToReset = await Season.findOne({
      isResetExecuted: false,
      status: { $in: ['active', 'ended'] }
    }).sort({ seasonNumber: 1 });

    const strategy = seasonToReset?.settings?.resetStrategy || 'soft_reset_ratio';
    const ratio = seasonToReset?.settings?.softResetRatio !== undefined ? seasonToReset.settings.softResetRatio : 0.5;
    const baseElo = seasonToReset?.settings?.resetEloValue !== undefined ? seasonToReset.settings.resetEloValue : 1000;

    const users = await User.find();
    let updatedCount = 0;
    let totalGemsAwarded = 0;

    await Promise.all(
      users.map(async (user) => {
        const currentRank = user.rank || 'Bronze II';
        const reward = getSeasonEndReward(currentRank);

        // Save states
        const eloBefore = user.eloPoints || 1000;
        const gemsBefore = user.gems || 0;

        // Grant reward
        user.gems = gemsBefore + reward;
        
        // Calculate new ELO based on strategy
        let newElo = baseElo;
        if (strategy === 'soft_reset_ratio') {
          newElo = baseElo + Math.max(0, eloBefore - baseElo) * ratio;
        } else if (strategy === 'soft_reset_tiered') {
          newElo = getTieredResetElo(currentRank);
          newElo = Math.max(baseElo, Math.min(eloBefore, newElo));
        }

        newElo = Math.round(newElo);
        
        // Reset ELO and landmarks for next season
        user.eloPoints = newElo;
        user.seasonHighestElo = newElo;
        user.highestEloReached = newElo; // Sync legacy field
        
        await user.save();
        updatedCount++;
        totalGemsAwarded += reward;

        // Log transaction
        await Transaction.create({
          userId: user._id,
          type: 'season_reward',
          amount: reward,
          currency: 'gem',
          balanceBefore: gemsBefore,
          balanceAfter: user.gems,
          source: 'season_reset',
          description: `Seasonal End Reward for rank ${currentRank} (Season ${seasonToReset?.seasonNumber || 1})`,
        });
      })
    );

    // Mark season as reset executed
    if (seasonToReset) {
      seasonToReset.isResetExecuted = true;
      seasonToReset.status = 'ended';
      await seasonToReset.save();
    }

    // Broadcast to everyone via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('announcement:broadcast', {
        title: 'Reset Mùa Giải!',
        message: `Mùa giải ${seasonToReset?.name || ''} đã chính thức khép lại! Điểm ELO của bạn đã được thiết lập lại. Quà thăng hạng mùa giải đã được gửi vào tài khoản!`,
        type: 'event',
        durationSeconds: 60,
        createdAt: new Date(),
        sender: 'Hệ Thống',
      });

      // Maintain legacy event compatibility
      io.emit('server_announcement', {
        text: `Mùa giải ${seasonToReset?.name || ''} đã chính thức khép lại! Điểm ELO của bạn đã được thiết lập lại. Quà thăng hạng mùa giải (Xu Hồng) đã được gửi vào hòm đồ của bạn! Hãy sẵn sàng cho mùa giải mới!`,
        sentAt: new Date().toISOString(),
        sender: 'Hệ Thống'
      });
    }

    // Create Audit Log
    await AuditLog.create({
      adminId: req.user.id,
      action: 'SEASON_RESET',
      targetType: 'season',
      targetId: seasonToReset?._id?.toString() || 'legacy',
      reason,
      after: { affectedUsers: updatedCount, totalGemsAwarded, strategy, seasonNumber: seasonToReset?.seasonNumber },
    });

    return res.json({
      success: true,
      data: {
        affectedUsers: updatedCount,
        strategy,
        totalGemsAwarded
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
