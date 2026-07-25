import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTournamentCreatePayload,
  buildTournamentPayoutPayload,
  buildTournamentTransitionPayload,
  tournamentStatusTone,
} from '../src/pages/admin/adminTournament.js';

test('tournament create payload normalizes numbers, dates, reason and request id', () => {
  const payload = buildTournamentCreatePayload({ name: ' July Cup ', description: ' Finals ', entryFee: '50', minEloRequired: '1000', maxParticipants: '16', prizeCoins: '500', prizeGems: '10', startTime: '2026-07-25T12:00', registrationClosesAt: '2026-07-25T11:00', reason: ' Schedule ' }, 'req-1');
  assert.equal(payload.name, 'July Cup');
  assert.equal(payload.entryFee, 50);
  assert.equal(payload.prizePool.gems, 10);
  assert.match(payload.startTime, /^2026-07-25T/);
  assert.equal(payload.reason, 'Schedule');
  assert.equal(payload.requestId, 'req-1');
});

test('transition and critical payout payloads preserve optimistic version and confirmation', () => {
  assert.deepEqual(buildTournamentTransitionPayload({ nextStatus: 'active', expectedVersion: 3, reason: ' Start ', requestId: 'req-2' }), { nextStatus: 'active', expectedVersion: 3, reason: 'Start', requestId: 'req-2' });
  const payout = buildTournamentPayoutPayload({ previewToken: 'token', expectedVersion: 7, reason: ' Pay ', confirmationUsername: 'root', requestId: 'req-3' });
  assert.equal(payout.previewToken, 'token');
  assert.equal(payout.confirmation.username, 'root');
  assert.equal(payout.expectedVersion, 7);
  assert.equal(tournamentStatusTone('cancelled'), 'danger');
});
