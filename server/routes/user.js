// User profile and social routes.
const express = require('express');
const User = require('../models/User');
const GameHistory = require('../models/GameHistory');
const Transaction = require('../models/Transaction');
const Friendship = require('../models/Friendship');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

function isSameDay(a, b) {
  if (!a || !b) return false;
  return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
}

router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    if (!isSameDay(user.lastLoginDate, now)) {
      user.coins += 20;
      user.lastLoginDate = now;
      await user.save();
      await Transaction.create({
        userId: user._id,
        type: 'earn',
        amount: 20,
        currency: 'coin',
        description: 'Daily login bonus',
      });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

router.put('/me', async (req, res, next) => {
  try {
    const { username, avatar, activeSkin } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { username, avatar, activeSkin } },
      { new: true, runValidators: true },
    ).select('-passwordHash');
    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

router.get('/me/history', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const history = await GameHistory.find({ 'players.userId': req.user.id })
      .sort({ playedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.json(history);
  } catch (error) {
    return next(error);
  }
});

router.get('/me/friends', async (req, res, next) => {
  try {
    const friendships = await Friendship.find({
      $or: [
        { requester: req.user.id },
        { recipient: req.user.id },
      ],
      status: 'accepted',
    }).populate('requester recipient', 'username avatar rank');

    const friendsList = friendships.map((f) => {
      const friend = f.requester._id.toString() === req.user.id ? f.recipient : f.requester;
      return {
        _id: friend._id,
        username: friend.username,
        avatar: friend.avatar,
        rank: friend.rank,
      };
    });

    return res.json(friendsList);
  } catch (error) {
    return next(error);
  }
});

router.post('/friends/:id', async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (req.user.id === targetId) {
      return res.status(400).json({ message: 'Cannot add yourself as friend' });
    }

    let friendship = await Friendship.findOne({
      $or: [
        { requester: req.user.id, recipient: targetId },
        { requester: targetId, recipient: req.user.id },
      ],
    });

    if (!friendship) {
      // Create new pending friendship request
      await Friendship.create({
        requester: req.user.id,
        recipient: targetId,
        status: 'pending',
        actionUser: req.user.id,
      });
      return res.json({ success: true, message: 'Friend request sent' });
    }

    if (friendship.status === 'accepted') {
      return res.json({ success: true, message: 'Already friends' });
    }

    if (friendship.status === 'pending') {
      if (friendship.actionUser.toString() === targetId) {
        // We are accepting their request
        friendship.status = 'accepted';
        friendship.actionUser = req.user.id;
        await friendship.save();
        return res.json({ success: true, message: 'Friend request accepted' });
      } else {
        return res.json({ success: true, message: 'Friend request already pending' });
      }
    }

    if (friendship.status === 'declined' || friendship.status === 'blocked') {
      if (friendship.status === 'blocked' && friendship.actionUser.toString() === targetId) {
        return res.status(403).json({ message: 'You have been blocked by this user' });
      }
      // Re-send request
      friendship.status = 'pending';
      friendship.requester = req.user.id;
      friendship.recipient = targetId;
      friendship.actionUser = req.user.id;
      await friendship.save();
      return res.json({ success: true, message: 'Friend request sent again' });
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.post('/me/quests/daily-complete', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    if (isSameDay(user.lastDailyQuestDate, now)) {
      return res.status(400).json({ message: 'Daily quest already completed today' });
    }

    user.coins += 50;
    user.lastDailyQuestDate = now;
    await user.save();
    await Transaction.create({
      userId: user._id,
      type: 'earn',
      amount: 50,
      currency: 'coin',
      description: 'Daily quest reward',
    });
    return res.json({ success: true, coins: user.coins });
  } catch (error) {
    return next(error);
  }
});

router.post('/me/tournament/enter', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.coins < 50) return res.status(400).json({ message: 'Not enough coins' });

    user.coins -= 50;
    await user.save();
    await Transaction.create({
      userId: user._id,
      type: 'spend',
      amount: 50,
      currency: 'coin',
      description: 'Tournament entry fee',
    });
    return res.json({ success: true, coins: user.coins });
  } catch (error) {
    return next(error);
  }
});

router.delete('/friends/:id', async (req, res, next) => {
  try {
    const targetId = req.params.id;
    await Friendship.findOneAndDelete({
      $or: [
        { requester: req.user.id, recipient: targetId },
        { requester: targetId, recipient: req.user.id },
      ],
    });
    return res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('username avatar rank stats eloPoints');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
