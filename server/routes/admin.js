const express = require('express');
const User = require('../models/User');
const ShopItem = require('../models/ShopItem');
const Quest = require('../models/Quest');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { changePlayerRole } = require('../services/admin/roleService');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const { createAdminAudit } = require('../services/admin/auditService');
const { ApiError } = require('../utils/apiResponse');
const { createQuest, deleteQuest, updateQuest } = require('../services/admin/questService');
const { getPlayerOverview } = require('../services/admin/playerOverviewService');
const { previewCurrencyAdjustment } = require('../services/admin/economyAdjustmentService');
const {
  assertCanManageTarget,
  createManagedUser,
  softDeleteManagedUser,
  updateManagedUser,
} = require('../services/admin/userAdminService');

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
    const totalUsers = await User.countDocuments({ deletedAt: null });
    const activeUsers = await User.countDocuments({ deletedAt: null, isOnline: true });
    const bannedUsers = await User.countDocuments({ deletedAt: null, isBanned: true });
    const totalShopItems = await ShopItem.countDocuments();
    const activeShopItems = await ShopItem.countDocuments({ isActive: { $ne: false } });
    const totalMissions = await Quest.countDocuments();
    const activeMissions = await Quest.countDocuments({ isActive: true });

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        bannedUsers,
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

// GET /api/admin/users - List users with filters, search, and pagination
router.get('/users', requireAdminPermission('players.read'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    const query = { deletedAt: null };

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
      } else if (status === 'deleted') {
        delete query.deletedAt;
        query.deletedAt = { $type: 'date' };
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

router.post('/users', requireAdminPermission('players.create'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    return await sendIdempotentMutation(req, res, {
      operation: 'user.create',
      payload: { username: req.body.username, email: req.body.email, role: req.body.role || 'user' },
      execute: async () => ({
        statusCode: 201,
        body: {
          success: true,
          data: await createManagedUser({
            actor: req.admin,
            input: req.body,
            mutation: req.adminMutation,
            request: adminRequestContext(req),
          }),
        },
      }),
    });
  } catch (error) {
    return next(error?.code === 11000 ? new ApiError(409, 'STATE_CONFLICT', 'Username hoặc email đã tồn tại.') : error);
  }
});

router.patch('/users/:userId', requireAdminPermission('players.update'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    return await sendIdempotentMutation(req, res, {
      operation: 'user.update',
      payload: { targetId: req.params.userId, username: req.body.username, email: req.body.email, expectedVersion: req.body.expectedVersion },
      execute: async () => ({
        statusCode: 200,
        body: {
          success: true,
          data: await updateManagedUser({
            actor: req.admin,
            targetId: req.params.userId,
            input: req.body,
            mutation: req.adminMutation,
            request: adminRequestContext(req),
          }),
        },
      }),
    });
  } catch (error) {
    return next(error?.code === 11000 ? new ApiError(409, 'STATE_CONFLICT', 'Username hoặc email đã tồn tại.') : error);
  }
});

router.delete('/users/:userId', requireAdminPermission('players.delete'), requireAdminMutationContext({ critical: true }), async (req, res, next) => {
  try {
    return await sendIdempotentMutation(req, res, {
      operation: 'user.soft_delete',
      payload: { targetId: req.params.userId, expectedVersion: req.body.expectedVersion, reason: req.adminMutation.reason },
      execute: async () => ({
        statusCode: 200,
        body: {
          success: true,
          data: await softDeleteManagedUser({
            actor: req.admin,
            targetId: req.params.userId,
            expectedVersion: req.body.expectedVersion,
            mutation: req.adminMutation,
            request: adminRequestContext(req),
          }),
        },
      }),
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
    if (!['active', 'banned'].includes(status)) throw new ApiError(422, 'VALIDATION_ERROR', 'Trạng thái người dùng không hợp lệ.');

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
        if (!userBefore || userBefore.deletedAt) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi.');
        assertCanManageTarget(req.admin, userBefore);
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
        if (!userBefore || userBefore.deletedAt) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi.');
        assertCanManageTarget(req.admin, userBefore);
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
