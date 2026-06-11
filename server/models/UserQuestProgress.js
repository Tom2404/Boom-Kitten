// UserQuestProgress schema tracks individual players' active quests and completions.
const mongoose = require('mongoose');

const userQuestProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quest', required: true },
    currentCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'claimed'],
      default: 'in_progress',
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

// Ensure a user only has one active progress record per quest in a given cycle
userQuestProgressSchema.index({ userId: 1, questId: 1 }, { unique: true });

module.exports = mongoose.model('UserQuestProgress', userQuestProgressSchema);
