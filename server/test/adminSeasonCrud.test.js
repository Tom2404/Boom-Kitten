const test = require('node:test');
const assert = require('node:assert/strict');

const { createSeason, deleteSeason, updateSeason } = require('../services/admin/seasonService');

const actor = { id: 'admin-1', username: 'operator-season', role: 'operator' };
const request = { requestId: 'transport-1', ip: '127.0.0.1', userAgent: 'Admin Browser' };
const input = { seasonNumber: 3, name: 'Spring', startDate: '2027-01-01', endDate: '2027-02-01', resetStrategy: 'soft_reset_ratio', softResetRatio: 0.5, resetEloValue: 1000 };

test('creates a scheduled season with normalized audit context', async () => {
  const created = { _id: 'season-3', ...input, __v: 0, toObject() { return { ...this }; } };
  let auditInput;
  const SeasonModel = { findOne: async () => null, create: async () => created };
  const result = await createSeason({ SeasonModel, audit: async (value) => { auditInput = value; }, actor, input, mutation: { requestId: 'season-create-1', reason: '' }, request });
  assert.equal(result, created);
  assert.equal(auditInput.action, 'SEASON_CREATED');
  assert.equal(auditInput.request.operationRequestId, 'season-create-1');
});

test('uses optimistic versioning when updating a season', async () => {
  const before = { _id: 'season-3', ...input, status: 'scheduled', isResetExecuted: false, __v: 2, toObject() { return { ...this }; } };
  const after = { ...before, name: 'Spring II', __v: 3 };
  let filter;
  const SeasonModel = { findById: async () => before, findOneAndUpdate: async (value) => { filter = value; return after; } };
  const result = await updateSeason({ SeasonModel, audit: async () => {}, actor, seasonId: 'season-3', input: { name: 'Spring II' }, mutation: { requestId: 'season-update-1', reason: '' }, request });
  assert.equal(result, after);
  assert.deepEqual(filter, { _id: 'season-3', __v: 2 });
});

test('deletes only a scheduled unexecuted season using its current version', async () => {
  const before = { _id: 'season-3', ...input, status: 'scheduled', isResetExecuted: false, __v: 4, toObject() { return { ...this }; } };
  let filter;
  let auditInput;
  const SeasonModel = { findById: async () => before, deleteOne: async (value) => { filter = value; return { deletedCount: 1 }; } };
  await deleteSeason({ SeasonModel, audit: async (value) => { auditInput = value; }, actor, seasonId: 'season-3', mutation: { requestId: 'season-delete-1', reason: 'Schedule replaced' }, request });
  assert.deepEqual(filter, { _id: 'season-3', __v: 4, status: 'scheduled', isResetExecuted: false });
  assert.equal(auditInput.action, 'SEASON_DELETED');
  assert.equal(auditInput.reason, 'Schedule replaced');
});
