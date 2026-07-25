const test = require('node:test');
const assert = require('node:assert/strict');

const { getAccountRestriction } = require('../utils/accountStatus');

test('treats an expired suspension as active without mutating the user record', () => {
  const result = getAccountRestriction({ isBanned: false, suspendedUntil: new Date('2027-01-01T00:00:00Z') }, new Date('2027-02-01T00:00:00Z'));
  assert.equal(result, null);
});

test('distinguishes permanent bans and active temporary suspensions', () => {
  assert.equal(getAccountRestriction({ isBanned: true }, new Date()).type, 'banned');
  assert.equal(getAccountRestriction({ isBanned: false, suspendedUntil: new Date('2027-03-01T00:00:00Z') }, new Date('2027-02-01T00:00:00Z')).type, 'suspended');
});
