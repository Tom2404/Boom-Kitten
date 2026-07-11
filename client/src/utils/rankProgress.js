const RANK_STEPS = [
  ['Bronze II', 1000], ['Bronze I', 1100],
  ['Silver III', 1200], ['Silver II', 1300], ['Silver I', 1400],
  ['Gold III', 1500], ['Gold II', 1600], ['Gold I', 1700],
  ['Platinum IV', 1800], ['Platinum III', 1900], ['Platinum II', 2000], ['Platinum I', 2100],
  ['Diamond IV', 2200], ['Diamond III', 2300], ['Diamond II', 2400], ['Diamond I', 2500],
  ['Legend', 2600],
];

export function getRankProgress(elo) {
  const value = Math.max(1000, Number(elo) || 1000);
  const currentIndex = Math.max(0, RANK_STEPS.findLastIndex(([, floor]) => value >= floor));
  const [currentRank, currentFloor] = RANK_STEPS[currentIndex];
  const next = RANK_STEPS[currentIndex + 1];

  if (!next) return { currentRank, nextRank: null, progress: 100, remaining: 0 };
  const [nextRank, nextFloor] = next;
  const progress = Math.min(100, Math.max(0, ((value - currentFloor) / (nextFloor - currentFloor)) * 100));
  return { currentRank, nextRank, progress, remaining: Math.max(0, nextFloor - value) };
}
