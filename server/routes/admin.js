const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const ShopItem = require('../models/ShopItem');
const Quest = require('../models/Quest');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Announcement = require('../models/Announcement');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { resolveLogUserIds } = require('../utils/adminLogFilters');
const { changePlayerRole } = require('../services/admin/roleService');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const { createAdminAudit } = require('../services/admin/auditService');
const { ApiError } = require('../utils/apiResponse');
const { createQuest, deleteQuest, updateQuest } = require('../services/admin/questService');
const { cancelAnnouncement, createAnnouncement, deliverAnnouncement } = require('../services/admin/announcementService');
const { getOperationalDashboard } = require('../services/admin/dashboardService');
const { getPlayerOverview } = require('../services/admin/playerOverviewService');
const { previewCurrencyAdjustment } = require('../services/admin/economyAdjustmentService');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/me', (req, res) => res.json({
  success: true,
  data: {
    admin: {
      id: req.admin.id,
      username: req.admin.username,
      email: req.admin.email,
      role: req.admin.role,
    },
    permissions: req.admin.permissions,
    policy: req.admin.policy,
  },
}));

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

// GET /api/admin/overview - Statistics dashboard
router.get('/overview', requireAdminPermission('dashboard.read'), async (req, res, next) => {
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

router.get('/overview-v2', requireAdminPermission('dashboard.read'), async (req, res, next) => {
  try {
    const data = await getOperationalDashboard({ range: req.query.range });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

// GET /api/admin/stats - Compatibility statistics dashboard (reused old endpoint name)
router.get('/stats', requireAdminPermission('dashboard.read'), async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalItems = await ShopItem.countDocuments();
    
    const coinTransactions = await Transaction.aggregate([
      { $match: { type: 'purchase', currency: 'coin' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const coinRevenue = coinTransactions[0]?.total ?? 0;

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
      activeRoomsCount
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/admin/users - List users with filters, search, and pagination
router.get('/users', requireAdminPermission('players.read'), async (req, res, next) => {
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

    const sortBy = ['createdAt', 'username', 'coins', 'isOnline'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortQuery = { [sortBy]: sortOrder };

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash -gems -rank -eloPoints -matchmakingRating -highestEloReached -seasonHighestElo -allTimeHighestElo -rankProtectionGames -rankProtectedFloor')
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

router.get('/users/:userId/overview', requireAdminPermission('players.read'), async (req, res, next) => {
  try {
    const data = await getPlayerOverview({ playerId: req.params.userId });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/admin/users/:userId/status - Ban/Unban/Suspend User
router.patch('/users/:userId/status', requireAdminPermission('players.status.write'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể tự thay đổi trạng thái tài khoản của chính mình.' });
    }

    const outcome = await executeIdempotentAdminOperation({
      actorId: req.admin.id,
      operation: 'player.status.change',
      requestId: req.adminMutation.requestId,
      payload: { targetId: req.params.userId, status, reason: req.adminMutation.reason },
      execute: async () => {
        const userBefore = await User.findById(req.params.userId);
        if (!userBefore) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi.');
        const isBanned = status === 'banned' || status === 'suspended';
        const user = await User.findOneAndUpdate(
          { _id: req.params.userId, __v: userBefore.__v },
          { $set: { isBanned }, $inc: { __v: 1 } },
          { new: true, runValidators: true },
        ).select('-passwordHash');
        if (!user) throw new ApiError(409, 'STATE_CONFLICT', 'Dữ liệu người chơi đã thay đổi. Hãy tải lại.');
        await createAdminAudit({
          actor: req.admin,
          action: 'PLAYER_STATUS_CHANGED',
          target: { type: 'user', id: user._id.toString() },
          before: { isBanned: userBefore.isBanned, version: userBefore.__v },
          after: { isBanned: user.isBanned, version: user.__v },
          reason: req.adminMutation.reason,
          request: { operationRequestId: req.adminMutation.requestId, requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') },
        });
        return { statusCode: 200, body: { success: true, data: user } };
      },
    });

    if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
    return res.status(outcome.statusCode).json(outcome.body);
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/admin/users/:userId/role - Change User Role
router.patch(
  '/users/:userId/role',
  requireAdminPermission('players.role.write'),
  requireAdminMutationContext({ critical: true }),
  async (req, res, next) => {
  try {
    const outcome = await executeIdempotentAdminOperation({
      actorId: req.admin.id,
      operation: 'player.role.change',
      requestId: req.adminMutation.requestId,
      payload: {
        targetId: req.params.userId,
        role: req.body.role,
        reason: req.adminMutation.reason,
      },
      execute: async () => {
        const user = await changePlayerRole({
          actor: req.admin,
          targetId: req.params.userId,
          nextRole: req.body.role,
          mutation: req.adminMutation,
          request: {
            requestId: req.requestId,
            ip: req.ip,
            userAgent: req.get('user-agent'),
          },
        });
        return { statusCode: 200, body: { success: true, data: user } };
      },
    });

    if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
    return res.status(outcome.statusCode).json(outcome.body);
  } catch (error) {
    return next(error);
  }
  },
);

// PATCH /api/admin/users/:userId/currency - Adjust User Currency
router.patch('/users/:userId/currency', requireAdminPermission('economy.adjust'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    const { currency, amount, operation } = req.body;

    const outcome = await executeIdempotentAdminOperation({
      actorId: req.admin.id,
      operation: 'player.currency.adjust',
      requestId: req.adminMutation.requestId,
      payload: { targetId: req.params.userId, currency, amount, operation, reason: req.adminMutation.reason },
      execute: async () => {
        const userBefore = await User.findById(req.params.userId);
        if (!userBefore) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi.');
        const preview = previewCurrencyAdjustment({ currency, operation, amount, balances: userBefore, policy: req.admin.policy });
        const { field, before: balanceBefore, after: balanceAfter, amount: normalizedAmount } = preview;

        const user = await User.findOneAndUpdate(
          { _id: req.params.userId, __v: userBefore.__v },
          { $set: { [field]: balanceAfter }, $inc: { __v: 1 } },
          { new: true, runValidators: true },
        ).select('-passwordHash');
        if (!user) throw new ApiError(409, 'STATE_CONFLICT', 'Số dư đã thay đổi. Hãy tải lại trước khi thử lại.');

        await Transaction.create({
          userId: user._id,
          type: 'admin_adjust',
          amount: normalizedAmount,
          currency,
          balanceBefore,
          balanceAfter,
          source: 'admin_adjustment',
          createdBy: req.admin.username,
          description: `Admin economy adjustment: ${operation} ${normalizedAmount} (${req.adminMutation.reason})`,
        });
        await createAdminAudit({
          actor: req.admin,
          action: 'PLAYER_CURRENCY_ADJUSTED',
          target: { type: 'user', id: user._id.toString() },
          before: { [field]: balanceBefore, version: userBefore.__v },
          after: { [field]: balanceAfter, version: user.__v },
          reason: req.adminMutation.reason,
          request: { operationRequestId: req.adminMutation.requestId, requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') },
        });
        return { statusCode: 200, body: { success: true, data: user } };
      },
    });

    if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
    return res.status(outcome.statusCode).json(outcome.body);
  } catch (error) {
    return next(error);
  }
});

// GET /api/admin/transactions - Transaction and Audit logs viewer
router.get('/transactions', requireAdminPermission('audit.read'), async (req, res, next) => {
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
        .sort({ createdAt: -1, _id: -1 })
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
        .sort({ createdAt: -1, _id: -1 })
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

// GET /api/admin/announcements - Durable announcement history
router.get('/announcements', requireAdminPermission('announcements.read'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const query = req.query.status ? { status: req.query.status } : {};
    const [items, total] = await Promise.all([
      Announcement.find(query).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
      Announcement.countDocuments(query),
    ]);
    return res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (error) {
    return next(error);
  }
});

// POST /api/admin/announcements - Draft, schedule, or send an announcement
router.post(['/announcement', '/announcements'], requireAdminPermission('announcements.write'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    if (req.body.sendMode === 'scheduled' && !req.admin.permissions.includes('announcements.schedule')) {
      throw new ApiError(403, 'ADMIN_PERMISSION_DENIED', 'Bạn không có quyền lên lịch thông báo.');
    }
    const input = { ...req.body, message: req.body.message || req.body.text };
    return await sendIdempotentMutation(req, res, {
      operation: `announcement.${input.sendMode || 'now'}`,
      payload: input,
      execute: async () => {
        const announcement = await createAnnouncement({
          actor: req.admin,
          input,
          mutation: req.adminMutation,
          request: adminRequestContext(req),
          deliver: (record) => deliverAnnouncement({ io: req.app.get('io'), announcement: record }),
        });
        return { statusCode: 201, body: { success: true, data: announcement } };
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/announcements/:id/cancel', requireAdminPermission('announcements.schedule'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    return await sendIdempotentMutation(req, res, {
      operation: 'announcement.cancel',
      payload: { announcementId: req.params.id, reason: req.adminMutation.reason },
      execute: async () => {
        const announcement = await cancelAnnouncement({ actor: req.admin, announcementId: req.params.id, mutation: req.adminMutation, request: adminRequestContext(req) });
        return { statusCode: 200, body: { success: true, data: announcement } };
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/admin/quests - List all quests
router.get('/quests', requireAdminPermission('quests.read'), async (req, res, next) => {
  try {
    const quests = await Quest.find().sort({ createdAt: -1 });
    return res.json(quests);
  } catch (error) {
    return next(error);
  }
});

// POST /api/admin/quests - Create a new quest
router.post('/quests', requireAdminPermission('quests.write'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    return await sendIdempotentMutation(req, res, {
      operation: 'quest.create',
      payload: req.body,
      execute: async () => {
        const quest = await createQuest({
          actor: req.admin,
          input: req.body,
          mutation: req.adminMutation,
          request: adminRequestContext(req),
        });
        return { statusCode: 201, body: quest };
      },
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/admin/quests/:id - Update an existing quest
router.put('/quests/:id', requireAdminPermission('quests.write'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    return await sendIdempotentMutation(req, res, {
      operation: 'quest.update',
      payload: { questId: req.params.id, ...req.body },
      execute: async () => {
        const quest = await updateQuest({
          actor: req.admin,
          questId: req.params.id,
          input: req.body,
          mutation: req.adminMutation,
          request: adminRequestContext(req),
        });
        return { statusCode: 200, body: quest };
      },
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/admin/quests/:id - Delete a quest
router.delete('/quests/:id', requireAdminPermission('quests.write'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    return await sendIdempotentMutation(req, res, {
      operation: 'quest.delete',
      payload: { questId: req.params.id, reason: req.adminMutation.reason },
      execute: async () => {
        await deleteQuest({
          actor: req.admin,
          questId: req.params.id,
          mutation: req.adminMutation,
          request: adminRequestContext(req),
        });
        return { statusCode: 200, body: { success: true, message: 'Quest deleted successfully' } };
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
