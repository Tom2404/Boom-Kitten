const RANK_TIERS = [
  { name: 'Bronze', floor: 1000, subdivisions: ['II', 'I'] },
  { name: 'Silver', floor: 1200, subdivisions: ['III', 'II', 'I'] },
  { name: 'Gold', floor: 1500, subdivisions: ['III', 'II', 'I'] },
  { name: 'Platinum', floor: 1800, subdivisions: ['IV', 'III', 'II', 'I'] },
  { name: 'Diamond', floor: 2200, subdivisions: ['IV', 'III', 'II', 'I'] },
  { name: 'Legend', floor: 2600, subdivisions: [] },
];

const RANK_ORDER = RANK_TIERS.flatMap((tier) => (
  tier.name === 'Legend' ? ['Legend'] : tier.subdivisions.map((division) => `${tier.name} ${division}`)
));

function getRankFromElo(elo) {
  const value = Math.max(1000, Number(elo) || 1000);
  if (value >= 2600) return 'Legend';

  const tier = [...RANK_TIERS].reverse().find((entry) => entry.name !== 'Legend' && value >= entry.floor) || RANK_TIERS[0];
  const divisionIndex = Math.min(tier.subdivisions.length - 1, Math.floor((value - tier.floor) / 100));
  return `${tier.name} ${tier.subdivisions[divisionIndex]}`;
}

function getTierFromRank(rank) {
  return rank === 'Legend' ? 'Legend' : String(rank || 'Bronze').split(' ')[0];
}

function getTierFloor(rank) {
  const tierName = getTierFromRank(rank);
  return RANK_TIERS.find((tier) => tier.name === tierName)?.floor ?? 1000;
}

function getRankValue(rank) {
  return RANK_ORDER.indexOf(rank);
}

function applyTierProtection({ eloBefore, eloAfter, protectionGames = 0, protectedFloor = 0 }) {
  let finalElo = eloAfter;
  let remainingGames = Math.max(0, protectionGames);
  let floor = protectedFloor || 0;

  if (remainingGames > 0) {
    finalElo = Math.max(finalElo, floor);
    remainingGames -= 1;
  }

  const previousTierFloor = getTierFloor(getRankFromElo(eloBefore));
  const newTierFloor = getTierFloor(getRankFromElo(finalElo));
  if (newTierFloor > previousTierFloor) {
    floor = newTierFloor;
    remainingGames = 3;
  }

  return { eloAfter: finalElo, protectionGames: remainingGames, protectedFloor: floor };
}

module.exports = { RANK_ORDER, RANK_TIERS, applyTierProtection, getRankFromElo, getRankValue, getTierFloor, getTierFromRank };
