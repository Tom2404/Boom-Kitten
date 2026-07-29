const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyTournamentMatchResult,
  buildEightPlayerTournament,
  tournamentStandings,
} = require('../services/tournamentLifecycleService');

function participants() {
  return Array.from({ length: 8 }, (_, index) => ({
    _id: `participant-${index + 1}`,
    userId: { _id: `user-${index + 1}`, username: `Player ${index + 1}` },
    registrationDate: new Date(`2026-01-01T00:00:0${index}Z`),
  }));
}

test('eight-player schedule deterministically creates two groups, three matches per group, and five finals', () => {
  const bracket = buildEightPlayerTournament('cup-1', participants());
  assert.equal(bracket.format, 'groups_then_final_v1');
  assert.deepEqual(bracket.rounds.map((round) => round.matches.length), [3, 3, 5]);
  assert.deepEqual(bracket.rounds[0].matches[0].participantIds, ['participant-1', 'participant-3', 'participant-5', 'participant-7']);
  assert.deepEqual(bracket.rounds[1].matches[0].participantIds, ['participant-2', 'participant-4', 'participant-6', 'participant-8']);
  assert.equal(bracket.rounds[2].matches[0].status, 'blocked');
});

test('match result is idempotent and unlocks finals with deterministic tie-breaks', () => {
  let bracket = buildEightPlayerTournament('cup-1', participants());
  for (const round of bracket.rounds.slice(0, 2)) {
    for (const match of round.matches) {
      const placements = match.participantIds.map((participantId, index) => ({ participantId, placement: index + 1 }));
      ({ bracket } = applyTournamentMatchResult(bracket, match.matchReference, placements));
    }
  }
  assert.deepEqual(bracket.rounds[2].matches.map((match) => match.status), ['pending', 'blocked', 'blocked', 'blocked', 'blocked']);
  assert.deepEqual(bracket.rounds[2].matches[0].participantIds, [
    'participant-1', 'participant-3', 'participant-2', 'participant-4',
  ]);

  const final = bracket.rounds[2].matches[0];
  const first = applyTournamentMatchResult(bracket, final.matchReference, final.participantIds.map((participantId, index) => ({ participantId, placement: index + 1 })));
  const replay = applyTournamentMatchResult(first.bracket, final.matchReference, final.participantIds.map((participantId, index) => ({ participantId, placement: index + 1 })));
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.scoreDeltas, []);
});

test('five completed finals produce stable ranks for all eight players', () => {
  let bracket = buildEightPlayerTournament('cup-1', participants());
  for (const round of bracket.rounds.slice(0, 2)) {
    for (const match of round.matches) {
      ({ bracket } = applyTournamentMatchResult(bracket, match.matchReference, match.participantIds.map((participantId, index) => ({ participantId, placement: index + 1 }))));
    }
  }
  for (const match of bracket.rounds[2].matches) {
    ({ bracket } = applyTournamentMatchResult(bracket, match.matchReference, match.participantIds.map((participantId, index) => ({ participantId, placement: index + 1 }))));
  }
  const standings = tournamentStandings(bracket);
  assert.equal(standings.length, 8);
  assert.deepEqual(standings.map((row) => row.finalRank), [1, 2, 3, 4, 5, 6, 7, 8]);
});
