// Tournament schema defines competitive brackets, entry costs, and reward configurations.
const mongoose = require('mongoose');
const { TOURNAMENT_FORMAT, TOURNAMENT_MAX_PARTICIPANTS } = require('../utils/tournamentRules');

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    format: { type: String, enum: [TOURNAMENT_FORMAT], default: TOURNAMENT_FORMAT },
    rulesVersion: { type: Number, default: 1, min: 1 },
    entryFee: { type: Number, default: 50 },
    prizePool: {
      coins: { type: Number, default: 500 },
    },
    cosmeticRewards: [{
      rank: { type: Number, required: true, min: 1, max: 3 },
      type: { type: String, required: true, enum: ['skin', 'emote', 'avatar_frame'] },
      itemId: { type: String, required: true },
    }],
    maxParticipants: { type: Number, default: TOURNAMENT_MAX_PARTICIPANTS, min: TOURNAMENT_MAX_PARTICIPANTS, max: TOURNAMENT_MAX_PARTICIPANTS },
    registeredCount: { type: Number, default: 0, min: 0 },
    registrationOpensAt: { type: Date },
    registrationClosesAt: { type: Date },
    matchGraceMinutes: { type: Number, default: 5, min: 1, max: 30 },
    refundState: { type: String, enum: ['not_required', 'pending', 'processing', 'completed', 'failed'], default: 'not_required' },
    cancelReason: { type: String },
    publishedAt: { type: Date },
    stateVersion: { type: Number, default: 0, min: 0 },
    bracket: { type: mongoose.Schema.Types.Mixed },
    payoutState: { type: String, enum: ['pending', 'previewed', 'processing', 'completed', 'failed'], default: 'pending' },
    payoutPreview: { type: mongoose.Schema.Types.Mixed },
    payoutPreviewToken: { type: String },
    payoutPreviewExpiresAt: { type: Date },
    payoutRequestId: { type: String },
    payoutAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['registration', 'active', 'completed', 'cancelled'],
      default: 'registration',
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

tournamentSchema.index({ status: 1, startTime: 1, _id: 1 });
tournamentSchema.index({ payoutState: 1, completedAt: -1 });

module.exports = mongoose.model('Tournament', tournamentSchema);
