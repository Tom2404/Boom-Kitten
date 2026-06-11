// TournamentParticipant schema maps users to registered tournaments and tracks score/rank.
const mongoose = require('mongoose');

const tournamentParticipantSchema = new mongoose.Schema(
  {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationDate: { type: Date, default: Date.now },
    finalRank: { type: Number },
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'eliminated'],
      default: 'active',
    },
  },
  { timestamps: true },
);

// Ensure a user cannot register for the same tournament twice
tournamentParticipantSchema.index({ tournamentId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('TournamentParticipant', tournamentParticipantSchema);
