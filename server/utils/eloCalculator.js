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
  if (gamesPlayed < 10) return 40;
  if (elo >= 3000) return 16;
  if (elo >= 2400) return 24;
  if (elo >= 1600) return 28;
  return 32;
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

    const maxChange = (player.gamesPlayed || 0) < 10 ? 70 : 50;
    const finalDelta = Math.round(clamp(rawDelta, -maxChange, maxChange));

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
  calculateMultiplayerElo,
};
