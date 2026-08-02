import { buildCriticalAdminPayload, buildRoutineAdminPayload } from './adminMutation.js';

export function buildTournamentCreatePayload(form, requestId) {
  return buildRoutineAdminPayload({
    name: form.name.trim(),
    description: form.description.trim(),
    entryFee: Number(form.entryFee),
    maxParticipants: 8,
    prizePool: { coins: Number(form.prizeCoins) },
    cosmeticRewards: (form.cosmeticRewards || [])
      .filter((reward) => reward.itemId?.trim())
      .map((reward) => ({ rank: Number(reward.rank), type: reward.type, itemId: reward.itemId.trim() })),
    registrationOpensAt: form.registrationOpensAt ? new Date(form.registrationOpensAt).toISOString() : undefined,
    startTime: new Date(form.startTime).toISOString(),
    registrationClosesAt: new Date(form.registrationClosesAt || form.startTime).toISOString(),
    reason: form.reason.trim(),
  }, requestId);
}

export function buildTournamentTransitionPayload({ nextStatus, expectedVersion, reason, requestId }) {
  return buildRoutineAdminPayload({ nextStatus, expectedVersion, reason: reason.trim() }, requestId);
}

export function buildTournamentPayoutPayload({ previewToken, expectedVersion, reason, confirmationUsername, requestId }) {
  return { previewToken, expectedVersion, ...buildCriticalAdminPayload({ reason: reason.trim(), confirmationUsername, requestId }) };
}

export function tournamentStatusTone(status) {
  if (status === 'active' || status === 'completed') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'warning';
}
