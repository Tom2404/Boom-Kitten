const mongoose = require('mongoose');

const adminOperationSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  operation: { type: String, required: true },
  requestId: { type: String, required: true },
  payloadHash: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending', required: true },
  responseStatus: { type: Number },
  responseBody: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  expiresAt: { type: Date },
}, { timestamps: false });

adminOperationSchema.index({ actorId: 1, operation: 1, requestId: 1 }, { unique: true });
adminOperationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminOperation', adminOperationSchema);
