const Incident = require('../../models/Incident');
const AdminOperation = require('../../models/AdminOperation');
const AdminJob = require('../../models/AdminJob');
const Announcement = require('../../models/Announcement');
const { getOperationalRoomStates } = require('../../game/roomManager');
const { ApiError } = require('../../utils/apiResponse');
const { createAdminAudit } = require('./auditService');

const INCIDENT_TRANSITIONS = Object.freeze({ open: ['acknowledged', 'resolved'], acknowledged: ['open', 'resolved'], resolved: [] });

function getNextIncidentStatus(current, next) {
  if (current === next) return next;
  if (!INCIDENT_TRANSITIONS[current]?.includes(next)) throw new ApiError(409, 'STATE_CONFLICT', `Không thể chuyển incident từ ${current} sang ${next}.`);
  return next;
}

function sanitizeIncidentForRole(incident, role) {
  const safe = incident?.toObject ? incident.toObject() : { ...incident };
  if (role === 'analyst') {
    delete safe.internalNotes;
    safe.timeline = (safe.timeline || []).map(({ actorId: _actorId, actorUsername: _actorUsername, ...entry }) => entry);
  }
  return safe;
}

async function ingestIncidentSignal({ IncidentModel = Incident, signal, now = new Date() }) {
  const fingerprint = String(signal.fingerprint || '').trim().slice(0, 240);
  if (!fingerprint) throw new ApiError(422, 'VALIDATION_ERROR', 'Incident fingerprint là bắt buộc.');
  return IncidentModel.findOneAndUpdate(
    { dedupeKey: fingerprint },
    {
      $setOnInsert: { dedupeKey: fingerprint, fingerprint, type: signal.type, status: 'open', title: signal.title, firstSeenAt: now },
      $set: { severity: signal.severity, summary: signal.summary, related: signal.related || [], lastSeenAt: now },
      $inc: { signalCount: 1 },
      $push: { signals: { $each: [{ observedAt: now, value: signal.value }], $slice: -50 }, timeline: { $each: [{ at: now, type: 'signal', message: signal.summary }], $slice: -100 } },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function updateIncident({ IncidentModel = Incident, audit = createAdminAudit, actor, incidentId, input, mutation, request = {}, now = new Date() }) {
  const before = await IncidentModel.findById(incidentId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy incident.');
  const nextStatus = input.status === undefined ? before.status : getNextIncidentStatus(before.status, input.status);
  const set = { status: nextStatus };
  if (input.assigneeId !== undefined) set.assigneeId = input.assigneeId || null;
  if (nextStatus === 'acknowledged' && before.status !== 'acknowledged') set.acknowledgedAt = now;
  if (nextStatus === 'resolved') set.resolvedAt = now;
  const update = { $set: set, $inc: { __v: 1 }, $push: { timeline: { at: now, type: nextStatus !== before.status ? 'status' : 'assignment', actorId: actor.id, actorUsername: actor.username, message: nextStatus !== before.status ? `Status: ${before.status} → ${nextStatus}` : `Assignee updated to ${input.assigneeId || 'unassigned'}` } } };
  if (nextStatus === 'resolved') update.$unset = { dedupeKey: 1 };
  const incident = await IncidentModel.findOneAndUpdate({ _id: incidentId, __v: Number(input.expectedVersion), status: before.status }, update, { new: true, runValidators: true });
  if (!incident) throw new ApiError(409, 'STATE_CONFLICT', 'Incident vừa thay đổi. Hãy tải lại.');
  await audit({ actor, action: 'INCIDENT_UPDATED', target: { type: 'incident', id: String(incidentId) }, before: { status: before.status, assigneeId: before.assigneeId }, after: { status: incident.status, assigneeId: incident.assigneeId }, reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return incident;
}

async function addIncidentNote({ IncidentModel = Incident, audit = createAdminAudit, actor, incidentId, body, expectedVersion, mutation, request = {}, now = new Date() }) {
  const note = String(body || '').trim();
  if (!note || note.length > 2000) throw new ApiError(422, 'VALIDATION_ERROR', 'Note bắt buộc và tối đa 2000 ký tự.');
  const incident = await IncidentModel.findOneAndUpdate({ _id: incidentId, __v: Number(expectedVersion), status: { $ne: 'resolved' } }, { $push: { internalNotes: { at: now, actorId: actor.id, actorUsername: actor.username, body: note }, timeline: { at: now, type: 'note', actorId: actor.id, actorUsername: actor.username, message: 'Internal note added' } }, $inc: { __v: 1 } }, { new: true });
  if (!incident) throw new ApiError(409, 'STATE_CONFLICT', 'Incident đã resolve hoặc vừa thay đổi.');
  await audit({ actor, action: 'INCIDENT_NOTE_ADDED', target: { type: 'incident', id: String(incidentId) }, before: null, after: { noteLength: note.length }, reason: mutation.reason || 'Internal incident note', request: { ...request, operationRequestId: mutation.requestId } });
  return incident;
}

async function collectIncidentSignals({ AdminOperationModel = AdminOperation, AdminJobModel = AdminJob, AnnouncementModel = Announcement, roomStates = getOperationalRoomStates(), now = new Date() } = {}) {
  const signals = [];
  const staleCutoff = new Date(now.getTime() - 5 * 60 * 1000);
  for (const room of roomStates) if (room.status === 'playing' && new Date(room.updatedAt || room.startedAt || 0) < staleCutoff) signals.push({ fingerprint: `room_stale:${room.code}`, type: 'room_stale', severity: 'high', title: `Room ${room.code} có dấu hiệu stale`, summary: 'Room đang playing nhưng không cập nhật quá 5 phút.', value: { status: room.status, updatedAt: room.updatedAt }, related: [{ kind: 'room', id: room.code, label: `Room ${room.code}`, adminTab: 'rooms' }] });
  const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
  const [totalOps, failedOps, failedJobs, overdueAnnouncements] = await Promise.all([
    AdminOperationModel.countDocuments({ createdAt: { $gte: windowStart } }),
    AdminOperationModel.countDocuments({ createdAt: { $gte: windowStart }, responseStatus: { $gte: 500 } }),
    AdminJobModel.find({ status: 'failed', completedAt: { $gte: windowStart } }).select('_id type error completedAt').lean(),
    AnnouncementModel.find({ status: 'scheduled', scheduledFor: { $lt: new Date(now.getTime() - 5 * 60 * 1000) } }).select('_id title scheduledFor').lean(),
  ]);
  if (failedOps >= 5 && failedOps / Math.max(1, totalOps) >= 0.2) signals.push({ fingerprint: 'admin_error_rate:15m', type: 'admin_error_rate', severity: failedOps / totalOps >= 0.5 ? 'critical' : 'high', title: 'Tỷ lệ lỗi Admin tăng cao', summary: `${failedOps}/${totalOps} Admin operations trả lỗi 5xx trong 15 phút.`, value: { failedOps, totalOps, windowMinutes: 15 }, related: [{ kind: 'audit', id: 'errors-15m', label: 'Audit logs', adminTab: 'logs' }] });
  for (const job of failedJobs) signals.push({ fingerprint: `job_failed:${job._id}`, type: 'job_failed', severity: 'high', title: `Admin Job ${job.type} thất bại`, summary: job.error?.message || 'Admin Job failed.', value: { jobType: job.type, errorCode: job.error?.code }, related: [{ kind: 'job', id: String(job._id), label: `Job ${job._id}`, adminTab: 'jobs' }] });
  for (const item of overdueAnnouncements) signals.push({ fingerprint: `announcement_overdue:${item._id}`, type: 'announcement_overdue', severity: 'medium', title: `Announcement "${item.title}" quá hạn`, summary: 'Announcement vẫn scheduled sau thời điểm gửi hơn 5 phút.', value: { scheduledFor: item.scheduledFor }, related: [{ kind: 'announcement', id: String(item._id), label: item.title, adminTab: 'announcements' }] });
  return signals;
}

async function scanIncidentSignals(options = {}) {
  const signals = await collectIncidentSignals(options);
  const incidents = [];
  for (const signal of signals) incidents.push(await ingestIncidentSignal({ IncidentModel: options.IncidentModel || Incident, signal, now: options.now || new Date() }));
  return incidents;
}

function startIncidentScanner({ intervalMs = 60000 } = {}) {
  let active = false;
  const tick = async () => { if (active) return; active = true; try { await scanIncidentSignals(); } catch (error) { console.error('Incident scanner failed:', error); } finally { active = false; } };
  const initial = setTimeout(tick, 5000); initial.unref?.();
  const timer = setInterval(tick, intervalMs); timer.unref?.();
  return () => { clearTimeout(initial); clearInterval(timer); };
}

module.exports = { INCIDENT_TRANSITIONS, addIncidentNote, collectIncidentSignals, getNextIncidentStatus, ingestIncidentSignal, sanitizeIncidentForRole, scanIncidentSignals, startIncidentScanner, updateIncident };
