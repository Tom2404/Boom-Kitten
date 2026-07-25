const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  dedupeKey: { type: String, unique: true, sparse: true },
  fingerprint: { type: String, required: true, index: true },
  type: { type: String, enum: ['room_stale', 'admin_error_rate', 'job_failed', 'announcement_overdue'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open', index: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  related: [{ kind: { type: String, enum: ['room', 'job', 'announcement', 'audit', 'player'] }, id: String, label: String, adminTab: String }],
  signalCount: { type: Number, default: 0 },
  signals: [{ observedAt: Date, value: mongoose.Schema.Types.Mixed }],
  timeline: [{ at: Date, type: String, actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, actorUsername: String, message: String }],
  internalNotes: [{ at: Date, actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, actorUsername: String, body: String }],
  firstSeenAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  acknowledgedAt: Date,
  resolvedAt: Date,
}, { timestamps: true });

incidentSchema.index({ status: 1, severity: 1, lastSeenAt: -1, _id: -1 });
incidentSchema.index({ assigneeId: 1, status: 1, lastSeenAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
