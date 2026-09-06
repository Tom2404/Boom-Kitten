const crypto = require('crypto');
const Tournament = require('../models/Tournament');
const TournamentParticipant = require('../models/TournamentParticipant');
const User = require('../models/User');
const roomManager = require('../game/roomManager');
const { ApiError } = require('../utils/apiResponse');
const { toPlayerPresentation } = require('./shopEquipmentService');
const {
  createTournamentPayoutPreview,
  executeTournamentPayout,
} = require('./admin/tournamentService');
const { refundCancelledTournamentEntries } = require('./tournamentPlayerService');
const {
  TOURNAMENT_FORMAT,
  TOURNAMENT_MATCH_GRACE_MS,
  TOURNAMENT_MAX_PARTICIPANTS,
  TOURNAMENT_PLACEMENT_POINTS,
} = require('../utils/tournamentRules');

const PLACEMENT_POINTS = TOURNAMENT_PLACEMENT_POINTS;

function identity(participant, seed) {
  const user = participant.userId || {};
  return {
    participantId: String(participant._id),
    userId: String(user._id || user),
    username: user.username || 'Unknown',
    seed,
  };
}

function scheduledMatch(tournamentId, stage, number, participants, status = 'blocked', scheduledAt = null, graceMs = TOURNAMENT_MATCH_GRACE_MS) {
  const id = `${stage}-m${number}`;
  return {
    id,
    matchReference: `${tournamentId}:${id}`,
    participantIds: participants.map((row) => row.participantId),
    participants,
    status,
    roomCode: null,
    scheduledAt,
    deadlineAt: scheduledAt ? new Date(new Date(scheduledAt).getTime() + graceMs).toISOString() : null,
    resultSource: null,
    result: [],
  };
}

function markPending(match, now = new Date(), graceMs = TOURNAMENT_MATCH_GRACE_MS) {
  match.status = 'pending';
  match.scheduledAt = new Date(now).toISOString();
  match.deadlineAt = new Date(new Date(now).getTime() + graceMs).toISOString();
  return match;
}

function buildEightPlayerTournament(tournamentId, participants, startedAt = new Date()) {
  if (participants.length !== 8) throw new ApiError(409, 'STATE_CONFLICT', 'Format MVP cần đúng 8 người chơi đã thanh toán.');
  const seeded = [...participants]
    .sort((left, right) => new Date(left.registrationDate || 0) - new Date(right.registrationDate || 0) || String(left._id).localeCompare(String(right._id)))
    .map(identity);
  const groups = [
    { id: 'group-a', name: 'Bảng A', participants: seeded.filter((_, index) => index % 2 === 0) },
    { id: 'group-b', name: 'Bảng B', participants: seeded.filter((_, index) => index % 2 === 1) },
  ];
  const rounds = groups.map((group) => ({
    round: group.id,
    name: group.name,
    matches: Array.from({ length: 3 }, (_, index) => scheduledMatch(tournamentId, group.id, index + 1, group.participants, index === 0 ? 'pending' : 'blocked', index === 0 ? new Date(startedAt).toISOString() : null)),
  }));
  rounds.push({
    round: 'final',
    name: 'Chung kết',
    matches: Array.from({ length: 5 }, (_, index) => scheduledMatch(tournamentId, 'final', index + 1, [], 'blocked')),
  });
  return {
    format: TOURNAMENT_FORMAT,
    rulesVersion: 1,
    scoring: { placementPoints: PLACEMENT_POINTS, tieBreak: ['points', 'wins', 'placementSum', 'seed', 'participantId'] },
    participants: seeded,
    rounds,
  };
}

function allMatches(bracket) {
  return (bracket.rounds || []).flatMap((round) => round.matches || []);
}

