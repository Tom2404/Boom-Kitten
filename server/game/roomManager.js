// In-memory room manager for creating, joining, and running game sessions.
const { createDeck, dealCards } = require('./deck');

const rooms = new Map();

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function createRoom(hostId, options = {}, username = 'Guest') {
  const code = makeCode();
  const room = {
    code,
    host: hostId,
    players: [{ userId: hostId, username, hand: [], alive: true }],
    maxPlayers: Math.min(Math.max(options.maxPlayers ?? 5, 2), 5),
    maxHandSize: Math.min(Math.max(options.maxHandSize ?? 10, 5), 15),
    status: 'waiting',
    isPublic: Boolean(options.isPublic),
    gameState: null,
  };
  rooms.set(code, room);
  return room;
}

function joinRoom(roomCode, userId, username = 'Guest') {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Room not found');
  if (room.players.find((p) => p.userId === userId)) return room;
  if (room.players.length >= room.maxPlayers) throw new Error('Room is full');
  if (room.status !== 'waiting') throw new Error('Game already started');
  room.players.push({ userId, username, hand: [], alive: true });
  return room;
}

function leaveRoom(roomCode, userId) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  room.players = room.players.filter((p) => p.userId !== userId);
  if (room.host === userId && room.players[0]) room.host = room.players[0].userId;
  if (room.status === 'playing') {
    room.status = 'waiting';
    room.gameState = null;
  }
  if (room.players.length === 0) rooms.delete(roomCode);
  return rooms.get(roomCode) ?? null;
}

function startGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Room not found');
  if (room.players.length < 2) throw new Error('Need at least 2 players');

  const deck = createDeck(room.players.length);
  const dealt = dealCards(deck, room.players, 6);

  room.status = 'playing';
  room.gameState = {
    roomCode,
    players: dealt.players,
    activePlayerIds: dealt.players.map((p) => p.userId),
    deck: dealt.deck,
    discardPile: [],
    currentPlayerIndex: 0,
    drawsRequired: 1,
    pendingFavor: null,
    lastAction: null,
    maxHandSize: room.maxHandSize ?? 10,
  };

  return room;
}

function getPublicRooms() {
  return [...rooms.values()].filter((room) => room.isPublic && room.status === 'waiting');
}
function getRoomState(roomCode) {
  return rooms.get(roomCode) ?? null;
}

function findRoomByUser(userId) {
  return [...rooms.values()].find((room) => room.players.some((p) => p.userId === userId));
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  getPublicRooms,
  getRoomState,
  findRoomByUser,
};
