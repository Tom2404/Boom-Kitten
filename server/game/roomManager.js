// In-memory room manager for creating, joining, and running game sessions.
const { createDeck, dealCards } = require('./deck');

const rooms = new Map();
const RECONNECT_GRACE_MS = 60_000;
const MAX_RECONNECT_GRACE_MS = 15 * 60 * 1000;
const VALID_EDITIONS = new Set(['original', '2_player', 'zombie', 'barking', 'good_vs_evil', 'imploding', 'streaking']);
const { validateStake } = require('../services/wagerService');

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function normalizePlayerProfile(profile = 'Guest') {
  const value = typeof profile === 'string' ? { username: profile } : (profile || {});
  return {
    username: value.username || 'Guest',
    avatar: value.avatar || '',
    avatarFrame: value.avatarFrame || null,
    protector: value.protector || null,
  };
}

function normalizeCustomRoomKittens(maxP, reqExploding, reqDefuses) {
  let cek = parseInt(reqExploding, 10);
  let cd = parseInt(reqDefuses, 10);

  if (isNaN(cek) || isNaN(cd)) {
    return { customExplodingKittens: undefined, customDefuses: undefined };
  }

  // Rule 1: Boom count MUST be >= maxPlayers - 1 (Game Invariant)
  const minExploding = Math.max(1, maxP - 1);
  cek = Math.min(Math.max(minExploding, cek), 8);

  // Rule 2: Defuses in Drawpile MUST be strictly less than Boom count (cd < cek)
  const maxDefuses = Math.max(0, cek - 1);
  cd = Math.min(Math.max(0, cd), maxDefuses);

  return { customExplodingKittens: cek, customDefuses: cd };
}

function createRoom(hostId, options = {}, profile = 'Guest') {
  let code;
  do {
    code = makeCode();
  } while (rooms.has(code));

  const edition = VALID_EDITIONS.has(options.edition) ? options.edition : 'original';
  const maxLimit = edition === '2_player' ? 2 : (edition === 'imploding' ? 6 : 5);
  const requestedMax = parseInt(options.maxPlayers, 10);
  const maxPlayers = (!isNaN(requestedMax) && requestedMax >= 2 && requestedMax <= maxLimit) ? requestedMax : maxLimit;

  const requestedStake = Number(options.betAmount ?? 0);
  const betAmount = validateStake(requestedStake);

  const { customDefuses, customExplodingKittens } = normalizeCustomRoomKittens(
    maxPlayers,
    options.customExplodingKittens,
    options.customDefuses
  );

  const hostProfile = normalizePlayerProfile(profile);
  const room = {
    code,
    host: hostId,
    players: [{
      userId: hostId,
      ...hostProfile,
      hand: [],
      alive: true,
      isReady: true,
      connectionStatus: 'connected',
      reconnectDeadline: null,
      forfeited: false,
    }],
    maxPlayers,
    maxHandSize: 10,
    status: 'waiting',
    password: options.password || '',
    betAmount,
    edition,
    gameMode: ['matchmaking', 'tournament'].includes(options.gameMode) ? options.gameMode : 'custom',
    reconnectGraceMs: Number.isSafeInteger(Number(options.reconnectGraceMs))
      ? Math.min(Math.max(Number(options.reconnectGraceMs), RECONNECT_GRACE_MS), MAX_RECONNECT_GRACE_MS)
      : RECONNECT_GRACE_MS,
    createdAt: new Date(),
    updatedAt: new Date(),
    gameState: null,
    customDefuses,
    customExplodingKittens,
  };
  rooms.set(code, room);
  return room;
}

