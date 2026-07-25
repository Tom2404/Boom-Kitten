const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: 'Thông Báo Hệ Thống' },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ['info', 'warning', 'event'], default: 'info' },
  durationSeconds: { type: Number, min: 5, max: 300, default: 30 },
  status: { type: String, enum: ['draft', 'scheduled', 'sent', 'cancelled'], required: true, index: true },
  audience: {
    type: { type: String, enum: ['all_online', 'role', 'rank_range'], default: 'all_online' },
    roles: [{ type: String }],
    minElo: { type: Number },
    maxElo: { type: Number },
  },
  scheduledFor: { type: Date },
  sentAt: { type: Date },
  cancelledAt: { type: Date },
  recipientCount: { type: Number, min: 0, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByUsername: { type: String, required: true },
}, { timestamps: true });

announcementSchema.index({ status: 1, scheduledFor: 1 });
announcementSchema.index({ createdAt: -1, _id: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
