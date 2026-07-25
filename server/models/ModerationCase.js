const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  type: { type: String, required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorUsername: { type: String },
  from: { type: String },
  to: { type: String },
  detail: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const moderationCaseSchema = new mongoose.Schema({
  targetPlayerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reportIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
  category: { type: String, required: true, index: true },
  priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal', index: true },
  status: { type: String, enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'], default: 'OPEN', index: true },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  notes: [{ actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, actorUsername: String, content: { type: String, required: true }, createdAt: { type: Date, default: Date.now } }],
  timeline: [timelineSchema],
  latestSanction: { type: { type: String }, expiresAt: Date, reason: String, createdAt: Date },
}, { timestamps: true });

moderationCaseSchema.index({ status: 1, priority: -1, createdAt: -1 });
moderationCaseSchema.index({ assigneeId: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model('ModerationCase', moderationCaseSchema);
