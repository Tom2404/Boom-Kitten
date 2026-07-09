// Season schema to store season configurations, durations, and reset parameters.
const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema(
  {
    seasonNumber: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['scheduled', 'active', 'ended'], 
      default: 'scheduled' 
    },
    isResetExecuted: { type: Boolean, default: false },
    settings: {
      resetStrategy: { 
        type: String, 
        enum: ['soft_reset_ratio', 'soft_reset_tiered', 'hard_reset'], 
        default: 'soft_reset_ratio' 
      },
      softResetRatio: { type: Number, default: 0.5 },
      resetEloValue: { type: Number, default: 1000 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes
seasonSchema.index({ status: 1 });
seasonSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Season', seasonSchema);
