const test = require('node:test');
const assert = require('node:assert/strict');

const {
  beginAdminOperation,
  executeIdempotentAdminOperation,
  hashOperationPayload,
} = require('../services/admin/idempotencyService');
const { ApiError } = require('../utils/apiResponse');

test('hashes equivalent payloads deterministically regardless of key order', () => {
  assert.equal(
    hashOperationPayload({ amount: 100, operation: 'add', nested: { b: 2, a: 1 } }),
    hashOperationPayload({ nested: { a: 1, b: 2 }, operation: 'add', amount: 100 }),
  );
});

test('replays a completed operation with the same payload', async () => {
  const payload = { targetId: 'player-1', amount: 100 };
  const stored = {
    status: 'completed',
    payloadHash: hashOperationPayload(payload),
    responseStatus: 200,
    responseBody: { success: true, balanceAfter: 1100 },
  };
  const OperationModel = {
    create: async () => { const error = new Error('duplicate'); error.code = 11000; throw error; },
    findOne: async () => stored,
  };

  const result = await beginAdminOperation({
    OperationModel,
    actorId: 'admin-1',
    operation: 'player.currency.adjust',
    requestId: 'op-1',
    payload,
  });

  assert.deepEqual(result, {
    replayed: true,
    statusCode: 200,
    body: { success: true, balanceAfter: 1100 },
  });
});

test('rejects request-id reuse with a different payload', async () => {
  const OperationModel = {
    create: async () => { const error = new Error('duplicate'); error.code = 11000; throw error; },
    findOne: async () => ({ status: 'completed', payloadHash: hashOperationPayload({ amount: 50 }) }),
  };

  await assert.rejects(
    beginAdminOperation({ OperationModel, actorId: 'admin-1', operation: 'player.currency.adjust', requestId: 'op-1', payload: { amount: 100 } }),
    (error) => error.code === 'IDEMPOTENCY_CONFLICT' && error.statusCode === 409,
  );
});

test('allows only one execution and stores its response for replay', async () => {
  let executions = 0;
  let saved = false;
  const record = {
    status: 'pending',
    save: async function save() { saved = true; },
  };
  const OperationModel = { create: async () => record };

  const result = await executeIdempotentAdminOperation({
    OperationModel,
    actorId: 'admin-1',
    operation: 'player.currency.adjust',
    requestId: 'op-1',
    payload: { amount: 100 },
    execute: async () => {
      executions += 1;
      return { statusCode: 200, body: { success: true, balanceAfter: 1100 } };
    },
  });

  assert.equal(executions, 1);
  assert.equal(saved, true);
  assert.equal(record.status, 'completed');
  assert.deepEqual(record.responseBody, { success: true, balanceAfter: 1100 });
  assert.deepEqual(result, { replayed: false, statusCode: 200, body: { success: true, balanceAfter: 1100 } });
});

test('stores deterministic operational errors instead of leaving a pending claim', async () => {
  let saved = false;
  const record = {
    status: 'pending',
    save: async function save() { saved = true; },
  };
  const OperationModel = { create: async () => record };

  await assert.rejects(
    executeIdempotentAdminOperation({
      OperationModel,
      actorId: 'admin-1',
      operation: 'player.currency.adjust',
      requestId: 'op-invalid',
      payload: { amount: -1 },
      execute: async () => { throw new ApiError(422, 'VALIDATION_ERROR', 'Amount is invalid', { fields: { amount: 'Invalid' } }); },
    }),
    (error) => error.code === 'VALIDATION_ERROR',
  );

  assert.equal(saved, true);
  assert.equal(record.status, 'completed');
  assert.equal(record.responseStatus, 422);
  assert.deepEqual(record.responseBody, {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Amount is invalid',
      details: { fields: { amount: 'Invalid' } },
    },
  });
});
