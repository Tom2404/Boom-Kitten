const test = require('node:test');
const assert = require('node:assert/strict');

const { lockWager, settleWager } = require('../services/wagerLedgerService');

function sessionFactory() {
  return async () => ({
    withTransaction: async (work) => work(),
    endSession: async () => {},
  });
}

function query(value) {
  return { session: async () => value };
}

test('locks every participant once and writes matching Coin ledger rows', async () => {
  const balances = new Map([['a', 100], ['b', 50]]);
  const transactions = [];
  let stored;
  const UserModel = {
    findOneAndUpdate(filter) {
      const coins = balances.get(filter._id);
      if (coins < filter.coins.$gte) return null;
      balances.set(filter._id, coins - filter.coins.$gte);
      return { _id: filter._id, coins };
    },
  };
  const WagerModel = {
    findOne: () => query(null),
    create: async ([value]) => [stored = value],
  };
  const TransactionModel = { create: async ([value]) => transactions.push(value) };

  await lockWager({
    roomCode: 'ABC123', reference: 'ABC123:1', players: [{ userId: 'a' }, { userId: 'b' }],
    stake: 25, requestId: 'lock-1', UserModel, WagerModel, TransactionModel, startSession: sessionFactory(),
  });

  assert.deepEqual([...balances.values()], [75, 25]);
  assert.equal(stored.state, 'locked');
  assert.equal(transactions.reduce((sum, row) => sum + row.amount, 0), 50);
});

test('settlement pays exactly the locked pot and records a terminal state', async () => {
  const balances = new Map([['a', 75], ['b', 25]]);
  const transactions = [];
  const wager = {
    stake: 25,
    participants: [
      { userId: 'a', lockedCoins: 25, payoutCoins: 0 },
      { userId: 'b', lockedCoins: 25, payoutCoins: 0 },
    ],
    save: async function save() { return this; },
  };
  const UserModel = {
    findByIdAndUpdate(userId, update) {
      const coins = balances.get(userId);
      balances.set(userId, coins + update.$inc.coins);
      return { _id: userId, coins };
    },
  };
  const WagerModel = {
    findOne(filter) {
      return query(filter.state === 'locked' ? wager : null);
    },
  };
  const TransactionModel = { create: async ([value]) => transactions.push(value) };

  const settled = await settleWager({
    roomCode: 'ABC123', reference: 'ABC123:1',
    placements: [{ userId: 'a', placement: 1 }, { userId: 'b', placement: 2 }],
    requestId: 'settle-1', UserModel, WagerModel, TransactionModel, startSession: sessionFactory(),
  });

  assert.equal(settled.state, 'settled');
  assert.deepEqual([...balances.values()], [125, 25]);
  assert.equal(transactions.reduce((sum, row) => sum + row.amount, 0), 50);
});
