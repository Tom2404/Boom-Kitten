function isAuthenticatedPlayer(player) {
  const userId = String(player?.userId || '');
  return userId && !player?.isBot && !userId.startsWith('guest-') && !userId.startsWith('bot-');
}

function shouldUpdateMatchmakingRating({ room, players }) {
  return room?.gameMode === 'matchmaking'
    && room?.status === 'finished'
    && Array.isArray(players)
    && players.length >= 2
    && players.every(isAuthenticatedPlayer);
}

function applyMatchmakingRating(user, rating) {
  if (!Number.isSafeInteger(rating) || rating < 1000) {
    throw new Error('Matchmaking rating must be a safe integer of at least 1000');
  }
  user.matchmakingRating = rating;
  return user;
}

module.exports = { applyMatchmakingRating, isAuthenticatedPlayer, shouldUpdateMatchmakingRating };
