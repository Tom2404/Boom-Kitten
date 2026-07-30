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

const PLACEMENT_POINTS = Object.freeze({ 1: 5, 2: 3, 3: 1, 4: 0 });

function identity(participant, seed) {
  const user = participant.userId || {};
  return {
    participantId: String(participant._id),
    userId: String(user._id || user),
    username: user.username || 'Unknown',
    seed,
  };
}

function scheduledMatch(tournamentId, stage, number, participants, status = 'blocked') {
  const id = `${stage}-m${number}`;
  return {
    id,
    matchReference: `${tournamentId}:${id}`,
    participantIds: participants.map((row) => row.participantId),
    participants,
    status,
    roomCode: null,
    result: [],
  };
}

function buildEightPlayerTournament(tournamentId, participants) {
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
    matches: Array.from({ length: 3 }, (_, index) => scheduledMatch(tournamentId, group.id, index + 1, group.participants, index === 0 ? 'pending' : 'blocked')),
  }));
  rounds.push({
    round: 'final',
    name: 'Chung kết',
    matches: Array.from({ length: 5 }, (_, index) => scheduledMatch(tournamentId, 'final', index + 1, [], 'blocked')),
  });
  return {
    format: 'groups_then_final_v1',
    scoring: { placementPoints: PLACEMENT_POINTS, tieBreak: ['points', 'wins', 'placementSum', 'seed'] },
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
  if (next?.status === 'blocked') next.status = 'pending';
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
  }));
  const ids = normalized.map((row) => row.participantId);
  const expected = [...match.participantIds].sort();
  if (normalized.length !== expected.length || new Set(ids).size !== ids.length || ids.slice().sort().some((id, index) => id !== expected[index])) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Kết quả không khớp người chơi của trận Tournament.');
  }
  const placementValues = normalized.map((row) => row.placement).sort((a, b) => a - b);
  if (placementValues.some((value, index) => value !== index + 1)) throw new ApiError(422, 'VALIDATION_ERROR', 'Thứ hạng Tournament phải liên tục từ 1.');
  match.result = normalized.map((row) => ({ ...row, points: PLACEMENT_POINTS[row.placement] ?? 0 }));
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
    if (finalRound.matches[0].status === 'blocked') finalRound.matches[0].status = 'pending';
  }
  return {
    bracket,
    replayed: false,
    scoreDeltas: match.result.map(({ participantId, points }) => ({ participantId, points })),
  };
}

function tournamentStandings(bracket) {
  const groupRounds = bracket.rounds.slice(0, 2);
  const finalRound = bracket.rounds[2];
  const allCompleted = finalRound?.matches?.length === 5 && finalRound.matches.every((match) => match.status === 'completed');
  const totals = scoreTable(allMatches(bracket), bracket.participants.map((person) => person.participantId));
  if (!allCompleted) return totals.map((row) => ({ ...row, finalRank: undefined }));
  const qualifierIds = new Set(finalRound.matches[0].participantIds);
  const finalists = scoreTable(finalRound.matches, [...qualifierIds]);
  const eliminated = groupRounds
    .flatMap((round) => scoreTable(round.matches, round.matches[0].participantIds).filter((row) => !qualifierIds.has(row.participantId)))
    .sort((left, right) => right.points - left.points || right.wins - left.wins || left.placementSum - right.placementSum || left.participantId.localeCompare(right.participantId));
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
    { edition: 'original', maxPlayers: 4, betAmount: 0, gameMode: 'tournament', password },
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
  await ParticipantModel.bulkWrite(standings.map((row) => ({
    updateOne: {
      filter: { _id: row.participantId, tournamentId: tournament._id },
      update: { $set: { score: row.points, ...(row.finalRank && { finalRank: row.finalRank, status: row.finalRank === 1 ? 'winner' : 'eliminated' }) } },
    },
  })));
  if (tournament.status === 'completed' && tournament.payoutState !== 'completed') {
    try {
      await autoPayout(tournament);
    } catch (error) {
      await TournamentModel.findByIdAndUpdate(tournament._id, { $set: { payoutState: 'failed' } });
    }
  }
  return { tournament, standings, replayed: applied.replayed };
}

module.exports = {
  PLACEMENT_POINTS,
  applyTournamentMatchResult,
  buildEightPlayerTournament,
  ensureTournamentMatchRoom,
  recordTournamentMatchResult,
  tournamentStandings,
};
