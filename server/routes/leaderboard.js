const express = require('express');
const { getTopLeaderboard } = require('../services/leaderboardService');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    return res.json({ success: true, data: await getTopLeaderboard() });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
