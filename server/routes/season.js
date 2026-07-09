const express = require('express');
const Season = require('../models/Season');

const router = express.Router();

// GET /api/seasons/active - Get the currently active season
router.get('/active', async (req, res, next) => {
  try {
    const now = new Date();
    
    // Find active season or activate a scheduled one if dates match
    let season = await Season.findOne({
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: 'active'
    });

    if (!season) {
      season = await Season.findOne({
        startDate: { $lte: now },
        endDate: { $gte: now },
        status: 'scheduled'
      });
      if (season) {
        season.status = 'active';
        await season.save();
      }
    }

    // Auto transition active seasons to ended if end date has passed
    const expiredActiveSeason = await Season.findOne({
      endDate: { $lt: now },
      status: 'active'
    });
    if (expiredActiveSeason) {
      expiredActiveSeason.status = 'ended';
      await expiredActiveSeason.save();
    }

    // Fetch the active season again in case status changed
    if (!season) {
      season = await Season.findOne({
        startDate: { $lte: now },
        endDate: { $gte: now },
        status: 'active'
      });
    }

    if (!season) {
      return res.json({ active: false, message: 'No active season' });
    }

    return res.json({
      active: true,
      season: {
        id: season._id,
        seasonNumber: season.seasonNumber,
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        status: season.status,
        settings: season.settings
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
