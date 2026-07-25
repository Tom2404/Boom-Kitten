const test = require('node:test');
const assert = require('node:assert/strict');

const { createAnnouncement, cancelAnnouncement, dispatchDueAnnouncement } = require('../services/admin/announcementService');

const actor = { id: 'admin-1', username: 'ops', role: 'operator' };
const mutation = { requestId: 'announcement-1', reason: '' };

test('persists and sends an immediate announcement once', async () => {
  const record = { _id: 'a1', status: 'sent', recipientCount: 0, toObject() { return { ...this }; }, save: async function () { return this; } };
  const AnnouncementModel = { create: async (payload) => Object.assign(record, payload) };
  let delivered;
  const result = await createAnnouncement({ AnnouncementModel, audit: async () => {}, deliver: async (announcement) => { delivered = announcement; return 3; }, actor, input: { message: 'Maintenance', sendMode: 'now', audience: { type: 'all_online' } }, mutation });
  assert.equal(delivered.message, 'Maintenance');
  assert.equal(result.status, 'sent');
  assert.equal(result.recipientCount, 3);
  assert.ok(result.sentAt instanceof Date);
});

test('cancels only a scheduled announcement with an optimistic guard', async () => {
  const before = { _id: 'a2', status: 'scheduled', __v: 2, toObject() { return { ...this }; } };
  let filter;
  const after = { ...before, status: 'cancelled', __v: 3 };
  const AnnouncementModel = { findById: async () => before, findOneAndUpdate: async (value) => { filter = value; return after; } };
  const result = await cancelAnnouncement({ AnnouncementModel, audit: async () => {}, actor, announcementId: 'a2', mutation: { requestId: 'cancel-1', reason: 'Event postponed' } });
  assert.deepEqual(filter, { _id: 'a2', status: 'scheduled', __v: 2 });
  assert.equal(result.status, 'cancelled');
});

test('claims a due announcement as sent before delivery so restarts cannot resend it', async () => {
  const claimed = { _id: 'a3', status: 'sent', message: 'Due', audience: { type: 'all_online' }, recipientCount: 0, save: async function () { return this; } };
  let claimFilter;
  const AnnouncementModel = { findOneAndUpdate: async (filter) => { claimFilter = filter; return claimed; } };
  let deliveries = 0;
  const result = await dispatchDueAnnouncement({ AnnouncementModel, deliver: async () => { deliveries += 1; return 2; }, now: new Date('2027-01-01T00:00:00Z') });
  assert.equal(claimFilter.status, 'scheduled');
  assert.equal(deliveries, 1);
  assert.equal(result.recipientCount, 2);
});
