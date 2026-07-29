const bcrypt = require('bcrypt');
const User = require('../../models/User');
const { ApiError } = require('../../utils/apiResponse');
const { createAdminAudit } = require('./auditService');

function publicUser(user) {
  const safe = user?.toObject ? user.toObject() : { ...user };
  delete safe.passwordHash;
  return safe;
}

function normalizeIdentity(input) {
  const username = String(input.username || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  if (username.length < 3 || username.length > 40) throw new ApiError(422, 'VALIDATION_ERROR', 'Username phải từ 3 đến 40 ký tự.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(422, 'VALIDATION_ERROR', 'Email không hợp lệ.');
  return { username, email };
}

function assertCanManageTarget(actor, target) {
  if (actor.role !== 'super_admin' && target.role !== 'user') {
    throw new ApiError(403, 'ADMIN_PERMISSION_DENIED', 'Chỉ super admin được quản lý tài khoản quản trị.');
  }
}

async function createManagedUser({
  UserModel = User,
  hashPassword = (password) => bcrypt.hash(password, 10),
  audit = createAdminAudit,
  actor,
  input,
  mutation,
  request = {},
}) {
  const role = input.role || 'user';
  if (!['user', 'admin', 'super_admin'].includes(role)) throw new ApiError(422, 'VALIDATION_ERROR', 'Vai trò không hợp lệ.');
  if (role !== 'user' && actor.role !== 'super_admin') throw new ApiError(403, 'ADMIN_PERMISSION_DENIED', 'Chỉ super admin được tạo tài khoản quản trị.');
  const identity = normalizeIdentity(input);
  const password = String(input.password || '');
  if (password.length < 10 || password.length > 128) throw new ApiError(422, 'VALIDATION_ERROR', 'Mật khẩu tạm thời phải từ 10 đến 128 ký tự.');
  const user = await UserModel.create({ ...identity, passwordHash: await hashPassword(password), role });
  await audit({
    actor,
    action: 'USER_CREATED',
    target: { type: 'user', id: String(user._id) },
    before: null,
    after: { username: user.username, email: user.email, role: user.role },
    reason: mutation.reason,
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return publicUser(user);
}

async function updateManagedUser({
  UserModel = User,
  audit = createAdminAudit,
  actor,
  targetId,
  input,
  mutation,
  request = {},
}) {
  const before = await UserModel.findById(targetId);
  if (!before || before.deletedAt) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người dùng.');
  assertCanManageTarget(actor, before);
  const identity = normalizeIdentity({ username: input.username ?? before.username, email: input.email ?? before.email });
  const user = await UserModel.findOneAndUpdate(
    { _id: targetId, __v: Number(input.expectedVersion), deletedAt: null },
    { $set: identity, $inc: { __v: 1 } },
    { new: true, runValidators: true },
  ).select('-passwordHash');
  if (!user) throw new ApiError(409, 'STATE_CONFLICT', 'Dữ liệu người dùng đã thay đổi. Hãy tải lại.');
  await audit({
    actor,
    action: 'USER_UPDATED',
    target: { type: 'user', id: String(user._id) },
    before: { username: before.username, email: before.email, version: before.__v },
    after: { username: user.username, email: user.email, version: user.__v },
    reason: mutation.reason,
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return user;
}

async function softDeleteManagedUser({
  UserModel = User,
  audit = createAdminAudit,
  actor,
  targetId,
  expectedVersion,
  mutation,
  request = {},
  now = new Date(),
}) {
  if (String(targetId) === String(actor.id)) throw new ApiError(409, 'ADMIN_SELF_ACTION_DENIED', 'Bạn không thể xóa tài khoản của chính mình.');
  const before = await UserModel.findById(targetId);
  if (!before || before.deletedAt) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người dùng.');
  assertCanManageTarget(actor, before);
  const user = await UserModel.findOneAndUpdate(
    { _id: targetId, __v: Number(expectedVersion), deletedAt: null },
    { $set: { deletedAt: now, isBanned: true, isOnline: false }, $inc: { __v: 1 } },
    { new: true, runValidators: true },
  ).select('-passwordHash');
  if (!user) throw new ApiError(409, 'STATE_CONFLICT', 'Dữ liệu người dùng đã thay đổi. Hãy tải lại.');
  await audit({
    actor,
    action: 'USER_SOFT_DELETED',
    target: { type: 'user', id: String(user._id) },
    before: { role: before.role, deletedAt: before.deletedAt, version: before.__v },
    after: { role: user.role, deletedAt: user.deletedAt, version: user.__v },
    reason: mutation.reason,
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return user;
}

module.exports = { assertCanManageTarget, createManagedUser, softDeleteManagedUser, updateManagedUser };
