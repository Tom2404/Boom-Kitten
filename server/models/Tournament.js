// Tournament schema defines competitive brackets, entry costs, and reward configurations.
const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    entryFee: { type: Number, default: 50 },
    minEloRequired: { type: Number, default: 1000 },
    prizePool: {
      coins: { type: Number, default: 500 },
      gems: { type: Number, default: 10 },
    },
    status: {
      type: String,
      enum: ['registration', 'active', 'completed', 'cancelled'],
      default: 'registration',
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Tournament', tournamentSchema);
