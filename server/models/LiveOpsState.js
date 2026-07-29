const mongoose = require('mongoose');

const liveOpsStateSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true, immutable: true },
  activeConfigId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveOpsConfig' },
  activeVersion: { type: Number, default: 0 },
  stateVersion: { type: Number, default: 0 },
  publishedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('LiveOpsState', liveOpsStateSchema);
