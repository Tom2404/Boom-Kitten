const express = require('express');
const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const TournamentParticipant = require('../models/TournamentParticipant');
const authMiddleware = require('../middleware/authMiddleware');
const { publicTournament, registerPlayer, withdrawPlayer } = require('../services/tournamentPlayerService');
const { ensureTournamentMatchRoom } = require('../services/tournamentLifecycleService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const status = ['registration', 'active', 'completed'].includes(req.query.status) ? req.query.status : { $in: ['registration', 'active'] };
    const tournaments = await Tournament.find({ status }).sort({ startTime: 1, _id: 1 }).limit(100).lean();
    return res.json({ success: true, data: tournaments.map(publicTournament) });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Tournament not found' });
    const [tournament, standings, registration] = await Promise.all([
      Tournament.findById(req.params.id).lean(),
      TournamentParticipant.find({ tournamentId: req.params.id, paymentStatus: 'paid' })
        .populate('userId', 'username avatar').sort({ score: -1, registrationDate: 1 }).lean(),
      TournamentParticipant.findOne({ tournamentId: req.params.id, userId: req.user.id }).lean(),
    ]);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    const participantId = String(registration?._id || '');
    const nextMatch = (tournament.bracket?.rounds || [])
      .flatMap((round) => (round.matches || []).map((match) => ({ ...match, stage: round.name })))
      .find((match) => match.status === 'pending' && match.participantIds?.map(String).includes(participantId));
    return res.json({
      success: true,
      data: {
        tournament: publicTournament(tournament),
        standings: standings.map((row) => ({
          id: row._id, username: row.userId?.username, avatar: row.userId?.avatar,
          score: row.score, finalRank: row.finalRank, status: row.status,
        })),
        registration,
        nextMatch: nextMatch ? {
          id: nextMatch.id, matchReference: nextMatch.matchReference,
          status: nextMatch.status, roomCode: nextMatch.roomCode, stage: nextMatch.stage,
        } : null,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/matches/room', authMiddleware, async (req, res, next) => {
  try {
    const matchReference = String(req.body?.matchReference || '').trim();
    if (!matchReference || matchReference.length > 180) return res.status(422).json({ message: 'matchReference is required' });
    const room = await ensureTournamentMatchRoom({ tournamentId: req.params.id, matchReference, userId: req.user.id });
    return res.json({ success: true, data: room });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/register', authMiddleware, async (req, res, next) => {
  try {
    const requestId = String(req.body?.requestId || req.get('idempotency-key') || '').trim();
    if (!requestId || requestId.length > 120) return res.status(422).json({ message: 'requestId is required' });
    const participant = await registerPlayer({ tournamentId: req.params.id, userId: req.user.id, requestId });
    return res.status(201).json({ success: true, data: participant });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/withdraw', authMiddleware, async (req, res, next) => {
  try {
    const requestId = String(req.body?.requestId || req.get('idempotency-key') || '').trim();
    if (!requestId || requestId.length > 120) return res.status(422).json({ message: 'requestId is required' });
    const participant = await withdrawPlayer({ tournamentId: req.params.id, userId: req.user.id, requestId });
    return res.json({ success: true, data: participant });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
