const STAKE_TIERS = Object.freeze([0, 10, 25, 50, 100]);
const WAGER_TRANSITIONS = Object.freeze({
  created: new Set(['locked', 'refunded', 'review_required']),
  locked: new Set(['settled', 'refunded', 'review_required']),
  settled: new Set(),
  refunded: new Set(),
  review_required: new Set(['refunded']),
});

function validateStake(stake) {
  if (!Number.isSafeInteger(stake) || !STAKE_TIERS.includes(stake)) {
    throw new RangeError(`stake must be one of: ${STAKE_TIERS.join(', ')}`);
  }
  return stake;
}

function assertWagerTransition(current, next) {
  if (current === next && ['settled', 'refunded'].includes(current)) return next;
  if (!WAGER_TRANSITIONS[current]?.has(next)) {
    throw new Error(`Invalid wager transition: ${current} -> ${next}`);
  }
  return next;
}

function buildLockedParticipants(players, stake) {
  validateStake(stake);
  if (!Array.isArray(players) || players.length < 2 || players.length > 5) {
    throw new RangeError('wager tables require 2 to 5 authenticated players');
  }
  const userIds = players.map((player) => String(player?.userId || ''));
  if (userIds.some((id) => !id || id.startsWith('guest-') || id.startsWith('bot-'))) {
    throw new Error('Wagers require authenticated players');
  }
  if (new Set(userIds).size !== userIds.length) throw new Error('Duplicate wager participant');
  return userIds.map((userId) => ({ userId, lockedCoins: stake, payoutCoins: 0 }));
}

function allocateWagerPot(placements, stake) {
  validateStake(stake);
  if (!Array.isArray(placements) || placements.length < 2 || placements.length > 5) {
    throw new RangeError('wager tables require 2 to 5 players');
  }

  const rows = placements.map(({ userId, placement }) => ({
    userId: String(userId || ''),
    placement,
    payout: 0,
  })).sort((left, right) => left.placement - right.placement);

  if (new Set(rows.map((row) => row.userId)).size !== rows.length || rows.some((row) => !row.userId)) {
    throw new RangeError('duplicate user or missing user');
  }
  if (
    new Set(rows.map((row) => row.placement)).size !== rows.length
    || rows.some((row, index) => row.placement !== index + 1)
  ) {
    throw new RangeError('duplicate placement or invalid placement');
  }

  const shares = rows.length <= 3 ? [1] : rows.length === 4 ? [0.7, 0.3] : [0.6, 0.25, 0.15];
  const pot = stake * rows.length;
  let allocated = 0;
  shares.forEach((share, index) => {
    rows[index].payout = Math.floor(pot * share);
    allocated += rows[index].payout;
  });
  rows[0].payout += pot - allocated;
  return rows;
}

module.exports = {
  STAKE_TIERS,
  WAGER_TRANSITIONS,
  allocateWagerPot,
  assertWagerTransition,
  buildLockedParticipants,
  validateStake,
};
