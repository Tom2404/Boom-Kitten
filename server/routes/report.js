const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const GameHistory = require('../models/GameHistory');
const { getRoomState } = require('../game/roomManager');
const { createPlayerReport } = require('../services/admin/moderationService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(authMiddleware);

router.post('/', async (req, res, next) => {
  try {
    const { targetPlayerId, roomId, matchId } = req.body;
    if (roomId) {
      const room = getRoomState(roomId);
      const participants = room?.players?.map((player) => String(player.userId)) || [];
      if (!participants.includes(String(req.user.id)) || !participants.includes(String(targetPlayerId))) throw new ApiError(422, 'REPORT_CONTEXT_INVALID', 'Room context không hợp lệ.');
    }
    if (matchId) {
      const match = await GameHistory.exists({ _id: matchId, $or: [{ participantIds: { $all: [String(req.user.id), String(targetPlayerId)] } }, { 'players.userId': { $all: [req.user.id, targetPlayerId] } }] });
      if (!match) throw new ApiError(422, 'REPORT_CONTEXT_INVALID', 'Match context không hợp lệ.');
    }
    const data = await createPlayerReport({ reporterId: req.user.id, input: req.body });
    return res.status(201).json({ success: true, data: { reportId: data.report._id, caseId: data.moderationCase._id } });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
