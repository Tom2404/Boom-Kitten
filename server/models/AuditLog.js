// AuditLog schema records all administrative actions for security tracking.
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorUsername: { type: String },
    actorRole: { type: String },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String },
    requestId: { type: String },
    transportRequestId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

// Index for query optimization
auditLogSchema.index({ createdAt: -1, _id: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1, _id: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1, _id: -1 });
auditLogSchema.index({ action: 1, createdAt: -1, _id: -1 });
auditLogSchema.index({ requestId: 1, adminId: 1 }, { sparse: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
