// User schema stores auth, cosmetics, economy, social graph, and ranking stats.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    refreshTokenHash: { type: String, default: null, select: false },
    refreshTokenExpiresAt: { type: Date, default: null, select: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: ['user', 'admin', 'super_admin'],
      default: 'user',
    },
    isBanned: { type: Boolean, default: false },
    suspendedUntil: { type: Date },
    warningCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
    
    // Currency
    coins: { type: Number, default: 100, min: 0 },
    gems: { type: Number, default: 0, min: 0 },
    currencyMigrationVersion: { type: String, default: '' },
    
    // Inventory
    ownedSkins: [{ type: String }],
    ownedEmotes: [{ type: String }],
    ownedAvatarFrames: [{ type: String }],
    ownedItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' }],
    
    // Active cosmetics
    activeSkin: { type: String, default: '' },
    activeAvatarFrame: { type: String, default: '' },
    equippedCosmetics: {
      protector: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem', default: null },
      avatarFrame: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem', default: null },
      field: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem', default: null },
    },
    cosmeticInventoryMigrationVersion: { type: String, default: '' },
    
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
    matchmakingRating: { type: Number, default: 1000, min: 1000, index: true },
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

userSchema.index({ createdAt: 1, _id: 1 });

module.exports = mongoose.model('User', userSchema);

