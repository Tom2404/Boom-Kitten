const TOURNAMENT_FORMAT = 'groups_then_final_v1';
const TOURNAMENT_MAX_PARTICIPANTS = 8;
const TOURNAMENT_MATCH_GRACE_MS = 5 * 60 * 1000;
const TOURNAMENT_PLACEMENT_POINTS = Object.freeze({ 1: 5, 2: 3, 3: 1, 4: 0 });
const TOURNAMENT_PAYOUT_WEIGHTS = Object.freeze([60, 30, 10]);

const TOURNAMENT_RULES = Object.freeze({
  version: 1,
  format: TOURNAMENT_FORMAT,
  maxParticipants: TOURNAMENT_MAX_PARTICIPANTS,
  groupCount: 2,
  groupSize: 4,
  groupMatches: 3,
  finalMatches: 5,
  placementPoints: TOURNAMENT_PLACEMENT_POINTS,
  tieBreak: Object.freeze(['points', 'wins', 'placementSum', 'seed', 'participantId']),
  matchGraceMinutes: 5,
  payoutWeights: TOURNAMENT_PAYOUT_WEIGHTS,
  cosmeticRewardsAffectGameplay: false,
});

module.exports = {
  TOURNAMENT_FORMAT,
  TOURNAMENT_MAX_PARTICIPANTS,
  TOURNAMENT_MATCH_GRACE_MS,
  TOURNAMENT_PLACEMENT_POINTS,
  TOURNAMENT_PAYOUT_WEIGHTS,
  TOURNAMENT_RULES,
};
