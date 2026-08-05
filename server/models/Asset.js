const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    size: { type: Number, default: 0 },
    hash: { type: String, index: true }, // SHA-256 hash for anti-duplication
    category: {
      type: String,
      enum: ['protector', 'avatar_frame', 'field', 'skin', 'emote', 'misc'],
      default: 'misc',
    },
    variants: {
      fullUrl: { type: String, required: true },
      thumbUrl: { type: String, required: true },
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usageCount: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

assetSchema.index({ category: 1, isArchived: 1, createdAt: -1 });

module.exports = mongoose.model('Asset', assetSchema);