function scoreTable(matches, participantIds) {
  const rows = new Map(participantIds.map((participantId) => [participantId, {
    participantId, points: 0, wins: 0, placementSum: 0, matchesPlayed: 0,
  }]));
  for (const match of matches) {
    if (match.status !== 'completed') continue;
    for (const result of match.result || []) {
      const row = rows.get(result.participantId);
      if (!row) continue;
      row.points += result.points;
      row.wins += result.placement === 1 ? 1 : 0;
      row.placementSum += result.placement;
      row.matchesPlayed += 1;
    }
  }
  const seed = new Map((matches[0]?.participants || []).map((person) => [person.participantId, person.seed]));
  return [...rows.values()].sort((left, right) => (
    right.points - left.points
    || right.wins - left.wins
    || left.placementSum - right.placementSum
    || (seed.get(left.participantId) ?? Number.MAX_SAFE_INTEGER) - (seed.get(right.participantId) ?? Number.MAX_SAFE_INTEGER)
    || left.participantId.localeCompare(right.participantId)
  ));
}

function findMatch(bracket, reference) {
  for (const round of bracket.rounds || []) {
    const match = (round.matches || []).find((item) => item.matchReference === reference);
    if (match) return { round, match };
  }
  return null;
}

function unlockNextMatch(round, completedMatch) {
  const index = round.matches.findIndex((match) => match.id === completedMatch.id);
  const next = round.matches[index + 1];
  if (next?.status === 'blocked') markPending(next);
}

function groupQualifiers(bracket) {
  return bracket.rounds.slice(0, 2).flatMap((round) => scoreTable(round.matches, round.matches[0].participantIds).slice(0, 2));
}

function applyTournamentMatchResult(bracketInput, matchReference, placements) {
  const bracket = structuredClone(bracketInput);
  const located = findMatch(bracket, matchReference);
  if (!located) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy trận Tournament.');
  const { round, match } = located;
  if (match.status === 'completed') return { bracket, replayed: true, scoreDeltas: [] };
  if (match.status !== 'pending') throw new ApiError(409, 'STATE_CONFLICT', 'Trận Tournament chưa sẵn sàng.');
  const participantByUser = new Map(match.participants.map((person) => [person.userId, person.participantId]));
  const normalized = placements.map((row) => ({
    participantId: String(row.participantId || participantByUser.get(String(row.userId)) || ''),
    placement: Number(row.placement),
    forfeit: Boolean(row.forfeit),
  }));
  const ids = normalized.map((row) => row.participantId);
  const expected = [...match.participantIds].sort();
  if (normalized.length !== expected.length || new Set(ids).size !== ids.length || ids.slice().sort().some((id, index) => id !== expected[index])) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Kết quả không khớp người chơi của trận Tournament.');
  }
  const placementValues = normalized.map((row) => row.placement).sort((a, b) => a - b);
  if (placementValues.some((value, index) => value !== index + 1)) throw new ApiError(422, 'VALIDATION_ERROR', 'Thứ hạng Tournament phải liên tục từ 1.');
  match.result = normalized.map((row) => ({ ...row, points: PLACEMENT_POINTS[row.placement] ?? 0, forfeit: Boolean(row.forfeit) }));
  match.resultSource = normalized.some((row) => row.forfeit) ? 'forfeit' : 'game_server';
  match.status = 'completed';
  match.completedAt = new Date().toISOString();
  unlockNextMatch(round, match);

  const groupRounds = bracket.rounds.slice(0, 2);
  if (groupRounds.every((item) => item.matches.every((candidate) => candidate.status === 'completed'))) {
    const qualifiers = groupQualifiers(bracket);
    const identities = new Map(bracket.participants.map((person) => [person.participantId, person]));
    const finalPlayers = qualifiers.map((row) => identities.get(row.participantId));
    const finalRound = bracket.rounds[2];
    for (const finalMatch of finalRound.matches) {
      finalMatch.participants = finalPlayers;
      finalMatch.participantIds = finalPlayers.map((person) => person.participantId);
    }
    if (finalRound.matches[0].status === 'blocked') markPending(finalRound.matches[0]);
  }
  return {
    bracket,
    replayed: false,
    scoreDeltas: match.result.map(({ participantId, points, forfeit }) => ({ participantId, points, forfeit })),
  };
}

