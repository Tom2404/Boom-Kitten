const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildPlayerBulkQuery,
  createPlayerBulkPreview,
  enqueuePlayerBulkExecution,
  enqueuePlayersExport,
  getBulkOperationPermission,
  handlePlayerBulkAdjust,
  handlePlayersExport,
} = require('../services/admin/playerBulkJobService');

function queryResult(rows) {
  return {
    select() { return this; },
    sort() { return this; },
    limit() { return this; },
    lean: async () => rows,
  };
}

test('bulk player query allowlists filters and escapes search text', () => {
  const query = buildPlayerBulkQuery({ search: 'a+b', role: 'operator', status: 'active', isOnline: 'true' });
  assert.equal(query.role, 'operator');
  assert.equal(query.isBanned, false);
  assert.equal(query.isOnline, true);
  assert.equal(query.$or[0].username.$regex, 'a\\+b');
  assert.throws(
    () => buildPlayerBulkQuery({ role: { $ne: 'user' } }),
    (error) => error.code === 'VALIDATION_ERROR',
  );
});

test('bulk operation permission follows the nested operation type', () => {
  assert.equal(getBulkOperationPermission({ type: 'currency' }), 'economy.adjust');
  assert.equal(getBulkOperationPermission({ type: 'elo' }), 'players.elo.write');
  assert.throws(() => getBulkOperationPermission({ type: 'role' }), (error) => error.code === 'VALIDATION_ERROR');
});

test('bulk preview counts the full query, calculates impact, and does not mutate players', async () => {
  const players = [
    { _id: 'p1', username: 'one', coins: 100, gems: 2, eloPoints: 1000 },
    { _id: 'p2', username: 'two', coins: 250, gems: 4, eloPoints: 1200 },
  ];
  let created;
  const UserModel = {
    countDocuments: async () => players.length,
    find: () => queryResult(players),
    findOneAndUpdate: async () => { throw new Error('preview must not mutate'); },
  };
  const AdminJobModel = { create: async (value) => { created = value; return { _id: 'preview-1', ...value }; } };

  const job = await createPlayerBulkPreview({
    UserModel,
    AdminJobModel,
    actor: { id: 'admin-1', username: 'ops', role: 'operator' },
    filters: { status: 'active' },
    operation: { type: 'currency', currency: 'coin', operation: 'add', amount: 50 },
    mutation: { reason: 'Support campaign', requestId: 'bulk-preview-1' },
    policy: { maxBulkTargets: 1000, maxCurrencyAdjustment: { coin: 10000, gem: 500 }, maxEloDelta: 500 },
    tokenFactory: () => 'preview-token',
    now: () => new Date('2026-07-22T00:00:00Z'),
  });

  assert.equal(job.status, 'preview');
  assert.equal(created.targetCount, 2);
  assert.equal(created.resultSummary.totalAbsoluteDelta, 100);
  assert.deepEqual(created.targetSample.map((item) => item.after), [150, 300]);
  assert.equal(created.previewToken, 'preview-token');
});

test('bulk preview rejects a query above the actor target limit', async () => {
  await assert.rejects(
    createPlayerBulkPreview({
      UserModel: { countDocuments: async () => 1001 },
      AdminJobModel: { create: async () => { throw new Error('must not create'); } },
      actor: { id: 'admin-1', username: 'ops', role: 'operator' },
      filters: {},
      operation: { type: 'elo', elo: 1200 },
      mutation: { reason: 'Rank repair', requestId: 'bulk-preview-2' },
      policy: { maxBulkTargets: 1000, maxEloDelta: 500 },
    }),
    (error) => error.code === 'POLICY_LIMIT_EXCEEDED' && error.details.targetCount === 1001,
  );
});

