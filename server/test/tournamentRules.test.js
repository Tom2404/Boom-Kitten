const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TOURNAMENT_FORMAT,
  TOURNAMENT_MATCH_GRACE_MS,
  TOURNAMENT_MAX_PARTICIPANTS,
  TOURNAMENT_RULES,
} = require('../utils/tournamentRules');

test('publishes one deterministic Tournament v1 rules contract', () => {
  assert.equal(TOURNAMENT_FORMAT, 'groups_then_final_v1');
  assert.equal(TOURNAMENT_MAX_PARTICIPANTS, 8);
  assert.equal(TOURNAMENT_MATCH_GRACE_MS, 300000);
  assert.deepEqual(TOURNAMENT_RULES.placementPoints, { 1: 5, 2: 3, 3: 1, 4: 0 });
  assert.deepEqual(TOURNAMENT_RULES.tieBreak, ['points', 'wins', 'placementSum', 'seed', 'participantId']);
  assert.deepEqual(TOURNAMENT_RULES.payoutWeights, [60, 30, 10]);
});
