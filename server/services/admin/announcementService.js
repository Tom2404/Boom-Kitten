const Announcement = require('../../models/Announcement');
const User = require('../../models/User');
const { ApiError } = require('../../utils/apiResponse');
const { createAdminAudit } = require('./auditService');

const AUDIENCE_TYPES = ['all_online', 'role'];

function toPlain(value) {
  return value?.toObject ? value.toObject() : value;
}

function validateInput(input, now = new Date()) {
  const fields = {};
  if (!input.message?.trim()) fields.message = 'Bắt buộc';
  if (input.durationSeconds !== undefined && (Number(input.durationSeconds) < 5 || Number(input.durationSeconds) > 300)) fields.durationSeconds = 'Phải từ 5 đến 300 giây';
  const audience = input.audience || { type: 'all_online' };
  if (!AUDIENCE_TYPES.includes(audience.type)) fields.audience = 'Không hợp lệ';
  if (audience.type === 'role' && (!Array.isArray(audience.roles) || audience.roles.length === 0)) fields.audience = 'Chọn ít nhất một role';
  if (input.sendMode === 'scheduled' && (!input.scheduledFor || new Date(input.scheduledFor) <= now)) fields.scheduledFor = 'Phải là thời điểm trong tương lai';
  if (Object.keys(fields).length) throw new ApiError(422, 'VALIDATION_ERROR', 'Thông báo không hợp lệ.', { fields });
}

function eventPayload(announcement) {
  return {
    id: String(announcement._id),
    title: announcement.title,
    message: announcement.message,
    type: announcement.type,
    durationSeconds: announcement.durationSeconds,
    createdAt: announcement.sentAt || new Date(),
    sender: announcement.createdByUsername,
  };
}

async function deliverAnnouncement({ io, UserModel = User, announcement }) {
  if (!io) return 0;
  const payload = eventPayload(announcement);
  const legacy = { text: announcement.message, sentAt: new Date(payload.createdAt).toISOString(), sender: announcement.createdByUsername };
  if (announcement.audience?.type === 'all_online') {
    io.emit('announcement:broadcast', payload);
    io.emit('server_announcement', legacy);
    return io.sockets?.sockets?.size || 0;
  }
  const query = { isOnline: true };
  if (announcement.audience.type === 'role') query.role = { $in: announcement.audience.roles };
  const users = await UserModel.find(query).select('_id');
  for (const user of users) {
    io.to(`user:${user._id}`).emit('announcement:broadcast', payload);
    io.to(`user:${user._id}`).emit('server_announcement', legacy);
  }
  return users.length;
}

async function createAnnouncement({ AnnouncementModel = Announcement, audit = createAdminAudit, deliver, actor, input, mutation, request = {}, now = new Date() }) {
  validateInput(input, now);
  const sendMode = input.sendMode || 'now';
  const status = sendMode === 'draft' ? 'draft' : sendMode === 'scheduled' ? 'scheduled' : 'sent';
  const announcement = await AnnouncementModel.create({
    title: input.title?.trim() || 'Thông Báo Hệ Thống',
    message: input.message.trim(),
    type: input.type || 'info',
    durationSeconds: Number(input.durationSeconds) || 30,
    status,
    audience: input.audience || { type: 'all_online' },
    scheduledFor: status === 'scheduled' ? new Date(input.scheduledFor) : undefined,
    sentAt: status === 'sent' ? now : undefined,
    createdBy: actor.id,
    createdByUsername: actor.username,
  });
  if (status === 'sent') {
    announcement.recipientCount = await deliver(announcement);
    await announcement.save();
  }
  await audit({ actor, action: status === 'sent' ? 'ANNOUNCEMENT_SENT' : status === 'scheduled' ? 'ANNOUNCEMENT_SCHEDULED' : 'ANNOUNCEMENT_DRAFTED', target: { type: 'announcement', id: String(announcement._id) }, after: toPlain(announcement), reason: mutation.reason || `Announcement ${status}`, request: { ...request, operationRequestId: mutation.requestId } });
  return announcement;
}

async function cancelAnnouncement({ AnnouncementModel = Announcement, audit = createAdminAudit, actor, announcementId, mutation, request = {}, now = new Date() }) {
  const before = await AnnouncementModel.findById(announcementId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy thông báo.');
  if (before.status !== 'scheduled') throw new ApiError(409, 'STATE_CONFLICT', 'Chỉ có thể hủy thông báo đang chờ gửi.');
  const announcement = await AnnouncementModel.findOneAndUpdate({ _id: announcementId, status: 'scheduled', __v: before.__v }, { $set: { status: 'cancelled', cancelledAt: now }, $inc: { __v: 1 } }, { new: true });
  if (!announcement) throw new ApiError(409, 'STATE_CONFLICT', 'Thông báo đã thay đổi. Hãy tải lại.');
  await audit({ actor, action: 'ANNOUNCEMENT_CANCELLED', target: { type: 'announcement', id: String(announcement._id) }, before: toPlain(before), after: toPlain(announcement), reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return announcement;
}

async function dispatchDueAnnouncement({ AnnouncementModel = Announcement, deliver, now = new Date() }) {
  const announcement = await AnnouncementModel.findOneAndUpdate(
    { status: 'scheduled', scheduledFor: { $lte: now } },
    { $set: { status: 'sent', sentAt: now }, $inc: { __v: 1 } },
    { new: true, sort: { scheduledFor: 1, _id: 1 } },
  );
  if (!announcement) return null;
  announcement.recipientCount = await deliver(announcement);
  await announcement.save();
  return announcement;
}

function startAnnouncementScheduler({ io, intervalMs = 15000 } = {}) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      while (await dispatchDueAnnouncement({ deliver: (record) => deliverAnnouncement({ io, announcement: record }) })) {
        // Drain every due record; each claim changes status before delivery.
      }
    } catch (error) {
      process.stderr.write(`Announcement scheduler error: ${error.message}\n`);
    } finally {
      running = false;
    }
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

module.exports = { cancelAnnouncement, createAnnouncement, deliverAnnouncement, dispatchDueAnnouncement, startAnnouncementScheduler, validateInput };