function buildForfeitPlacements(matchInput, connectedParticipantIds = []) {
  const match = matchInput || {};
  if (match.status !== 'pending') {
    if (match.status === 'completed') return [];
    throw new ApiError(409, 'STATE_CONFLICT', 'Trận Tournament chưa sẵn sàng để xử thua.');
  }
  const connected = new Set(connectedParticipantIds.map(String));
  const participants = [...(match.participants || [])].sort((left, right) => (
    (left.seed ?? Number.MAX_SAFE_INTEGER) - (right.seed ?? Number.MAX_SAFE_INTEGER)
    || String(left.participantId).localeCompare(String(right.participantId))
  ));
  const joined = participants.filter((person) => connected.has(String(person.participantId)));
  const absent = participants.filter((person) => !connected.has(String(person.participantId)));
  return [...joined, ...absent].map((person, index) => ({
    participantId: String(person.participantId),
    placement: index + 1,
    forfeit: absent.includes(person),
  }));
}

function tournamentStandings(bracket) {
  const groupRounds = bracket.rounds.slice(0, 2);
  const finalRound = bracket.rounds[2];
  const allCompleted = finalRound?.matches?.length === 5 && finalRound.matches.every((match) => match.status === 'completed');
  const totals = scoreTable(allMatches(bracket), bracket.participants.map((person) => person.participantId));
  if (!allCompleted) return totals.map((row) => ({ ...row, finalRank: undefined }));
  const qualifierIds = new Set(finalRound.matches[0].participantIds);
  const finalists = scoreTable(finalRound.matches, [...qualifierIds]);
  const seedById = new Map(bracket.participants.map((person) => [person.participantId, person.seed]));
  const eliminated = groupRounds
    .flatMap((round) => scoreTable(round.matches, round.matches[0].participantIds).filter((row) => !qualifierIds.has(row.participantId)))
    .sort((left, right) => right.points - left.points || right.wins - left.wins || left.placementSum - right.placementSum || (seedById.get(left.participantId) ?? Number.MAX_SAFE_INTEGER) - (seedById.get(right.participantId) ?? Number.MAX_SAFE_INTEGER) || left.participantId.localeCompare(right.participantId));
  const rankedIds = [...finalists, ...eliminated].map((row) => row.participantId);
  const totalById = new Map(totals.map((row) => [row.participantId, row]));
  return rankedIds.map((participantId, index) => ({ ...totalById.get(participantId), finalRank: index + 1 }));
}

async function ensureTournamentMatchRoom({
  tournamentId,
  matchReference,
  userId,
  TournamentModel = Tournament,
  UserModel = User,
  rooms = roomManager,
}) {
  const tournament = await TournamentModel.findById(tournamentId);
  if (!tournament || tournament.status !== 'active') throw new ApiError(409, 'STATE_CONFLICT', 'Tournament chưa active.');
  const bracket = structuredClone(tournament.bracket);
  const located = findMatch(bracket, matchReference);
  if (!located || located.match.status !== 'pending') throw new ApiError(409, 'STATE_CONFLICT', 'Trận Tournament chưa sẵn sàng.');
  if (!located.match.participants.some((person) => person.userId === String(userId))) throw new ApiError(403, 'FORBIDDEN', 'Bạn không thuộc trận Tournament này.');
  const existing = rooms.getOperationalRoomStates().find((room) => room.tournamentMatchReference === matchReference);
  if (existing) return { roomCode: existing.code, matchReference };
  const [host, ...others] = located.match.participants;
  const users = await UserModel.find({
    _id: { $in: located.match.participants.map((person) => person.userId) },
  }).populate('equippedCosmetics.avatarFrame equippedCosmetics.protector');
  const usersById = new Map(users.map((user) => [String(user._id), user]));
  const profileFor = (person) => toPlayerPresentation(usersById.get(String(person.userId)), person.username);
  const password = crypto.randomUUID();
  const room = rooms.createRoom(
    host.userId,
    { edition: 'original', maxPlayers: 4, betAmount: 0, gameMode: 'tournament', password, reconnectGraceMs: TOURNAMENT_MATCH_GRACE_MS },
    profileFor(host),
  );
  room.tournamentId = String(tournamentId);
  room.tournamentMatchReference = matchReference;
  for (const player of others) rooms.joinRoom(room.code, player.userId, profileFor(player), password);
  located.match.roomCode = room.code;
  const updated = await TournamentModel.findOneAndUpdate(
    { _id: tournamentId, status: 'active', stateVersion: tournament.stateVersion },
    { $set: { bracket }, $inc: { stateVersion: 1 } },
    { new: true },
  );
  if (!updated) {
    rooms.forceCloseRoom(room.code);
    throw new ApiError(409, 'STATE_CONFLICT', 'Tournament vừa thay đổi. Hãy thử lại.');
  }
  return { roomCode: room.code, matchReference };
}

