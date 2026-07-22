// User schema stores auth, cosmetics, economy, social graph, and ranking stats.
const mongoose = require('mongoose');
const { normalizeLegacyRank } = require('../utils/rankNormalization');
const { getRankFromElo, getRankValue, getTierFromRank } = require('../utils/rankSystem');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBanned: { type: Boolean, default: false },
    
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
      enum: [
        'Bronze II', 'Bronze I',
        'Silver III', 'Silver II', 'Silver I',
        'Gold III', 'Gold II', 'Gold I',
        'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I',
        'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I',
        'Legend'
      ],
      default: 'Bronze II',
    },
    eloPoints: { type: Number, default: 1000, index: true },
    highestEloReached: { type: Number, default: 1000 },
    seasonHighestElo: { type: Number, default: 1000 },
    allTimeHighestElo: { type: Number, default: 1000 },
    rankProtectionGames: { type: Number, default: 0, min: 0 },
    rankProtectedFloor: { type: Number, default: 0, min: 0 },
    
    // Status and dates
    lastLoginDate: { type: Date },
    lastDailyQuestDate: { type: Date },
    lastDailyRewardDate: { type: Date },
    consecutiveLoginDays: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Normalize records created before rank subdivisions were introduced.
// This must run before validation so legacy values such as "Bronze" do not
// block unrelated saves (currency adjustments, ELO updates, season resets).
userSchema.pre('validate', function (next) {
  this.rank = normalizeLegacyRank(this.rank);
  next();
});

// Automatically update rank and award Pink Coins (gems) on rank-up
userSchema.pre('save', function (next) {
  if (this.highestEloReached === undefined) {
    this.highestEloReached = 1000;
  }
  if (this.seasonHighestElo === undefined) {
    this.seasonHighestElo = this.highestEloReached || 1000;
  }
  if (this.allTimeHighestElo === undefined) {
    this.allTimeHighestElo = this.highestEloReached || 1000;
  }

  if (this.isModified('eloPoints') || this.isNew) {
    const oldRank = this.rank || 'Bronze II';
    const newRank = getRankFromElo(this.eloPoints);
    this.rank = newRank;

    // Update all-time peak ELO
    if (this.eloPoints > this.allTimeHighestElo) {
      this.allTimeHighestElo = this.eloPoints;
    }

    // Award Pink Coins only if ELO exceeds seasonal peak
    if (this.eloPoints > this.seasonHighestElo) {
      const oldRankVal = getRankValue(oldRank);
      const newRankVal = getRankValue(newRank);

      if (newRankVal > oldRankVal) {
        const oldTier = getTierFromRank(oldRank);
        const newTier = getTierFromRank(newRank);

        let reward = 5; // Default subdivision rank-up
        if (newRank === 'Legend') {
          reward = 50; // Reaching Legend
        } else if (newTier !== oldTier) {
          reward = 15; // Major Tier rank-up
        }

        this.gems = (this.gems || 0) + reward;
      }

      this.seasonHighestElo = this.eloPoints;
      this.highestEloReached = this.eloPoints; // Sync legacy field
    }
  }
  next();
});

// Compound index for leaderboard ranking performance
userSchema.index({ eloPoints: -1, 'stats.wins': -1 });

module.exports = mongoose.model('User', userSchema);

