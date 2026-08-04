const bcrypt = require('bcrypt');
const { ApiError } = require('../utils/apiResponse');

const ALLOWED_AVATARS = new Set([
  '',
  'angry_kitten',
  'crown_kitten',
  'space_kitten',
  'bomb_kitten',
  'sleepy_kitten',
  'cool_kitten',
]);

function normalizeProfileUpdate(input = {}) {
  const username = typeof input.username === 'string' ? input.username.trim() : '';
  const avatar = typeof input.avatar === 'string' ? input.avatar.trim() : '';
  if (username.length < 3 || username.length > 24) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Tên người chơi phải có từ 3 đến 24 ký tự.');
  }
  if (!ALLOWED_AVATARS.has(avatar)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Avatar không được hỗ trợ. Hãy chọn một avatar mặc định.');
  }
  return { username, avatar };
}

function assertStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 10 || password.length > 72) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Mật khẩu phải có từ 10 đến 72 ký tự.');
  }
}

async function changePassword({ user, currentPassword, newPassword, compare = bcrypt.compare, hash = bcrypt.hash }) {
  if (!user) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người dùng.');
  assertStrongPassword(newPassword);
  if (typeof currentPassword !== 'string' || !(await compare(currentPassword, user.passwordHash))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Mật khẩu hiện tại không đúng.');
  }
  if (await compare(newPassword, user.passwordHash)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Mật khẩu mới phải khác mật khẩu hiện tại.');
  }
  user.passwordHash = await hash(newPassword, 12);
  user.refreshTokenHash = null;
  user.refreshTokenExpiresAt = null;
  await user.save();
}

module.exports = { ALLOWED_AVATARS, assertStrongPassword, changePassword, normalizeProfileUpdate };
