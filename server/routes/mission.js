// Mission routes for public quests list and protected reward claims.
const express = require('express');
const jwt = require('jsonwebtoken');
const Quest = require('../models/Quest');
const UserQuestProgress = require('../models/UserQuestProgress');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Helper function to check if dates are the same day
function isSameDay(a, b) {
  if (!a || !b) return false;
  return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
}

// Optional authentication middleware to populate user progress if logged in
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

// GET /api/missions - Get all active missions (with progress if logged in)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const activeQuests = await Quest.find({ isActive: true });
    
    // If guest (not logged in)
    if (!req.user) {
      const results = activeQuests.map((quest) => ({
        questId: quest._id,
        title: quest.title,
        description: quest.description,
        actionType: quest.actionType,
        targetCount: quest.targetCount,
        reward: quest.reward,
        currentCount: 0,
        status: 'locked',
        loginRequired: true,
      }));
      return res.json(results);
    }

    // If logged in user
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const results = await Promise.all(
      activeQuests.map(async (quest) => {
        let progress = await UserQuestProgress.findOne({
          userId: req.user.id,
          questId: quest._id,
        });

        if (!progress) {
          progress = await UserQuestProgress.create({
            userId: req.user.id,
            questId: quest._id,
            currentCount: 0,
            status: 'in_progress',
            expiresAt: endOfDay,
          });
        } else if (progress.expiresAt < now) {
          progress.currentCount = 0;
          progress.status = 'in_progress';
          progress.expiresAt = endOfDay;
          await progress.save();
        }

        // Auto transition status to 'completed' if count >= target and status is 'in_progress'
        if (progress.status === 'in_progress' && progress.currentCount >= quest.targetCount) {
          progress.status = 'completed';
          await progress.save();
        }

        return {
          questId: quest._id,
          title: quest.title,
          description: quest.description,
          actionType: quest.actionType,
          targetCount: quest.targetCount,
          reward: quest.reward,
          currentCount: progress.currentCount,
          status: progress.status,
          loginRequired: false,
        };
      })
    );

    return res.json(results);
  } catch (error) {
    return next(error);
  }
});

// POST /api/missions/:questId/claim - Claim quest reward (requires auth)
router.post('/:questId/claim', authMiddleware, async (req, res, next) => {
  try {
    const { questId } = req.params;
    const quest = await Quest.findById(questId);
    if (!quest) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại' });

    const updateQuery = {
      userId: req.user.id,
      questId: questId,
      status: { $ne: 'claimed' },
      $or: [
        { status: 'completed' },
        { currentCount: { $gte: quest.targetCount } }
      ]
    };

    const progress = await UserQuestProgress.findOneAndUpdate(
      updateQuery,
      { $set: { status: 'claimed' } },
      { new: false }
    );

    if (!progress) {
      const currentProgress = await UserQuestProgress.findOne({
        userId: req.user.id,
        questId: questId,
      });

      if (!currentProgress) {
        return res.status(404).json({ message: 'Tiến trình nhiệm vụ không tìm thấy' });
      }
      if (currentProgress.status === 'claimed') {
        return res.status(400).json({ message: 'Nhiệm vụ đã được nhận thưởng trước đó' });
      }
      return res.status(400).json({ message: 'Nhiệm vụ chưa hoàn thành' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      // Rollback progress status if user not found
      await UserQuestProgress.findByIdAndUpdate(progress._id, { $set: { status: progress.status } });
      return res.status(404).json({ message: 'Người chơi không tìm thấy' });
    }

    const rewardCoins = quest.reward?.coins ?? 0;
    const rewardGems = quest.reward?.gems ?? 0;

    user.coins += rewardCoins;
    user.gems += rewardGems;
    await user.save();

    if (rewardCoins > 0) {
      await Transaction.create({
        userId: user._id,
        type: 'earn',
        amount: rewardCoins,
        currency: 'coin',
        description: `Nhận thưởng nhiệm vụ: ${quest.title}`,
      });
    }

    if (rewardGems > 0) {
      await Transaction.create({
        userId: user._id,
        type: 'earn',
        amount: rewardGems,
        currency: 'gem',
        description: `Nhận thưởng nhiệm vụ: ${quest.title}`,
      });
    }

    return res.json({
      success: true,
      coins: user.coins,
      gems: user.gems,
      status: 'claimed',
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
