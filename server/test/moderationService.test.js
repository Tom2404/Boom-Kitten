const test = require('node:test');
const assert = require('node:assert/strict');

const { createPlayerReport, updateModerationCase } = require('../services/moderationService');

test('a valid player report is attached to a matching open moderation case', async () => {
  const report = { _id: 'report-1', status: 'SUBMITTED', async save() { this.saved = true; } };
  const moderationCase = { _id: 'case-1', reportIds: ['old-report'], timeline: [], async save() { this.saved = true; } };
  const result = await createPlayerReport({
    reporterId: 'user-1',
    input: { targetPlayerId: 'user-2', category: 'harassment', description: '  Nội dung xúc phạm trong phòng.  ', roomId: 'ABC123' },
    UserModel: { exists: async () => true },
    ReportModel: { findOne: async () => null, create: async (payload) => Object.assign(report, payload) },
    ModerationCaseModel: { findOne: async () => moderationCase },
  });

  assert.equal(result.report.description, 'Nội dung xúc phạm trong phòng.');
  assert.equal(result.report.status, 'ATTACHED');
  assert.deepEqual(moderationCase.reportIds, ['old-report', 'report-1']);
  assert.equal(moderationCase.saved, true);
});

test('player reports reject self reports, unsupported categories, and duplicate spam', async () => {
  const base = { reporterId: 'user-1', UserModel: { exists: async () => true }, ModerationCaseModel: {} };
  await assert.rejects(
    createPlayerReport({ ...base, input: { targetPlayerId: 'user-1', category: 'spam', description: 'Tin nhắn spam lặp lại.' } }),
    (error) => error.statusCode === 422,
  );
  await assert.rejects(
    createPlayerReport({ ...base, input: { targetPlayerId: 'user-2', category: 'invalid', description: 'Nội dung hợp lệ đủ dài.' } }),
    (error) => error.statusCode === 422,
  );
  await assert.rejects(
    createPlayerReport({
      ...base,
      input: { targetPlayerId: 'user-2', category: 'spam', description: 'Tin nhắn spam lặp lại.' },
      ReportModel: { findOne: async () => ({ _id: 'duplicate' }) },
    }),
    (error) => error.statusCode === 409,
  );
});

test('admin triage updates status, assignment, note, timeline and audit', async () => {
  const moderationCase = { _id: 'case-1', status: 'OPEN', notes: [], timeline: [], async save() { this.saved = true; } };
  const audits = [];
  await updateModerationCase({
    moderationCase,
    actor: { id: 'admin-1', username: 'moderator' },
    input: { status: 'INVESTIGATING', assignToMe: true, note: 'Đã kiểm tra lịch sử chat.' },
    createAudit: async (audit) => audits.push(audit),
    request: { requestId: 'req-1' },
  });

  assert.equal(moderationCase.status, 'INVESTIGATING');
  assert.equal(moderationCase.assigneeId, 'admin-1');
  assert.equal(moderationCase.notes[0].content, 'Đã kiểm tra lịch sử chat.');
  assert.equal(moderationCase.timeline.length >= 2, true);
  assert.equal(moderationCase.saved, true);
  assert.equal(audits[0].action, 'MODERATION_CASE_UPDATED');
});
