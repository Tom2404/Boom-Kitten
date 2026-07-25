const mongoose = require('mongoose');

const adminSavedViewSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scope: { type: String, enum: ['players', 'reports', 'logs', 'rooms'], required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  schemaVersion: { type: Number, default: 1, min: 1 },
  filters: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

adminSavedViewSchema.index({ ownerId: 1, scope: 1, name: 1 }, { unique: true });
adminSavedViewSchema.index({ ownerId: 1, scope: 1, updatedAt: -1 });

module.exports = mongoose.model('AdminSavedView', adminSavedViewSchema);
