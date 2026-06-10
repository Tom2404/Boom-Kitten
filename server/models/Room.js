// Room schema stores room metadata and latest game state snapshot.
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, minlength: 6, maxlength: 6 },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxPlayers: { type: Number, min: 2, max: 5, default: 5 },
    status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
    isPublic: { type: Boolean, default: true },
    gameState: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Room', roomSchema);
