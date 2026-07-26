const mongoose = require('mongoose');
const { STAKE_TIERS } = require('../services/wagerService');

const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  placement: { type: Number, min: 1 },
  lockedCoins: { type: Number, required: true, min: 0 },
  payoutCoins: { type: Number, default: 0, min: 0 },
}, { _id: false });

const wagerSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true, index: true },
  roomCode: { type: String, required: true, index: true },
  stake: { type: Number, required: true, enum: STAKE_TIERS },
  state: {
    type: String,
    enum: ['created', 'locked', 'settled', 'refunded', 'review_required'],
    default: 'created',
    index: true,
  },
  participants: {
    type: [participantSchema],
    validate: [(rows) => rows.length >= 2 && rows.length <= 5, 'Wager requires 2 to 5 participants'],
  },
  lockRequestId: { type: String, sparse: true, unique: true },
  settlementRequestId: { type: String, sparse: true, unique: true },
  refundRequestId: { type: String, sparse: true, unique: true },
  reviewReason: { type: String },
  refundReason: { type: String },
  lockedAt: { type: Date },
  settledAt: { type: Date },
  refundedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Wager', wagerSchema);