async function ensureAutomaticPayout(tournament) {
  if (tournament.payoutState === 'completed') return;
  const actor = { id: tournament.createdBy, username: 'tournament-system', role: 'super_admin' };
  const mutation = { requestId: `auto-payout:${tournament._id}`, reason: 'Automatic Tournament completion payout' };
  const preview = await createTournamentPayoutPreview({
    actor, tournamentId: tournament._id, expectedVersion: tournament.stateVersion, mutation,
  });
  await executeTournamentPayout({
    actor,
    tournamentId: tournament._id,
    expectedVersion: preview.stateVersion,
    previewToken: preview.previewToken,
    mutation,
  });
}

async function recordTournamentMatchResult({
  matchReference,
  placements,
  TournamentModel = Tournament,
  ParticipantModel = TournamentParticipant,
  autoPayout = ensureAutomaticPayout,
}) {
  let tournament = await TournamentModel.findOne({ 'bracket.rounds.matches.matchReference': matchReference });
  if (!tournament) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy Tournament của trận.');
  const applied = applyTournamentMatchResult(tournament.bracket, matchReference, placements);
  if (!applied.replayed) {
    const standings = tournamentStandings(applied.bracket);
    const completed = standings.length === 8 && standings.every((row) => row.finalRank);
    tournament = await TournamentModel.findOneAndUpdate(
      { _id: tournament._id, stateVersion: tournament.stateVersion, status: 'active' },
      { $set: { bracket: applied.bracket, ...(completed && { status: 'completed', completedAt: new Date() }) }, $inc: { stateVersion: 1 } },
      { new: true },
    );
    if (!tournament) return recordTournamentMatchResult({ matchReference, placements, TournamentModel, ParticipantModel, autoPayout });
  }
  const standings = tournamentStandings(tournament.bracket);
  if (!applied.replayed) {
    const completedMatch = findMatch(tournament.bracket, matchReference)?.match;
    const resultById = new Map((completedMatch?.result || []).map((row) => [String(row.participantId), row]));
    await ParticipantModel.bulkWrite(standings.map((row) => {
      const matchResult = resultById.get(String(row.participantId));
      return {
        updateOne: {
          filter: { _id: row.participantId, tournamentId: tournament._id },
          update: {
            $set: {
              score: row.points,
              ...(matchResult && { lastMatchStatus: matchResult.forfeit ? 'forfeit' : 'completed' }),
              ...(row.finalRank && { finalRank: row.finalRank, status: row.finalRank === 1 ? 'winner' : 'eliminated' }),
            },
            ...(matchResult?.forfeit && { $inc: { forfeitCount: 1 } }),
          },
        },
      };
    }));
  }
  if (tournament.status === 'completed' && tournament.payoutState !== 'completed') {
    try {
      await autoPayout(tournament);
    } catch (error) {
      await TournamentModel.findByIdAndUpdate(tournament._id, { $set: { payoutState: 'failed' } });
    }
  }
  return { tournament, standings, replayed: applied.replayed };
}

