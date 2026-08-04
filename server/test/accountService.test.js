const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ALLOWED_AVATARS,
  changePassword,
  normalizeProfileUpdate,
} = require('../services/accountService');

test('profile updates trim usernames and accept only supported preset avatars', () => {
  assert.deepEqual(normalizeProfileUpdate({ username: '  Mèo Cam  ', avatar: 'cool_kitten' }), {
    username: 'Mèo Cam',
    avatar: 'cool_kitten',
  });
  assert.equal(ALLOWED_AVATARS.has('cool_kitten'), true);
  assert.throws(
    () => normalizeProfileUpdate({ username: 'Mèo Cam', avatar: 'data:image/png;base64,abc' }),
    (error) => error.statusCode === 422 && error.code === 'VALIDATION_ERROR',
  );
});

test('profile updates reject short or excessively long usernames', () => {
  assert.throws(() => normalizeProfileUpdate({ username: 'ab', avatar: '' }), /3 đến 24/);
  assert.throws(() => normalizeProfileUpdate({ username: 'a'.repeat(25), avatar: '' }), /3 đến 24/);
});

test('changing password verifies the current password, hashes the new password, and revokes refresh sessions', async () => {
  const user = {
    passwordHash: 'old-hash',
    refreshTokenHash: 'refresh-hash',
    refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    async save() { this.saved = true; },
  };
  const compare = async (plain, hash) => plain === 'correct-current' && hash === 'old-hash';
  const hash = async (plain, rounds) => `${rounds}:${plain}`;

  await changePassword({ user, currentPassword: 'correct-current', newPassword: 'new-password-123', compare, hash });

  assert.equal(user.passwordHash, '12:new-password-123');
  assert.equal(user.refreshTokenHash, null);
  assert.equal(user.refreshTokenExpiresAt, null);
  assert.equal(user.saved, true);
});

test('changing password rejects an incorrect current password and weak new password', async () => {
  const user = { passwordHash: 'old-hash' };
  await assert.rejects(
    changePassword({ user, currentPassword: 'wrong', newPassword: 'new-password-123', compare: async () => false }),
    (error) => error.statusCode === 401,
  );
  await assert.rejects(
    changePassword({ user, currentPassword: 'correct', newPassword: 'short', compare: async () => true }),
    (error) => error.statusCode === 422,
  );
});
