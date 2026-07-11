const MIN_ELO = 1000;

function getExpectedScore(playerElo, opponentElo) {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

function getActualScore(playerPlacement, opponentPlacement) {
  if (playerPlacement < opponentPlacement) return 1;
  if (playerPlacement > opponentPlacement) return 0;
  return 0.5;
}

function getKFactor({ elo, gamesPlayed }) {
  if (gamesPlayed < 10) return 60;
  if (gamesPlayed < 30) return 45;
  if (elo >= 2600) return 20;
  if (elo >= 2200) return 28;
  if (elo >= 1800) return 32;
  return 36;
}

function getStreakBonus(winStreak) {
  if (winStreak >= 4) return 10;
  if (winStreak === 3) return 6;
  if (winStreak === 2) return 3;
  return 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateMultiplayerElo(players) {
  const playerCount = players.length;
  if (playerCount < 2) return [];

  const multiplier = 1 + ((playerCount - 2) * 0.15);

  return players.map((player) => {
    const k = getKFactor({
      elo: player.eloBefore,
      gamesPlayed: player.gamesPlayed || 0,
    });

    let totalPairDelta = 0;

    for (const opponent of players) {
      if (opponent.userId === player.userId) continue;

      const expected = getExpectedScore(player.eloBefore, opponent.eloBefore);
      const actual = getActualScore(player.placement, opponent.placement);

      totalPairDelta += actual - expected;
    }

    const averagePairDelta = totalPairDelta / (playerCount - 1);
    const rawDelta = k * averagePairDelta * multiplier;

    const gamesPlayed = player.gamesPlayed || 0;
    const maxChange = gamesPlayed < 10 ? 80 : gamesPlayed < 30 ? 65 : 50;
    let finalDelta = Math.round(clamp(rawDelta, -maxChange, maxChange));
    const isTopHalf = player.placement <= Math.ceil(playerCount / 2);

    if (gamesPlayed < 10 && isTopHalf && finalDelta < 0) finalDelta = 0;
    if (player.placement === 1) finalDelta += getStreakBonus(player.winStreak || 0);

    const eloAfter = Math.max(MIN_ELO, player.eloBefore + finalDelta);

    return {
      userId: player.userId,
      eloBefore: player.eloBefore,
      eloAfter,
      eloDelta: eloAfter - player.eloBefore,
      placement: player.placement,
    };
  });
}

module.exports = {
  getExpectedScore,
  getActualScore,
  getKFactor,
  getStreakBonus,
  calculateMultiplayerElo,
};
