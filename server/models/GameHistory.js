// Game history schema stores match outcomes for profile history and analytics.
const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true },
    players: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rank: Number,
        result: { type: String, enum: ['win', 'lose'], required: true },
      },
    ],
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    duration: { type: Number, default: 0 },
    cardsPlayed: { type: Number, default: 0 },
    playedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

module.exports = mongoose.model('GameHistory', gameHistorySchema);
