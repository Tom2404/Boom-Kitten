// Transaction schema records all coin/gem economy changes for auditing.
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['earn', 'spend', 'purchase', 'admin_adjust', 'season_reward', 'elo_adjust'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['coin', 'gem', 'elo'], required: true },
    balanceBefore: { type: Number },
    balanceAfter: { type: Number },
    source: { type: String },
    createdBy: { type: String, default: 'system' },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

// Optimize query for player transactions audit log
transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
