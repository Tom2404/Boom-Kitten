const test = require('node:test');
const assert = require('node:assert/strict');
const { collectIncidentSignals, getNextIncidentStatus, ingestIncidentSignal, sanitizeIncidentForRole, updateIncident } = require('../services/admin/incidentService');

test('incident state machine allows acknowledge/resolve but keeps resolved terminal', () => {
  assert.equal(getNextIncidentStatus('open', 'acknowledged'), 'acknowledged');
  assert.equal(getNextIncidentStatus('acknowledged', 'resolved'), 'resolved');
  assert.throws(() => getNextIncidentStatus('resolved', 'open'), (error) => error.code === 'STATE_CONFLICT');
});

test('signal ingest deduplicates active incidents by a stable key and bounds timelines', async () => {
  let filter; let update;
  await ingestIncidentSignal({ IncidentModel: { findOneAndUpdate: async (nextFilter, nextUpdate) => { filter = nextFilter; update = nextUpdate; return { _id: 'i1' }; } }, signal: { fingerprint: 'job_failed:j1', type: 'job_failed', severity: 'high', title: 'Job failed', summary: 'Failure', value: { code: 'X' } }, now: new Date('2026-07-22T00:00:00Z') });
  assert.equal(filter.dedupeKey, 'job_failed:j1');
  assert.equal(update.$inc.signalCount, 1);
  assert.equal(update.$push.signals.$slice, -50);
});

test('measured application signals create stale room, error-rate, job and announcement candidates', async () => {
  const query = (rows) => ({ select() { return this; }, lean: async () => rows });
  const signals = await collectIncidentSignals({
    roomStates: [{ code: 'ABC123', status: 'playing', updatedAt: new Date('2026-07-22T00:00:00Z') }], now: new Date('2026-07-22T00:10:00Z'),
    AdminOperationModel: { countDocuments: async (filter) => filter.responseStatus ? 6 : 20 },
    AdminJobModel: { find: () => query([{ _id: 'j1', type: 'players_export', error: { message: 'boom' } }]) },
    AnnouncementModel: { find: () => query([{ _id: 'a1', title: 'Event', scheduledFor: new Date('2026-07-21T23:00:00Z') }]) },
  });
  assert.deepEqual(new Set(signals.map((item) => item.type)), new Set(['room_stale', 'admin_error_rate', 'job_failed', 'announcement_overdue']));
});

test('resolving an incident releases its dedupe key and records an audited timeline', async () => {
  const before = { _id: 'i1', status: 'acknowledged', assigneeId: 'a1', __v: 2 };
  let update;
  const incident = await updateIncident({ IncidentModel: { findById: async () => before, findOneAndUpdate: async (_filter, nextUpdate) => { update = nextUpdate; return { ...before, status: 'resolved', __v: 3 }; } }, audit: async () => ({}), actor: { id: 'a1', username: 'mod' }, incidentId: 'i1', input: { status: 'resolved', expectedVersion: 2 }, mutation: { reason: 'Recovered', requestId: 'resolve-1' } });
  assert.equal(update.$unset.dedupeKey, 1);
  assert.equal(incident.status, 'resolved');
});

test('analyst incident projection hides internal notes and actor identity', () => {
  const safe = sanitizeIncidentForRole({ internalNotes: [{ body: 'secret' }], timeline: [{ type: 'status', actorId: 'a1', actorUsername: 'mod', message: 'changed' }] }, 'analyst');
  assert.equal(safe.internalNotes, undefined);
  assert.equal(safe.timeline[0].actorUsername, undefined);
});
