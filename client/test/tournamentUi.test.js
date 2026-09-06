import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCountdown,
  getCountdownParts,
  getMatchStatusLabel,
  getNextMatchFromTournament,
  getRegistrationBlockReason,
  getTournamentStatusLabel,
  isRegistrationAvailable,
} from '../src/pages/tournamentUi.js';

test('Tournament UI exposes readable status and countdown contracts', () => {
  assert.equal(getTournamentStatusLabel('registration'), 'MỞ ĐĂNG KÝ');
  assert.equal(getMatchStatusLabel('completed'), 'HOÀN TẤT');
  assert.deepEqual(getCountdownParts('2026-01-01T00:01:05Z', Date.parse('2026-01-01T00:00:00Z')), {
    totalSeconds: 65, days: 0, hours: 0, minutes: 1, seconds: 5,
  });
  assert.equal(formatCountdown('2026-01-01T00:01:05Z', Date.parse('2026-01-01T00:00:00Z')), '00:01:05');
});

test('registration gate checks status, deadline, and Coin balance', () => {
  const tournament = { status: 'registration', entryFee: 50, registrationClosesAt: '2026-01-02T00:00:00Z' };
  const open = Date.parse('2026-01-01T00:00:00Z');
  assert.equal(isRegistrationAvailable(tournament, 50, open), true);
  assert.equal(isRegistrationAvailable(tournament, 49, open), false);
  assert.equal(isRegistrationAvailable(tournament, 50, Date.parse('2026-01-03T00:00:00Z')), false);
});

test('block reason distinguishes coins, capacity, closure, and unknown wallet', () => {
  const tournament = { status: 'registration', entryFee: 50, registrationClosesAt: '2026-01-02T00:00:00Z' };
  const open = Date.parse('2026-01-01T00:00:00Z');
  assert.equal(getRegistrationBlockReason(tournament, 10000, open), null);
  assert.equal(getRegistrationBlockReason(tournament, 49, open), 'coins');
  // Unknown wallet must not be reported as "not enough Coin".
  assert.equal(getRegistrationBlockReason(tournament, null, open), null);
  assert.equal(getRegistrationBlockReason({ ...tournament, registeredCount: 8 }, 10000, open), 'full');
  assert.equal(getRegistrationBlockReason(tournament, 10000, Date.parse('2026-01-03T00:00:00Z')), 'closed');
});

test('next match lookup only returns the current participant pending match', () => {
  const tournament = {
    bracket: {
      rounds: [{
        name: 'Bảng A', matches: [
          { id: 'm1', status: 'completed', participantIds: ['p1'] },
          { id: 'm2', status: 'pending', participantIds: ['p1', 'p2'] },
        ]
      }]
    }
  };
  assert.equal(getNextMatchFromTournament(tournament, 'p1').id, 'm2');
  assert.equal(getNextMatchFromTournament(tournament, 'p9'), null);
});
