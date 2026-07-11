const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLegacyRank } = require('../utils/rankNormalization');
const User = require('../models/User');

test('normalizeLegacyRank maps legacy tier-only ranks to valid subdivision ranks', () => {
  assert.equal(normalizeLegacyRank('Bronze'), 'Bronze II');
  assert.equal(normalizeLegacyRank('Silver'), 'Silver III');
  assert.equal(normalizeLegacyRank('Gold'), 'Gold III');
  assert.equal(normalizeLegacyRank('Platinum'), 'Platinum IV');
  assert.equal(normalizeLegacyRank('Diamond'), 'Diamond IV');
});

test('normalizeLegacyRank preserves already valid ranks and Legend', () => {
  assert.equal(normalizeLegacyRank('Bronze II'), 'Bronze II');
  assert.equal(normalizeLegacyRank('Legend'), 'Legend');
});

test('normalizeLegacyRank converts removed subdivisions and empty values', () => {
  assert.equal(normalizeLegacyRank('Bronze IV'), 'Bronze II');
  assert.equal(normalizeLegacyRank('Silver IV'), 'Silver III');
  assert.equal(normalizeLegacyRank('Gold IV'), 'Gold III');
  assert.equal(normalizeLegacyRank(''), 'Bronze II');
  assert.equal(normalizeLegacyRank(null), 'Bronze II');
});

test('User validation repairs a legacy Bronze rank before enum validation', async () => {
  const user = new User({
    username: 'legacy-rank-user',
    email: 'legacy-rank@example.com',
    passwordHash: 'hash',
    rank: 'Bronze',
  });

  await user.validate();

  assert.equal(user.rank, 'Bronze II');
});
