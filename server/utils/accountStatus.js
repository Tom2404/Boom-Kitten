function getAccountRestriction(user, now = new Date()) {
  if (user?.isBanned) return { type: 'banned', message: 'Tài khoản đã bị khóa vĩnh viễn.' };
  if (user?.suspendedUntil && new Date(user.suspendedUntil) > now) return { type: 'suspended', until: new Date(user.suspendedUntil), message: `Tài khoản bị tạm đình chỉ đến ${new Date(user.suspendedUntil).toISOString()}.` };
  return null;
}

module.exports = { getAccountRestriction };
