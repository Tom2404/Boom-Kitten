// Shop item schema defines purchasable cosmetics and pricing details.
const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['skin', 'emote', 'avatar_frame'], required: true },
    price: {
      coins: { type: Number, default: 0 },
      gems: { type: Number, default: 0 },
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    isLimited: { type: Boolean, default: false },
    availableUntil: { type: Date },
    imageUrl: { type: String, default: '' },
    previewUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ShopItem', shopItemSchema);
