export const TOURNAMENT_STATUS_LABELS = Object.freeze({
  registration: 'MỞ ĐĂNG KÝ',
  active: 'ĐANG THI ĐẤU',
  completed: 'ĐÃ KẾT THÚC',
  cancelled: 'ĐÃ HỦY',
});

export const MATCH_STATUS_LABELS = Object.freeze({
  blocked: 'CHƯA MỞ',
  pending: 'SẮP DIỄN RA',
  completed: 'HOÀN TẤT',
  forfeit: 'XỬ THUA',
});

export function getTournamentStatusLabel(status) {
  return TOURNAMENT_STATUS_LABELS[status] || 'KHÔNG XÁC ĐỊNH';
}

export function getMatchStatusLabel(status) {
  return MATCH_STATUS_LABELS[status] || 'CHƯA MỞ';
}

export function getTournamentStatusTone(status) {
  if (status === 'active') return 'bg-[var(--pop-amber)]';
  if (status === 'completed') return 'bg-[var(--pop-green,#65c18c)]';
  if (status === 'cancelled') return 'bg-[var(--pop-black)] text-white';
  return 'bg-[var(--pop-red)] text-white';
}

export function getTournamentDeadline(tournament) {
  if (!tournament) return null;
  if (tournament.status === 'registration') return tournament.registrationClosesAt || tournament.startTime;
  return tournament.startTime;
}

export function getCountdownParts(target, now = Date.now()) {
  const remaining = Math.max(0, new Date(target).getTime() - now);
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    totalSeconds,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatCountdown(target, now = Date.now()) {
  const parts = getCountdownParts(target, now);
  if (parts.days > 0) return `${parts.days} ngày ${String(parts.hours).padStart(2, '0')} giờ`;
  return `${String(parts.hours).padStart(2, '0')}:${String(parts.minutes).padStart(2, '0')}:${String(parts.seconds).padStart(2, '0')}`;
}

// Returns null when registration is allowed, otherwise the blocking reason.
// `coins === null` means the wallet is unknown (not logged in / profile fetch failed):
// never claim "not enough Coin" in that case, let the server decide.
export function getRegistrationBlockReason(tournament, coins = null, now = Date.now()) {
  if (!tournament || tournament.status !== 'registration') return 'closed';
  if (new Date(tournament.registrationClosesAt || tournament.startTime).getTime() <= now) return 'closed';
  if ((tournament.registeredCount || 0) >= (tournament.maxParticipants || 8)) return 'full';
  if (coins !== null && coins !== undefined && Number(coins) < Number(tournament.entryFee || 0)) return 'coins';
  return null;
}

export function isRegistrationAvailable(tournament, coins = null, now = Date.now()) {
  return getRegistrationBlockReason(tournament, coins, now) === null;
}

export function getNextMatchFromTournament(tournament, participantId) {
  if (!tournament?.bracket?.rounds || !participantId) return null;
  return tournament.bracket.rounds
    .flatMap((round) => (round.matches || []).map((match) => ({ ...match, stage: round.name })))
    .find((match) => match.status === 'pending' && match.participantIds?.map(String).includes(String(participantId))) || null;
}
