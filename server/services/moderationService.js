const { ApiError } = require('../utils/apiResponse');

const REPORT_CATEGORIES = new Set(['harassment', 'cheating', 'inappropriate_name', 'spam', 'other']);
const CASE_STATUSES = new Set(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']);
const CASE_PRIORITIES = new Set(['low', 'normal', 'high', 'critical']);

function normalizeReportInput(reporterId, input = {}) {
  const targetPlayerId = String(input.targetPlayerId || '');
  const category = typeof input.category === 'string' ? input.category : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const roomId = typeof input.roomId === 'string' ? input.roomId.trim().toUpperCase() : '';
  if (!targetPlayerId || targetPlayerId === String(reporterId)) throw new ApiError(422, 'VALIDATION_ERROR', 'Không thể báo cáo chính mình.');
  if (!REPORT_CATEGORIES.has(category)) throw new ApiError(422, 'VALIDATION_ERROR', 'Loại báo cáo không hợp lệ.');
  if (description.length < 10 || description.length > 2000) throw new ApiError(422, 'VALIDATION_ERROR', 'Mô tả phải có từ 10 đến 2000 ký tự.');
  if (roomId && !/^[A-Z0-9]{6}$/.test(roomId)) throw new ApiError(422, 'VALIDATION_ERROR', 'Mã phòng không hợp lệ.');
  return { targetPlayerId, category, description, roomId: roomId || undefined };
}

async function createPlayerReport({ reporterId, input, UserModel, ReportModel, ModerationCaseModel, now = new Date() }) {
  const normalized = normalizeReportInput(reporterId, input);
  if (!(await UserModel.exists({ _id: normalized.targetPlayerId, deletedAt: null }))) {
    throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi bị báo cáo.');
  }
  const duplicate = await ReportModel.findOne({
    reporterId,
    targetPlayerId: normalized.targetPlayerId,
    category: normalized.category,
    roomId: normalized.roomId,
    createdAt: { $gte: new Date(now.getTime() - 10 * 60 * 1000) },
  });
  if (duplicate) throw new ApiError(409, 'STATE_CONFLICT', 'Báo cáo tương tự đã được gửi gần đây.');

  const priority = normalized.category === 'cheating' ? 'high' : 'normal';
  const report = await ReportModel.create({ reporterId, ...normalized, priority });
  let moderationCase = await ModerationCaseModel.findOne({
    targetPlayerId: normalized.targetPlayerId,
    category: normalized.category,
    status: { $in: ['OPEN', 'INVESTIGATING'] },
  });
  if (moderationCase) {
    if (!moderationCase.reportIds.some((id) => String(id) === String(report._id))) moderationCase.reportIds.push(report._id);
    if (priority === 'high' && moderationCase.priority === 'normal') moderationCase.priority = 'high';
    moderationCase.timeline.push({ type: 'REPORT_ATTACHED', detail: `Report ${report._id}`, createdAt: now });
    await moderationCase.save();
  } else {
    moderationCase = await ModerationCaseModel.create({
      targetPlayerId: normalized.targetPlayerId,
      reportIds: [report._id],
      category: normalized.category,
      priority,
      timeline: [{ type: 'CASE_OPENED', detail: `Report ${report._id}`, createdAt: now }],
    });
  }
  report.status = 'ATTACHED';
  await report.save();
  return { report, moderationCase };
}

async function updateModerationCase({ moderationCase, actor, input = {}, createAudit, request = {}, now = new Date() }) {
  if (!moderationCase) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy moderation case.');
  const before = { status: moderationCase.status, priority: moderationCase.priority, assigneeId: moderationCase.assigneeId || null };
  let changed = false;

  if (input.status !== undefined) {
    if (!CASE_STATUSES.has(input.status)) throw new ApiError(422, 'VALIDATION_ERROR', 'Trạng thái moderation không hợp lệ.');
    if (input.status !== moderationCase.status) {
      moderationCase.timeline.push({ type: 'STATUS_CHANGED', actorId: actor.id, actorUsername: actor.username, from: moderationCase.status, to: input.status, createdAt: now });
      moderationCase.status = input.status;
      changed = true;
    }
  }
  if (input.priority !== undefined) {
    if (!CASE_PRIORITIES.has(input.priority)) throw new ApiError(422, 'VALIDATION_ERROR', 'Mức ưu tiên không hợp lệ.');
    if (input.priority !== moderationCase.priority) {
      moderationCase.timeline.push({ type: 'PRIORITY_CHANGED', actorId: actor.id, actorUsername: actor.username, from: moderationCase.priority, to: input.priority, createdAt: now });
      moderationCase.priority = input.priority;
      changed = true;
    }
  }
  if (input.assignToMe && String(moderationCase.assigneeId || '') !== String(actor.id)) {
    moderationCase.assigneeId = actor.id;
    moderationCase.timeline.push({ type: 'ASSIGNED', actorId: actor.id, actorUsername: actor.username, detail: actor.username, createdAt: now });
    changed = true;
  }
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  if (note) {
    if (note.length > 1000) throw new ApiError(422, 'VALIDATION_ERROR', 'Ghi chú tối đa 1000 ký tự.');
    moderationCase.notes.push({ actorId: actor.id, actorUsername: actor.username, content: note, createdAt: now });
    moderationCase.timeline.push({ type: 'NOTE_ADDED', actorId: actor.id, actorUsername: actor.username, detail: note, createdAt: now });
    changed = true;
  }
  if (!changed) throw new ApiError(422, 'VALIDATION_ERROR', 'Không có thay đổi moderation hợp lệ.');

  await moderationCase.save();
  await createAudit({
    actor,
    action: 'MODERATION_CASE_UPDATED',
    target: { type: 'moderation_case', id: String(moderationCase._id) },
    before,
    after: { status: moderationCase.status, priority: moderationCase.priority, assigneeId: moderationCase.assigneeId || null },
    reason: note || 'Moderation triage update',
    request,
  });
  return moderationCase;
}

module.exports = { CASE_PRIORITIES, CASE_STATUSES, REPORT_CATEGORIES, createPlayerReport, normalizeReportInput, updateModerationCase };
