// AuditLog schema records all administrative actions for security tracking.
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

// Index for query optimization
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1, targetType: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
