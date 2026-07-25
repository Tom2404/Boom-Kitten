const mongoose = require('mongoose');

const liveOpsConfigSchema = new mongoose.Schema({
  version: { type: Number, required: true, unique: true, min: 1 },
  schemaVersion: { type: Number, required: true, default: 1 },
  status: { type: String, enum: ['draft', 'validated', 'published'], default: 'draft', index: true },
  config: { type: mongoose.Schema.Types.Mixed, required: true },
  validation: { valid: Boolean, errors: [String], validatedAt: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: Date,
  rollbackOf: { type: Number },
}, { timestamps: true });

liveOpsConfigSchema.index({ status: 1, version: -1 });

module.exports = mongoose.model('LiveOpsConfig', liveOpsConfigSchema);
