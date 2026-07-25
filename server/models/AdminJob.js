const mongoose = require('mongoose');

const adminJobSchema = new mongoose.Schema({
  type: { type: String, enum: ['audit_export', 'player_bulk_adjust', 'players_export'], required: true },
  status: { type: String, enum: ['preview', 'queued', 'running', 'completed', 'failed', 'cancelled'], default: 'queued', required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorUsername: { type: String, required: true },
  actorRole: { type: String, required: true },
  query: { type: mongoose.Schema.Types.Mixed, default: {} },
  operation: { type: mongoose.Schema.Types.Mixed, default: {} },
  reason: { type: String, required: true },
  requestId: { type: String, required: true },
  previewToken: { type: String },
  previewExpiresAt: { type: Date },
  previewConsumedAt: { type: Date, default: null },
  sourcePreviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminJob' },
  targetCount: { type: Number, default: 0 },
  targetSample: { type: [mongoose.Schema.Types.Mixed], default: [] },
  progress: {
    total: { type: Number, default: 0 },
    processed: { type: Number, default: 0 },
    succeeded: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  resultSummary: { type: mongoose.Schema.Types.Mixed },
  output: {
    filename: String,
    contentType: String,
    content: String,
  },
  errorOutput: {
    filename: String,
    contentType: String,
    content: String,
  },
  error: { code: String, message: String },
  cancelRequestedAt: Date,
  leaseExpiresAt: Date,
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

adminJobSchema.index({ actorId: 1, requestId: 1 }, { unique: true });
adminJobSchema.index({ previewToken: 1 }, { unique: true, sparse: true });
adminJobSchema.index({ status: 1, leaseExpiresAt: 1, createdAt: 1 });
adminJobSchema.index({ actorId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminJob', adminJobSchema);
