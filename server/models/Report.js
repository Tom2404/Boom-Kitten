const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetPlayerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, enum: ['harassment', 'cheating', 'inappropriate_name', 'spam', 'other'], required: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal', index: true },
  roomId: { type: String },
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameHistory' },
  status: { type: String, enum: ['SUBMITTED', 'ATTACHED'], default: 'SUBMITTED', index: true },
}, { timestamps: true });

reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ targetPlayerId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
