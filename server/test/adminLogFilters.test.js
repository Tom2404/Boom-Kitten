const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { resolveLogUserIds } = require('../utils/adminLogFilters');

test('resolveLogUserIds keeps a valid ObjectId without querying users', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  const result = await resolveLogUserIds(id, async () => {
    throw new Error('lookup should not run');
  });

  assert.deepEqual(result, [id]);
});

test('resolveLogUserIds resolves username or email text instead of casting it as ObjectId', async () => {
  const result = await resolveLogUserIds('Tom', async (search) => {
    assert.equal(search, 'Tom');
    return [{ _id: 'user-tom' }, { _id: 'user-tommy' }];
  });

  assert.deepEqual(result, ['user-tom', 'user-tommy']);
});

test('resolveLogUserIds returns an empty list when no user matches', async () => {
  const result = await resolveLogUserIds('missing-user', async () => []);

  assert.deepEqual(result, []);
});