test('bulk execution atomically consumes an unexpired preview and copies its frozen target set', async () => {
  const preview = {
    _id: 'preview-1',
    query: { filters: { role: 'user' }, targetIds: ['p1', 'p2'] },
    operation: { type: 'elo', elo: 1250 },
    targetCount: 2,
    targetSample: [{ id: 'p1', before: 1000, after: 1250 }],
    resultSummary: { totalAbsoluteDelta: 500 },
  };
  let consumeFilter;
  let created;
  const AdminJobModel = {
    findOneAndUpdate: async (filter) => { consumeFilter = filter; return preview; },
    create: async (value) => { created = value; return { _id: 'job-1', ...value }; },
  };
  const job = await enqueuePlayerBulkExecution({
    AdminJobModel,
    actor: { id: 'admin-1', username: 'ops', role: 'operator' },
    previewToken: 'preview-token',
    mutation: { reason: 'Approved rank repair', requestId: 'bulk-execution-1' },
    now: () => new Date('2026-07-22T01:00:00Z'),
  });
  assert.equal(consumeFilter.previewToken, 'preview-token');
  assert.equal(consumeFilter.previewConsumedAt, null);
  assert.equal(created.status, 'queued');
  assert.deepEqual(created.query.targetIds, ['p1', 'p2']);
  assert.equal(created.sourcePreviewId, 'preview-1');
  assert.equal(job.requestId, 'bulk-execution-1');
});

test('bulk worker stops cooperatively and preserves completed-row progress', async () => {
  const job = {
    _id: 'job-1',
    actorId: 'admin-1',
    actorUsername: 'ops',
    actorRole: 'operator',
    requestId: 'bulk-run-1',
    reason: 'Support repair',
    query: {},
    operation: { type: 'currency', currency: 'coin', operation: 'add', amount: 10 },
    progress: {},
    saveCalls: 0,
    async save() { this.saveCalls += 1; },
  };
  const ids = [{ _id: 'p1' }, { _id: 'p2' }];
  const users = {
    p1: { _id: 'p1', username: 'one', coins: 100, gems: 0, __v: 0 },
    p2: { _id: 'p2', username: 'two', coins: 100, gems: 0, __v: 0 },
  };
  let cancellationChecks = 0;
  let updates = 0;
  const result = await handlePlayerBulkAdjust(job, {
    UserModel: {
      find: () => queryResult(ids),
      findById: async (id) => ({ ...users[id] }),
      findOneAndUpdate: async (_filter, update) => { updates += 1; return { ...users.p1, coins: update.$set.coins, __v: 1 }; },
    },
    TransactionModel: { create: async () => ({}) },
    audit: async () => ({}),
    executeIdempotent: async ({ execute }) => execute(),
    isCancellationRequested: async () => { cancellationChecks += 1; return cancellationChecks > 1; },
  });

  assert.equal(result.status, 'cancelled');
  assert.equal(updates, 1);
  assert.deepEqual(result.progress, { total: 2, processed: 1, succeeded: 1, failed: 0 });
  assert.match(result.output.content, /p1/);
});

test('player export job serializes the full filtered query without authentication fields', async () => {
  const players = [{ _id: 'p1', username: '=formula', email: 'one@example.test', role: 'user', isBanned: false, rank: 'Bronze II', eloPoints: 1000, coins: 50, gems: 2, passwordHash: 'must-not-export' }];
  const result = await handlePlayersExport({ _id: 'export-1', query: { filters: { status: 'active' } } }, { UserModel: { find: () => queryResult(players) } });
  assert.equal(result.progress.processed, 1);
  assert.match(result.output.content, /one@example\.test/);
  assert.match(result.output.content, /"'=formula"/);
  assert.doesNotMatch(result.output.content, /must-not-export/);
});

test('player export enqueue records target count and enforces the system export limit', async () => {
  let created;
  const job = await enqueuePlayersExport({
    UserModel: { countDocuments: async () => 250 },
    AdminJobModel: { create: async (value) => { created = value; return value; } },
    actor: { id: 'admin-1', username: 'analyst', role: 'analyst' },
    filters: { role: 'user' },
    mutation: { reason: 'Export players', requestId: 'export-1' },
  });
  assert.equal(job.type, 'players_export');
  assert.equal(created.targetCount, 250);
  await assert.rejects(
    enqueuePlayersExport({ UserModel: { countDocuments: async () => 50001 }, AdminJobModel: { create: async () => null }, actor: { id: 'a', username: 'a', role: 'super_admin' }, filters: {}, mutation: { reason: 'Export', requestId: 'export-2' } }),
    (error) => error.code === 'POLICY_LIMIT_EXCEEDED',
  );
});