// Claims one tournament whose startTime passed: status flips before any work so a second
// instance (or a second tick) can never process the same row.
async function claimDueStart({
  TournamentModel = Tournament,
  ParticipantModel = TournamentParticipant,
  refund = refundCancelledTournamentEntries,
  now = new Date(),
} = {}) {
  const claimed = await TournamentModel.findOneAndUpdate(
    { status: 'registration', startTime: { $lte: now } },
    { $set: { status: 'active', startedAt: now }, $inc: { stateVersion: 1 } },
    { new: true, sort: { startTime: 1, _id: 1 } },
  );
  if (!claimed) return null;
  const participants = await ParticipantModel.find({ tournamentId: claimed._id, paymentStatus: 'paid' }).populate('userId', 'username').lean();
  if (participants.length === TOURNAMENT_MAX_PARTICIPANTS) {
    await TournamentModel.findByIdAndUpdate(claimed._id, {
      $set: { bracket: buildEightPlayerTournament(String(claimed._id), participants, now) },
      $inc: { stateVersion: 1 },
    });
    return { tournamentId: String(claimed._id), status: 'active' };
  }
  await TournamentModel.findByIdAndUpdate(claimed._id, {
    $set: {
      status: 'cancelled',
      cancelledAt: now,
      cancelReason: `Tới giờ bắt đầu nhưng chỉ có ${participants.length}/${TOURNAMENT_MAX_PARTICIPANTS} người đã thanh toán.`,
      refundState: 'pending',
    },
    $inc: { stateVersion: 1 },
  });
  await refund({ tournamentId: claimed._id, requestId: `auto-cancel:${claimed._id}`, TournamentModel, ParticipantModel });
  return { tournamentId: String(claimed._id), status: 'cancelled' };
}

function connectedParticipantIds(match, rooms) {
  const room = rooms.getOperationalRoomStates().find((item) => item.tournamentMatchReference === match.matchReference);
  const online = new Set((room?.players || []).filter((player) => player.connectionStatus !== 'disconnected').map((player) => String(player.userId)));
  return (match.participants || []).filter((person) => online.has(String(person.userId))).map((person) => person.participantId);
}

// Claims expired pending matches by clearing their deadline first, then forfeits them.
// ponytail: a crash between claim and record leaves the match without a deadline (manual admin
// result needed). Add a claim timestamp sweep when tournaments run unattended for days.
async function claimExpiredMatch({
  TournamentModel = Tournament,
  rooms = roomManager,
  record = recordTournamentMatchResult,
  now = new Date(),
} = {}) {
  const nowIso = new Date(now).toISOString();
  const claimed = await TournamentModel.findOneAndUpdate(
    { status: 'active', 'bracket.rounds.matches.status': 'pending', 'bracket.rounds.matches.deadlineAt': { $lte: nowIso } },
    { $set: { 'bracket.rounds.$[r].matches.$[m].deadlineAt': null, 'bracket.rounds.$[r].matches.$[m].forfeitClaimedAt': nowIso }, $inc: { stateVersion: 1 } },
    {
      new: true,
      arrayFilters: [
        { 'r.matches': { $elemMatch: { status: 'pending', deadlineAt: { $lte: nowIso } } } },
        { 'm.status': 'pending', 'm.deadlineAt': { $lte: nowIso } },
      ],
    },
  );
  if (!claimed) return null;
  const matches = allMatches(claimed.bracket || {}).filter((match) => match.status === 'pending' && match.forfeitClaimedAt === nowIso);
  if (!matches.length) return null;
  for (const match of matches) {
    await record({ matchReference: match.matchReference, placements: buildForfeitPlacements(match, connectedParticipantIds(match, rooms)) });
  }
  return { tournamentId: String(claimed._id), forfeited: matches.map((match) => match.matchReference) };
}

function startTournamentScheduler({ intervalMs = 15000 } = {}) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      while (await claimDueStart()) { /* Drain: each claim flips status before work. */ }
      while (await claimExpiredMatch()) { /* Drain: each claim clears the deadline before work. */ }
    } catch (error) {
      process.stderr.write(`Tournament scheduler error: ${error.message}\n`);
    } finally {
      running = false;
    }
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

module.exports = {
  PLACEMENT_POINTS,
  applyTournamentMatchResult,
  buildEightPlayerTournament,
  claimDueStart,
  claimExpiredMatch,
  ensureTournamentMatchRoom,
  recordTournamentMatchResult,
  startTournamentScheduler,
  tournamentStandings,
  buildForfeitPlacements,
};
