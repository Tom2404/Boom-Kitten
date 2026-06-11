// Game history schema stores match outcomes for profile history and analytics.
const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    gameMode: { type: String, enum: ['ranked', 'custom', 'tournament'], default: 'ranked' },
    players: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rank: { type: Number },                   // Vị trí kết thúc ván (1: Thắng, 2+: Bị loại)
        result: { type: String, enum: ['win', 'lose'], required: true },
        eloChange: { type: Number, required: true, default: 0 }, // ELO cộng/trừ trong trận đấu
      },
    ],
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    duration: { type: Number, default: 0 },       // Thời gian chơi tính bằng giây
    cardsPlayed: { type: Number, default: 0 },
    playedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

module.exports = mongoose.model('GameHistory', gameHistorySchema);

