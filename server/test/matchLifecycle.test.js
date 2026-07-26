const test = require('node:test');
const assert = require('node:assert/strict');

const { completeMatchHistory, startMatchHistory } = require('../services/matchLifecycleService');

test('creates one started lifecycle record with registered and guest participant ids', async () => {
  let payload;
  const created = { _id: 'history-1' };
  const GameHistoryModel = { create: async (value) => { payload = value; return created; } };
  const result = await startMatchHistory({
    GameHistoryModel,
    isValidObjectId: (value) => value.startsWith('db-'),
    room: { code: 'ABC123', gameMode: 'matchmaking', edition: 'original', players: [{ userId: 'db-1' }, { userId: 'guest-2' }] },
    now: new Date('2027-02-01T10:00:00Z'),
  });

  assert.equal(result, 'history-1');
  assert.equal(payload.status, 'started');
  assert.equal(payload.gameMode, 'matchmaking');
  assert.deepEqual(payload.participantIds, ['db-1', 'guest-2']);
  assert.deepEqual(payload.players, [{ userId: 'db-1' }]);
});

test('atomically completes the started record and records real duration', async () => {
  let filter;
  let update;
  const completed = { _id: 'history-1', status: 'completed' };
  const GameHistoryModel = { findOneAndUpdate: async (value, mutation) => { filter = value; update = mutation; return completed; } };
  const result = await completeMatchHistory({
    GameHistoryModel,
    room: { code: 'ABC123', analyticsHistoryId: 'history-1', startedAt: new Date('2027-02-01T10:00:00Z'), gameState: { discardPile: [{}, {}] } },
    validPlayers: [{ userId: 'db-1', result: 'win', eloChange: 10 }],
    winnerId: 'db-1',
    now: new Date('2027-02-01T10:05:30Z'),
  });

  assert.equal(result, completed);
  assert.deepEqual(filter, { _id: 'history-1', status: 'started' });
  assert.equal(update.$set.duration, 330);
  assert.equal(update.$set.cardsPlayed, 2);
  assert.equal(update.$set.status, 'completed');
  assert.equal(Object.hasOwn(update.$set, 'seasonId'), false);
});

test('does not create a duplicate if an existing lifecycle record was already completed', async () => {
  let creates = 0;
  const GameHistoryModel = {
    findOneAndUpdate: async () => null,
    findById: async () => ({ _id: 'history-1', status: 'completed' }),
    create: async () => { creates += 1; },
  };
  const result = await completeMatchHistory({
    GameHistoryModel,
    room: { code: 'ABC123', analyticsHistoryId: 'history-1', startedAt: new Date(), gameState: { discardPile: [] } },
    validPlayers: [],
    winnerId: 'db-1',
  });
  assert.equal(result.status, 'completed');
  assert.equal(creates, 0);
});

test('records Tournament placements through the shared match completion lifecycle', async () => {
  let resultPayload;
  await completeMatchHistory({
    GameHistoryModel: { create: async () => ({ _id: 'history-tournament', status: 'completed' }) },
    room: {
      code: 'TOUR01',
      gameMode: 'tournament',
      tournamentMatchReference: 'cup-1:group-a-m1',
      startedAt: new Date('2027-02-01T10:00:00Z'),
      gameState: { discardPile: [], players: [{ userId: 'user-1' }, { userId: 'user-2' }] },
    },
    validPlayers: [{ userId: 'user-1', rank: 1 }, { userId: 'user-2', rank: 2 }],
    winnerId: 'user-1',
    recordTournamentResult: async (payload) => { resultPayload = payload; },
  });
  assert.deepEqual(resultPayload, {
    matchReference: 'cup-1:group-a-m1',
    placements: [{ userId: 'user-1', placement: 1 }, { userId: 'user-2', placement: 2 }],
  });
});
