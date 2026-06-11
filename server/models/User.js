// User schema stores auth, cosmetics, economy, social graph, and ranking stats.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    
    // Currency
    coins: { type: Number, default: 100, min: 0 },
    gems: { type: Number, default: 0, min: 0 },
    
    // Inventory
    ownedSkins: [{ type: String }],
    ownedEmotes: [{ type: String }],
    ownedAvatarFrames: [{ type: String }],
    
    // Active cosmetics
    activeSkin: { type: String, default: '' },
    activeAvatarFrame: { type: String, default: '' },
    
    // Stats and Ranking
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      totalGames: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
    },
    rank: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Legend'],
      default: 'Bronze',
    },
    eloPoints: { type: Number, default: 1000, index: true },
    
    // Status and dates
    lastLoginDate: { type: Date },
    lastDailyQuestDate: { type: Date },
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound index for leaderboard ranking performance
userSchema.index({ eloPoints: -1, 'stats.wins': -1 });

module.exports = mongoose.model('User', userSchema);

