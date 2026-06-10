// Leaderboard route for top players by win rate with min game threshold.
const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const users = await User.aggregate([
      {
        $addFields: {
          totalGames: '$stats.totalGames',
          winRate: {
            $cond: [
              { $gt: ['$stats.totalGames', 0] },
              { $divide: ['$stats.wins', '$stats.totalGames'] },
              0,
            ],
          },
        },
      },
      { $match: { totalGames: { $gte: 10 } } },
      { $sort: { winRate: -1, eloPoints: -1 } },
      { $limit: 20 },
      { $project: { username: 1, avatar: 1, rank: 1, eloPoints: 1, winRate: 1 } },
    ]);

    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
