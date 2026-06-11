// Quest schema defines target requirements and reward payouts for daily challenges.
const mongoose = require('mongoose');

const questSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    actionType: {
      type: String,
      enum: ['play_game', 'win_game', 'nope_card', 'defuse_kitten', 'steal_card'],
      required: true,
    },
    targetCount: { type: Number, required: true, default: 1 },
    reward: {
      coins: { type: Number, default: 0 },
      gems: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Quest', questSchema);