function joinRoom(roomCode, userId, profile = 'Guest', password = '') {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Không tìm thấy phòng chơi');
  if (room.players.find((p) => p.userId === userId)) return room;
  if (room.players.length >= room.maxPlayers) throw new Error('Phòng chơi đã đầy');
  if (room.status !== 'waiting') throw new Error('Trận đấu đã bắt đầu');
  if (room.password && room.password !== password) throw new Error('Mật khẩu phòng chơi không chính xác');
  room.players.push({
    userId,
    ...normalizePlayerProfile(profile),
    hand: [],
    alive: true,
    isReady: false,
    connectionStatus: 'connected',
    reconnectDeadline: null,
    forfeited: false,
  });
  touchRoom(room);
  return room;
}

function leaveRoom(roomCode, userId) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  room.players = room.players.filter((p) => p.userId !== userId);
  if (room.host === userId && room.players[0]) room.host = room.players[0].userId;
  if (room.status === 'playing') {
    if (room.players.length < 2) {
      room.status = 'waiting';
      room.gameState = null;
    }
  }
  if (room.players.length === 0) rooms.delete(roomCode);
  else touchRoom(room);
  return rooms.get(roomCode) ?? null;
}

function kickPlayer(roomCode, hostId, targetUserId) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Không tìm thấy phòng chơi');
  if (room.host !== hostId) throw new Error('Chỉ chủ phòng mới có thể kick người chơi');
  if (room.host === targetUserId) throw new Error('Không thể kick chủ phòng');
  if (room.status !== 'waiting') throw new Error('Không thể kick người chơi sau khi trận đấu đã bắt đầu');
  room.players = room.players.filter((p) => p.userId !== targetUserId);
  touchRoom(room);
  return room;
}

function toggleReady(roomCode, userId, isReady) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Không tìm thấy phòng chơi');
  const player = room.players.find((p) => p.userId === userId);
  if (!player) throw new Error('Không tìm thấy người chơi trong phòng');
  if (room.host === userId) throw new Error('Chủ phòng luôn ở trạng thái sẵn sàng');
  player.isReady = !!isReady;
  touchRoom(room);
  return room;
}

function updateRoomSettings(roomCode, hostId, newSettings) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Không tìm thấy phòng chơi');
  if (room.host !== hostId) throw new Error('Chỉ chủ phòng mới có quyền đổi cài đặt');
  
  if (newSettings.edition && VALID_EDITIONS.has(newSettings.edition)) {
    room.edition = newSettings.edition;
  }
  const maxLimit = room.edition === '2_player' ? 2 : (room.edition === 'imploding' ? 6 : 5);
  const requestedMax = parseInt(newSettings.maxPlayers, 10);
  if (!isNaN(requestedMax) && requestedMax >= 2 && requestedMax <= maxLimit) {
    room.maxPlayers = requestedMax;
  } else {
    room.maxPlayers = Math.min(room.maxPlayers, maxLimit);
  }

  if (newSettings.betAmount !== undefined) {
    room.betAmount = validateStake(Number(newSettings.betAmount));
  }

  if (newSettings.customDefuses !== undefined || newSettings.customExplodingKittens !== undefined) {
    const { customDefuses, customExplodingKittens } = normalizeCustomRoomKittens(
      room.maxPlayers,
      newSettings.customExplodingKittens ?? room.customExplodingKittens,
      newSettings.customDefuses ?? room.customDefuses
    );
    room.customDefuses = customDefuses;
    room.customExplodingKittens = customExplodingKittens;
  }

  // Khi chủ phòng đổi cài đặt, tất cả người chơi khác tự động bị Huỷ sẵn sàng
  room.players.forEach((p) => {
    if (p.userId !== room.host) {
      p.isReady = false;
    }
  });
  touchRoom(room);

  return room;
}

function startGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Room not found');
  if (room.players.length < 2) throw new Error('Need at least 2 players');
  if (room.players.some((p) => p.userId !== room.host && !p.isReady)) {
    throw new Error('Chưa phải tất cả mọi người đều đã sẵn sàng');
  }

  const deck = createDeck(room.players.length, room.edition);
  const handSize = room.edition === 'original' ? 4 : 7;
  const customOptions = {
    customDefuses: room.customDefuses,
    customExplodingKittens: room.customExplodingKittens,
  };
  const dealt = dealCards(deck, room.players, handSize, room.edition, customOptions);

  room.status = 'playing';
  room.startedAt = new Date();
  room.updatedAt = room.startedAt;
  room.gameState = {
    roomCode,
    players: dealt.players,
    activePlayerIds: dealt.players.map((p) => p.userId),
    eliminatedPlayers: [],
    deck: dealt.deck,
    discardPile: [],
    currentPlayerIndex: 0,
    drawsRequired: 1,
    pendingFavor: null,
    lastAction: null,
    maxHandSize: room.maxHandSize ?? 10,
    edition: room.edition,
    barkingKittenState: {
      waitingHolder: null,
    },
  };

  return room;
}

function resetRoomForRematch(room) {
  if (!room || room.status !== 'finished') return null;

  clearTimers(room.gameState);
  room.status = 'waiting';
  room.gameState = null;
  room.players.forEach((player) => {
    player.hand = [];
    player.alive = true;
    player.isReady = player.userId === room.host;
    player.forfeited = false;
    player.connectionStatus = 'connected';
    player.reconnectDeadline = null;
  });
  return touchRoom(room);
}

function getPublicRooms() {
  return [...rooms.values()]
    .filter((room) => room.status === 'waiting')
    .map(room => ({
      ...room,
      hasPassword: !!room.password,
      password: undefined // do not leak password to client
    }));
}
function getRoomState(roomCode) {
  return rooms.get(roomCode) ?? null;
}
function getOperationalRooms() {
  return [...rooms.values()].map((room) => ({ code: room.code, status: room.status }));
}

function getOperationalRoomStates() {
  return [...rooms.values()];
}

function touchRoom(roomOrCode) {
  const room = typeof roomOrCode === 'string' ? rooms.get(roomOrCode) : roomOrCode;
  if (room) room.updatedAt = new Date();
  return room ?? null;
}

function clearTimers(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const [key, item] of Object.entries(value)) {
    if (key === 'timerId' && item) clearTimeout(item);
    else clearTimers(item, seen);
  }
}

function forceCloseRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  clearTimers(room.gameState);
  rooms.delete(roomCode);
  return room;
}

function disconnectPlayer(roomCode, userId) {
  return leaveRoom(roomCode, userId);
}

function markPlayerDisconnected(roomCode, userId, reconnectDeadline) {
  const room = rooms.get(roomCode);
  const player = room?.players.find((candidate) => candidate.userId === userId);
  if (!player || player.forfeited) return null;
  const deadline = reconnectDeadline ?? Date.now() + (room.reconnectGraceMs || RECONNECT_GRACE_MS);
  player.connectionStatus = 'reconnecting';
  player.reconnectDeadline = deadline;
  touchRoom(room);
  return player;
}

function markPlayerConnected(roomCode, userId, now = Date.now()) {
  const room = rooms.get(roomCode);
  const player = room?.players.find((candidate) => candidate.userId === userId);
  if (!player || player.forfeited) return null;
  if (
    player.connectionStatus === 'reconnecting'
    && Number.isFinite(player.reconnectDeadline)
    && now > player.reconnectDeadline
  ) {
    return null;
  }
  player.connectionStatus = 'connected';
  player.reconnectDeadline = null;
  touchRoom(room);
  return player;
}

function findRoomByUser(userId) {
  return [...rooms.values()].find((room) => room.players.some((p) => p.userId === userId));
}

module.exports = {
  RECONNECT_GRACE_MS,
  MAX_RECONNECT_GRACE_MS,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  resetRoomForRematch,
  getPublicRooms,
  getRoomState,
  getOperationalRooms,
  getOperationalRoomStates,
  touchRoom,
  forceCloseRoom,
  disconnectPlayer,
  markPlayerConnected,
  markPlayerDisconnected,
  findRoomByUser,
  kickPlayer,
  toggleReady,
  updateRoomSettings,
};
