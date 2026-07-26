const roomManagerDefault = require('../../game/roomManager');
const { createAdminAudit } = require('./auditService');
const { ApiError } = require('../../utils/apiResponse');
const { refundWager } = require('../wagerLedgerService');

const PLAYING_STALE_MS = 5 * 60 * 1000;
const WAITING_STALE_MS = 15 * 60 * 1000;

function asDate(value, fallback) {
  const parsed = value instanceof Date ? value : new Date(value || fallback);
  return Number.isNaN(parsed.getTime()) ? new Date(fallback) : parsed;
}

function getPhase(room) {
  if (room.status === 'waiting') return 'lobby';
  if (room.status === 'finished') return 'finished';
  const state = room.gameState;
  if (!state) return 'initializing';
  if (state.pendingAction) return 'response_window';
  if (state.pendingNowOnlyWindow) return 'now_window';
  if (state.pendingTargetSelect) return 'target_selection';
  if (state.activeInteraction) return 'interaction';
  return 'turn';
}

function sanitizeRoomForAdmin(room, { now = new Date() } = {}) {
  if (!room) return null;
  const createdAt = asDate(room.createdAt, now);
  const updatedAt = asDate(room.updatedAt, createdAt);
  const statePlayers = new Map((room.gameState?.players || []).map((player) => [String(player.userId), player]));
  const players = (room.players || []).map((player) => {
    const gamePlayer = statePlayers.get(String(player.userId));
    return {
      userId: String(player.userId),
      username: player.username || gamePlayer?.username || 'Unknown',
      isHost: String(room.host) === String(player.userId),
      isReady: Boolean(player.isReady),
      alive: gamePlayer ? gamePlayer.alive !== false : player.alive !== false,
      handCount: Array.isArray(gamePlayer?.hand) ? gamePlayer.hand.length : (Array.isArray(player.hand) ? player.hand.length : 0),
    };
  });
  const currentPlayer = room.gameState?.players?.[room.gameState.currentPlayerIndex];
  const idleMs = Math.max(0, now.getTime() - updatedAt.getTime());
  const staleAfterMs = room.status === 'playing' ? PLAYING_STALE_MS : WAITING_STALE_MS;

  return {
    code: room.code,
    status: room.status,
    edition: room.edition,
    gameMode: room.gameMode || 'custom',
    playerCount: players.length,
    maxPlayers: room.maxPlayers,
    host: players.find((player) => player.isHost) || null,
    players,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    ageMs: Math.max(0, now.getTime() - createdAt.getTime()),
    idleMs,
    stale: idleMs > staleAfterMs,
    staleAfterMs,
    phase: getPhase(room),
    pendingInteraction: Boolean(
      room.gameState?.pendingAction
      || room.gameState?.pendingNowOnlyWindow
      || room.gameState?.pendingTargetSelect
      || room.gameState?.activeInteraction
    ),
    currentTurn: currentPlayer ? {
      userId: String(currentPlayer.userId),
      username: currentPlayer.username || players.find((player) => player.userId === String(currentPlayer.userId))?.username || 'Unknown',
    } : null,
  };
}

function listRoomsForAdmin({ roomManager = roomManagerDefault, now = new Date() } = {}) {
  return roomManager.getOperationalRoomStates()
    .map((room) => sanitizeRoomForAdmin(room, { now }))
    .sort((left, right) => Number(right.stale) - Number(left.stale) || right.idleMs - left.idleMs);
}

function getRoomForAdmin(roomCode, { roomManager = roomManagerDefault, now = new Date() } = {}) {
  const room = roomManager.getRoomState(roomCode);
  if (!room) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phòng chơi đang hoạt động.');
  return sanitizeRoomForAdmin(room, { now });
}

async function forceCloseRoomForAdmin({
  roomCode,
  actor,
  mutation,
  request = {},
  roomManager = roomManagerDefault,
  io,
  audit = createAdminAudit,
  refund = refundWager,
}) {
  const room = roomManager.getRoomState(roomCode);
  if (!room) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phòng chơi đang hoạt động.');
  const before = sanitizeRoomForAdmin(room);
  if (room.status === 'playing' && room.betAmount > 0 && room.wagerReference) {
    await refund({
      roomCode,
      reference: room.wagerReference,
      requestId: `admin-refund:${mutation.requestId}`,
      reason: mutation.reason,
    });
  }
  roomManager.forceCloseRoom(roomCode);
  io?.to(roomCode).emit('admin:roomClosed', { roomCode, reason: mutation.reason });
  await audit({
    actor,
    action: 'ROOM_FORCE_CLOSED',
    target: { type: 'room', id: roomCode },
    before,
    after: { status: 'closed_by_admin' },
    reason: mutation.reason,
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return { ...before, status: 'closed_by_admin' };
}

async function disconnectRoomPlayerForAdmin({
  roomCode,
  userId,
  actor,
  mutation,
  request = {},
  roomManager = roomManagerDefault,
  io,
  audit = createAdminAudit,
  refund = refundWager,
}) {
  const room = roomManager.getRoomState(roomCode);
  if (!room) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phòng chơi đang hoạt động.');
  const player = room.players.find((item) => String(item.userId) === String(userId));
  if (!player) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Người chơi không còn ở trong phòng này.');
  const before = sanitizeRoomForAdmin(room);
  let remainingRoom;
  if (room.status === 'playing' && room.betAmount > 0 && room.wagerReference) {
    await refund({
      roomCode,
      reference: room.wagerReference,
      requestId: `admin-refund:${mutation.requestId}`,
      reason: mutation.reason,
    });
    roomManager.forceCloseRoom(roomCode);
    remainingRoom = null;
    io?.to(roomCode).emit('admin:roomClosed', { roomCode, reason: mutation.reason });
  } else {
    remainingRoom = roomManager.disconnectPlayer(roomCode, userId);
  }
  io?.to(roomCode).emit('admin:playerDisconnected', { roomCode, userId: String(userId), reason: mutation.reason });
  io?.in(`user:${userId}`).disconnectSockets(true);
  const after = remainingRoom ? sanitizeRoomForAdmin(remainingRoom) : { code: roomCode, status: 'closed_empty' };
  await audit({
    actor,
    action: 'ROOM_PLAYER_DISCONNECTED',
    target: { type: 'room_player', id: `${roomCode}:${userId}` },
    before: { room: before, player: { userId: String(player.userId), username: player.username } },
    after,
    reason: mutation.reason,
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return { room: after, disconnectedUserId: String(userId) };
}

module.exports = {
  PLAYING_STALE_MS,
  WAITING_STALE_MS,
  sanitizeRoomForAdmin,
  listRoomsForAdmin,
  getRoomForAdmin,
  forceCloseRoomForAdmin,
  disconnectRoomPlayerForAdmin,
};
