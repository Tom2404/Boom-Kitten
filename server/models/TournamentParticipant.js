// TournamentParticipant maps paid registrations to Tournament scores and final placements.
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
      enum: ['registered', 'active', 'eliminated', 'winner', 'refunded'],
      default: 'registered',
    },
    entryFeePaid: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ['processing', 'paid', 'failed', 'refunded'], default: 'processing' },
    paymentRequestId: { type: String },
    refundRequestId: { type: String },
    refundedAt: { type: Date },
    paidAt: { type: Date },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    payoutStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    payoutRequestId: { type: String },
    payoutCoins: { type: Number, default: 0, min: 0 },
    payoutAt: { type: Date },
  },
  { timestamps: true },
);

// Ensure a user cannot register for the same tournament twice
tournamentParticipantSchema.index({ tournamentId: 1, userId: 1 }, { unique: true });
tournamentParticipantSchema.index({ tournamentId: 1, finalRank: 1, _id: 1 });

module.exports = mongoose.model('TournamentParticipant', tournamentParticipantSchema);
