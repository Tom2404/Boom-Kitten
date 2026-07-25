const User = require('../../models/User');
const { ApiError } = require('../../utils/apiResponse');
const { ADMIN_ROLES, normalizeAdminRole } = require('../../utils/adminPermissions');
const { createAdminAudit } = require('./auditService');

const ASSIGNABLE_ROLES = new Set(['user', ...ADMIN_ROLES]);

async function changePlayerRole({
  UserModel = User,
  audit = createAdminAudit,
  actor,
  targetId,
  nextRole,
  mutation,
  request = {},
}) {
  if (!ASSIGNABLE_ROLES.has(nextRole)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Vai trò không hợp lệ.', {
      fields: { role: 'Không nằm trong allowlist' },
    });
  }
  if (String(targetId) === String(actor.id)) {
    throw new ApiError(409, 'ADMIN_SELF_ACTION_DENIED', 'Bạn không thể thay đổi vai trò của chính mình.');
  }

  const playerBefore = await UserModel.findById(targetId);
  if (!playerBefore) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi.');

  const previousRole = normalizeAdminRole(playerBefore.role);
  if (previousRole === 'super_admin' && nextRole !== 'super_admin') {
    const remainingSuperAdmins = await UserModel.countDocuments({
      _id: { $ne: targetId },
      role: { $in: ['admin', 'super_admin'] },
      isBanned: { $ne: true },
    });
    if (remainingSuperAdmins === 0) {
      throw new ApiError(409, 'LAST_SUPER_ADMIN', 'Không thể hạ quyền super admin cuối cùng.');
    }
  }

  const player = await UserModel.findOneAndUpdate(
    { _id: targetId, __v: playerBefore.__v },
    { $set: { role: nextRole }, $inc: { __v: 1 } },
    { new: true, runValidators: true },
  ).select('-passwordHash');

  if (!player) {
    throw new ApiError(409, 'STATE_CONFLICT', 'Dữ liệu người chơi đã thay đổi. Hãy tải lại trước khi thử lại.');
  }

  await audit({
    actor,
    action: 'PLAYER_ROLE_CHANGED',
    target: { type: 'user', id: String(player._id) },
    before: { role: playerBefore.role, version: playerBefore.__v },
    after: { role: player.role, version: player.__v },
    reason: mutation.reason,
    request: {
      ...request,
      operationRequestId: mutation.requestId,
    },
  });

  return player;
}

module.exports = { ASSIGNABLE_ROLES, changePlayerRole };
