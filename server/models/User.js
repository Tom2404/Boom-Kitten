// User schema stores auth, cosmetics, economy, social graph, and ranking stats.
const mongoose = require('mongoose');

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
        'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
        'Silver IV', 'Silver III', 'Silver II', 'Silver I',
        'Gold IV', 'Gold III', 'Gold II', 'Gold I',
        'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I',
        'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I',
        'Legend'
      ],
      default: 'Bronze IV',
    },
    eloPoints: { type: Number, default: 1000, index: true },
    highestEloReached: { type: Number, default: 1000 },
    seasonHighestElo: { type: Number, default: 1000 },
    allTimeHighestElo: { type: Number, default: 1000 },
    
    // Status and dates
    lastLoginDate: { type: Date },
    lastDailyQuestDate: { type: Date },
    lastDailyRewardDate: { type: Date },
    consecutiveLoginDays: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Helper function to calculate rank from ELO
function getRankFromElo(elo) {
  if (elo >= 3000) return 'Legend';
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const clampedElo = Math.max(1000, elo);
  const tierIndex = Math.min(tiers.length - 1, Math.floor((clampedElo - 1000) / 400));
  const tier = tiers[tierIndex];
  const subdivisionIndex = Math.min(3, Math.floor(((clampedElo - 1000) % 400) / 100));
  const subdivisions = ['IV', 'III', 'II', 'I'];
  return `${tier} ${subdivisions[subdivisionIndex]}`;
}

const RANK_ORDER = [
  'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
  'Silver IV', 'Silver III', 'Silver II', 'Silver I',
  'Gold IV', 'Gold III', 'Gold II', 'Gold I',
  'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I',
  'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I',
  'Legend'
];

function getRankValue(rankName) {
  return RANK_ORDER.indexOf(rankName);
}

function getTierFromRank(rankName) {
  if (!rankName) return 'Bronze';
  return rankName.split(' ')[0];
}

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
    const oldRank = this.rank || 'Bronze IV';
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

