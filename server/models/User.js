// User schema stores auth, cosmetics, economy, social graph, and ranking stats.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    coins: { type: Number, default: 100 },
    gems: { type: Number, default: 0 },
    ownedSkins: [{ type: String }],
    activeSkin: { type: String, default: '' },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
    eloPoints: { type: Number, default: 1000 },
    lastLoginDate: { type: Date },
    lastDailyQuestDate: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.model('User', userSchema);
