/**
 * Seat Allocation Utility for Boom-Kitten Horseshoe (Semi-Oval) Layout
 */

export const SEAT_PRESETS = {
  1: ['top-center'],
  2: ['top-left', 'top-right'],
  3: ['left-middle', 'top-center', 'right-middle'],
  4: ['left-middle', 'top-left', 'top-right', 'right-middle'],
  5: ['left-lower', 'left-upper', 'top-center', 'right-upper', 'right-lower'],
};

/**
 * Calculates relative opponents order starting right after myUserId in the room list.
 * Note: Changing playDirection (Reverse card) does NOT alter the physical seat positions!
 */
export function calculateRelativeOpponents(players, myUserId) {
  if (!players || players.length === 0) return [];
  const selfIndex = players.findIndex((p) => p.userId === myUserId);
  if (selfIndex === -1) return players.filter((p) => p.userId !== myUserId);

  const total = players.length;
  const opponents = [];
  
  for (let i = 1; i < total; i++) {
    const oppIndex = (selfIndex + i) % total;
    opponents.push(players[oppIndex]);
  }

  return opponents;
}

/**
 * Returns the seat preset class for an opponent at index i out of count total opponents.
 */
export function getOpponentSeatClass(index, totalOpponents) {
  const count = Math.min(Math.max(totalOpponents, 1), 5);
  const preset = SEAT_PRESETS[count] || SEAT_PRESETS[5];
  return preset[index] || `seat-${index}`;
}
