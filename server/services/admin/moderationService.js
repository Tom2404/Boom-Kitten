const Report = require('../../models/Report');
const ModerationCase = require('../../models/ModerationCase');
const User = require('../../models/User');
const { ApiError } = require('../../utils/apiResponse');
const { createAdminAudit } = require('./auditService');

const REPORT_CATEGORIES = ['harassment', 'cheating', 'inappropriate_name', 'spam', 'other'];
const CASE_TRANSITIONS = { OPEN: ['INVESTIGATING'], INVESTIGATING: ['RESOLVED', 'DISMISSED'], RESOLVED: [], DISMISSED: [] };

function toPlain(value) { return value?.toObject ? value.toObject() : value; }

async function createPlayerReport({ UserModel = User, ReportModel = Report, ModerationCaseModel = ModerationCase, reporterId, input, now = new Date() }) {
  if (String(reporterId) === String(input.targetPlayerId)) throw new ApiError(422, 'VALIDATION_ERROR', 'Bạn không thể report chính mình.');
  if (!REPORT_CATEGORIES.includes(input.category) || !input.description?.trim()) throw new ApiError(422, 'VALIDATION_ERROR', 'Category và mô tả report không hợp lệ.');
  if (!await UserModel.exists({ _id: input.targetPlayerId })) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi bị report.');
  const recentCount = await ReportModel.countDocuments({ reporterId, createdAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) } });
  if (recentCount >= 5) throw new ApiError(429, 'REPORT_RATE_LIMITED', 'Bạn đã gửi quá nhiều report. Hãy thử lại sau.');
  const priority = input.category === 'cheating' ? 'high' : 'normal';
  const report = await ReportModel.create({ reporterId, targetPlayerId: input.targetPlayerId, category: input.category, description: input.description.trim(), roomId: input.roomId, matchId: input.matchId, priority });
  const moderationCase = await ModerationCaseModel.create({
    targetPlayerId: input.targetPlayerId,
    reportIds: [report._id],
    category: input.category,
    priority,
    status: 'OPEN',
    timeline: [{ type: 'CASE_OPENED', detail: `Report ${report._id}`, createdAt: now }],
  });
  report.status = 'ATTACHED';
  await report.save?.();
  return { report, moderationCase };
}

async function transitionModerationCase({ ModerationCaseModel = ModerationCase, audit = createAdminAudit, actor, caseId, input, mutation, request = {} }) {
  const before = await ModerationCaseModel.findById(caseId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy moderation case.');
  const set = {};
  if (input.status && input.status !== before.status) {
    if (!CASE_TRANSITIONS[before.status]?.includes(input.status)) throw new ApiError(409, 'STATE_CONFLICT', `Không thể chuyển ${before.status} sang ${input.status}.`);
    set.status = input.status;
  }
  if (input.priority) set.priority = input.priority;
  if (input.assigneeId !== undefined) set.assigneeId = input.assigneeId || null;
  const timeline = [];
  if (set.status) timeline.push({ type: 'STATUS_CHANGED', actorId: actor.id, actorUsername: actor.username, from: before.status, to: set.status, detail: mutation.reason });
  if (set.assigneeId !== undefined) timeline.push({ type: 'ASSIGNEE_CHANGED', actorId: actor.id, actorUsername: actor.username, detail: String(set.assigneeId || 'unassigned') });
  const moderationCase = await ModerationCaseModel.findOneAndUpdate({ _id: caseId, __v: before.__v }, { $set: set, ...(timeline.length && { $push: { timeline: { $each: timeline } } }), $inc: { __v: 1 } }, { new: true, runValidators: true });
  if (!moderationCase) throw new ApiError(409, 'STATE_CONFLICT', 'Case đã thay đổi. Hãy tải lại.');
  await audit({ actor, action: 'MODERATION_CASE_UPDATED', target: { type: 'moderation_case', id: String(caseId) }, before: toPlain(before), after: toPlain(moderationCase), reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return moderationCase;
}

async function addModerationNote({ ModerationCaseModel = ModerationCase, audit = createAdminAudit, actor, caseId, content, mutation, request = {} }) {
  if (!content?.trim()) throw new ApiError(422, 'VALIDATION_ERROR', 'Nội dung ghi chú là bắt buộc.');
  const moderationCase = await ModerationCaseModel.findByIdAndUpdate(caseId, { $push: { notes: { actorId: actor.id, actorUsername: actor.username, content: content.trim() }, timeline: { type: 'NOTE_ADDED', actorId: actor.id, actorUsername: actor.username } } }, { new: true });
  if (!moderationCase) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy moderation case.');
  await audit({ actor, action: 'MODERATION_NOTE_ADDED', target: { type: 'moderation_case', id: String(caseId) }, after: { noteAdded: true }, reason: mutation.reason || 'Internal note', request: { ...request, operationRequestId: mutation.requestId } });
  return moderationCase;
}

async function applyModerationSanction({ UserModel = User, ModerationCaseModel = ModerationCase, audit = createAdminAudit, actor, caseId, input, mutation, request = {}, now = new Date() }) {
  const moderationCase = await ModerationCaseModel.findById(caseId);
  if (!moderationCase) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy moderation case.');
  const before = await UserModel.findById(moderationCase.targetPlayerId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi.');
  const set = {};
  const inc = {};
  if (input.type === 'warning') inc.warningCount = 1;
  else if (input.type === 'suspension') {
    const expiresAt = new Date(input.expiresAt);
    if (!input.expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt <= now) throw new ApiError(422, 'VALIDATION_ERROR', 'Thời hạn suspension phải ở tương lai.');
    set.isBanned = false;
    set.suspendedUntil = expiresAt;
  } else if (input.type === 'ban') { set.isBanned = true; set.suspendedUntil = null; }
  else if (input.type === 'unban') { set.isBanned = false; set.suspendedUntil = null; }
  else throw new ApiError(422, 'VALIDATION_ERROR', 'Loại sanction không hợp lệ.');
  const user = await UserModel.findOneAndUpdate({ _id: before._id, __v: before.__v }, { $set: set, ...(Object.keys(inc).length && { $inc: { ...inc, __v: 1 } }), ...(!Object.keys(inc).length && { $inc: { __v: 1 } }) }, { new: true, runValidators: true });
  if (!user) throw new ApiError(409, 'STATE_CONFLICT', 'Trạng thái người chơi đã thay đổi.');
  await ModerationCaseModel.findByIdAndUpdate(caseId, { $set: { latestSanction: { type: input.type, expiresAt: set.suspendedUntil, reason: mutation.reason, createdAt: now } }, $push: { timeline: { type: 'SANCTION_APPLIED', actorId: actor.id, actorUsername: actor.username, detail: input.type, createdAt: now } } });
  await audit({ actor, action: 'MODERATION_SANCTION_APPLIED', target: { type: 'user', id: String(user._id) }, before: { isBanned: before.isBanned, suspendedUntil: before.suspendedUntil, warningCount: before.warningCount }, after: { isBanned: user.isBanned, suspendedUntil: user.suspendedUntil, warningCount: user.warningCount }, reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId }, metadata: { caseId, sanctionType: input.type } });
  return user;
}

module.exports = { addModerationNote, applyModerationSanction, createPlayerReport, transitionModerationCase };
