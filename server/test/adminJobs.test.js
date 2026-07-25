const test = require('node:test');
const assert = require('node:assert/strict');

const { cancelAdminJob, getJobArtifactPermission, processNextAdminJob, sanitizeJobForRole } = require('../services/admin/jobService');

test('worker atomically claims one queued job and persists its completed result', async () => {
  let claimFilter;
  const job = { _id: 'job-1', type: 'audit_export', status: 'running', progress: {}, saveCalls: 0, async save() { this.saveCalls += 1; } };
  const AdminJobModel = { findOneAndUpdate: async (filter) => { claimFilter = filter; return job; } };
  const result = await processNextAdminJob({
    AdminJobModel,
    handlers: { audit_export: async () => ({ output: { filename: 'audit.csv', contentType: 'text/csv', content: 'a,b' }, resultSummary: { exported: 1 } }) },
    now: () => new Date('2026-07-22T10:00:00Z'),
  });
  assert.equal(claimFilter.$or[0].status, 'queued');
  assert.equal(result.status, 'completed');
  assert.equal(result.resultSummary.exported, 1);
  assert.equal(job.saveCalls, 1);
});

test('worker marks unsupported jobs failed instead of leaving them running', async () => {
  const job = { _id: 'job-2', type: 'unknown', status: 'running', progress: {}, async save() {} };
  const result = await processNextAdminJob({ AdminJobModel: { findOneAndUpdate: async () => job }, handlers: {}, now: () => new Date() });
  assert.equal(result.status, 'failed');
  assert.match(result.error.message, /Unsupported/);
});

test('worker preserves cooperative cancellation returned by a handler', async () => {
  const job = { _id: 'job-cancel', type: 'player_bulk_adjust', status: 'running', progress: {}, async save() {} };
  const result = await processNextAdminJob({
    AdminJobModel: { findOneAndUpdate: async () => job },
    handlers: { player_bulk_adjust: async () => ({ status: 'cancelled', progress: { total: 3, processed: 1, succeeded: 1, failed: 0 } }) },
    now: () => new Date('2026-07-22T10:00:00Z'),
  });
  assert.equal(result.status, 'cancelled');
  assert.equal(result.progress.processed, 1);
});

test('analyst job projection hides query, operation and downloadable output', () => {
  const safe = sanitizeJobForRole({ _id: 'j1', actorUsername: 'root', query: { email: 'private@example.com' }, operation: { amount: 100 }, output: { content: 'secret csv' }, status: 'completed' }, 'analyst');
  assert.equal(safe.query, undefined);
  assert.equal(safe.operation, undefined);
  assert.equal(safe.output, undefined);
  assert.equal(safe.status, 'completed');
});

test('analyst can see safe download metadata for export jobs without receiving inline file content', () => {
  const safe = sanitizeJobForRole({ type: 'players_export', output: { filename: 'players.csv', contentType: 'text/csv', content: 'private rows' }, status: 'completed' }, 'analyst');
  assert.deepEqual(safe.output, { filename: 'players.csv', contentType: 'text/csv', available: true });
  assert.equal(JSON.stringify(safe).includes('private rows'), false);
});

test('job artifacts require the permission of their underlying operation', () => {
  assert.equal(getJobArtifactPermission('audit_export'), 'audit.export');
  assert.equal(getJobArtifactPermission('players_export'), 'players.export');
  assert.equal(getJobArtifactPermission('player_bulk_adjust'), 'jobs.create');
});

test('job cancellation is atomic and writes an audit record with before and after state', async () => {
  const before = { _id: 'job-3', status: 'queued', toObject() { return { _id: this._id, status: this.status }; } };
  let updateFilter;
  let auditRecord;
  const updated = { _id: 'job-3', status: 'cancelled', cancelRequestedAt: new Date('2026-07-22T11:00:00Z') };
  const result = await cancelAdminJob({
    AdminJobModel: {
      findById: async () => before,
      findOneAndUpdate: async (filter) => { updateFilter = filter; return updated; },
    },
    actor: { id: 'admin-1', username: 'ops', role: 'operator' },
    jobId: 'job-3',
    mutation: { reason: 'Wrong query selected', requestId: 'cancel-1' },
    request: { requestId: 'transport-1' },
    audit: async (value) => { auditRecord = value; },
    now: () => new Date('2026-07-22T11:00:00Z'),
  });
  assert.deepEqual(updateFilter.status.$in, ['queued', 'running']);
  assert.equal(result.status, 'cancelled');
  assert.equal(auditRecord.action, 'ADMIN_JOB_CANCEL_REQUESTED');
  assert.equal(auditRecord.before.status, 'queued');
  assert.equal(auditRecord.after.status, 'cancelled');
  assert.equal(auditRecord.request.operationRequestId, 'cancel-1');
});
