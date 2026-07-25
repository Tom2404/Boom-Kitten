const mongoose = require('mongoose');
const GameHistory = require('../models/GameHistory');

async function startMatchHistory({ GameHistoryModel = GameHistory, isValidObjectId = mongoose.Types.ObjectId.isValid, room, now = new Date() }) {
  if (room.analyticsHistoryId) return String(room.analyticsHistoryId);
  const participantIds = room.players.map((player) => String(player.userId));
  const players = room.players.filter((player) => isValidObjectId(player.userId)).map((player) => ({ userId: player.userId }));
  const history = await GameHistoryModel.create({
    roomId: room.code,
    gameMode: room.gameMode || 'custom',
    edition: room.edition,
    participantIds,
    players,
    status: 'started',
    startedAt: now,
    playedAt: now,
  });
  return String(history._id);
}

async function completeMatchHistory({ GameHistoryModel = GameHistory, room, validPlayers, winnerId, seasonId, now = new Date() }) {
  const startedAt = room.startedAt ? new Date(room.startedAt) : now;
  const duration = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 1000));
  const completedFields = {
    seasonId,
    players: validPlayers,
    winner: winnerId,
    status: 'completed',
    duration,
    cardsPlayed: room.gameState?.discardPile?.length || 0,
    endedAt: now,
    playedAt: now,
  };
  if (room.analyticsHistoryId) {
    const completed = await GameHistoryModel.findOneAndUpdate(
      { _id: room.analyticsHistoryId, status: 'started' },
      { $set: completedFields },
      { new: true, runValidators: true },
    );
    return completed || GameHistoryModel.findById(room.analyticsHistoryId);
  }
  return GameHistoryModel.create({
    roomId: room.code,
    gameMode: room.gameMode || 'custom',
    edition: room.edition,
    participantIds: room.gameState?.players?.map((player) => String(player.userId)) || [],
    startedAt,
    ...completedFields,
  });
}

module.exports = { completeMatchHistory, startMatchHistory };
