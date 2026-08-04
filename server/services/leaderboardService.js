const User = require('../models/User');

function toLeaderboardRows(users) {
  return users.map((user, index) => {
    const wins = Number(user.stats?.wins || 0);
    const losses = Number(user.stats?.losses || 0);
    const totalGames = Number(user.stats?.totalGames || 0);
    return {
      rank: index + 1,
      userId: String(user._id),
      username: user.username,
      avatar: user.avatar || '',
      rating: Number(user.matchmakingRating || 1000),
      wins,
      losses,
      totalGames,
      winRate: totalGames ? Math.round((wins / totalGames) * 100) : 0,
    };
  });
}

async function getTopLeaderboard({ UserModel = User, now = new Date() } = {}) {
  const users = await UserModel.find({
    role: 'user',
    deletedAt: null,
    isBanned: false,
    'stats.totalGames': { $gt: 0 },
    $or: [{ suspendedUntil: { $exists: false } }, { suspendedUntil: null }, { suspendedUntil: { $lte: now } }],
  })
    .select('username avatar matchmakingRating stats')
    .sort({ matchmakingRating: -1, 'stats.wins': -1, _id: 1 })
    .limit(20)
    .lean();

  return toLeaderboardRows(users);
}

module.exports = { getTopLeaderboard, toLeaderboardRows };
