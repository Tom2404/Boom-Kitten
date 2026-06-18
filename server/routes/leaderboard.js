// Leaderboard route for top players by ELO points and wins.
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper middleware for optional JWT auth to identify the current user
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, username: payload.username, role: payload.role };
  } catch (err) {
    // Ignore invalid tokens for optional auth
  }
  next();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { tier, search, limit = 20, skip = 0 } = req.query;

    const queryLimit = parseInt(limit, 10) || 20;
    const querySkip = parseInt(skip, 10) || 0;

    const matchQuery = {};

    // Filter by rank tier (Bronze, Silver, Gold, Platinum, Diamond, Legend)
    if (tier && tier !== 'ALL') {
      if (tier === 'Legend') {
        matchQuery.rank = 'Legend';
      } else {
        matchQuery.rank = new RegExp(`^${escapeRegExp(tier)}`, 'i');
      }
    }

    // Filter by username search
    if (search) {
      matchQuery.username = new RegExp(escapeRegExp(search), 'i');
    }

    // Fetch players sorted by ELO points descending, then wins descending
    const players = await User.find(matchQuery)
      .sort({ eloPoints: -1, 'stats.wins': -1 })
      .skip(querySkip)
      .limit(queryLimit)
      .select('username avatar rank eloPoints stats.wins stats.losses stats.totalGames');

    const totalCount = await User.countDocuments(matchQuery);

    // If user is authenticated, compute their absolute leaderboard rank
    let currentUserRankInfo = null;
    if (req.user) {
      const currentUser = await User.findById(req.user.id);
      if (currentUser) {
        const higherCount = await User.countDocuments({
          $or: [
            { eloPoints: { $gt: currentUser.eloPoints } },
            { eloPoints: currentUser.eloPoints, 'stats.wins': { $gt: currentUser.stats.wins } }
          ]
        });
        currentUserRankInfo = {
          rankPosition: higherCount + 1,
          username: currentUser.username,
          avatar: currentUser.avatar,
          rank: currentUser.rank,
          eloPoints: currentUser.eloPoints,
          wins: currentUser.stats.wins,
          totalGames: currentUser.stats.totalGames
        };
      }
    }

    return res.json({
      players,
      totalCount,
      currentUser: currentUserRankInfo
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
