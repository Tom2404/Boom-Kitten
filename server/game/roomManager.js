// In-memory room manager for creating, joining, and running game sessions.
const { createDeck, dealCards } = require('./deck');

const rooms = new Map();
const VALID_EDITIONS = new Set(['original', '2_player', 'zombie', 'barking', 'good_vs_evil', 'imploding', 'streaking']);

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function createRoom(hostId, options = {}, username = 'Guest') {
  let code;
  do {
    code = makeCode();
  } while (rooms.has(code));

  const edition = VALID_EDITIONS.has(options.edition) ? options.edition : 'original';
  const maxLimit = edition === '2_player' ? 2 : (edition === 'imploding' ? 6 : 5);
  const requestedMax = parseInt(options.maxPlayers, 10);
  const maxPlayers = (!isNaN(requestedMax) && requestedMax >= 2 && requestedMax <= maxLimit) ? requestedMax : maxLimit;

  let betAmount = parseInt(options.betAmount, 10);
  betAmount = !isNaN(betAmount) && betAmount >= 0 ? betAmount : 50;
  betAmount = Math.min(betAmount, 10000000); // 10 million limit

  let customDefuses = parseInt(options.customDefuses, 10);
  let customExplodingKittens = parseInt(options.customExplodingKittens, 10);

  if (!isNaN(customDefuses) && !isNaN(customExplodingKittens)) {
    customDefuses = Math.min(Math.max(0, customDefuses), 8);
    customExplodingKittens = Math.min(Math.max(0, customExplodingKittens), 8);
    if (customExplodingKittens <= customDefuses) {
      customExplodingKittens = customDefuses + 1;
      if (customExplodingKittens > 8) {
        customExplodingKittens = 8;
        customDefuses = 7;
      }
    }
  } else {
    customDefuses = undefined;
    customExplodingKittens = undefined;
  }

  const room = {
    code,
    host: hostId,
    players: [{ userId: hostId, username, hand: [], alive: true, isReady: true }],
    maxPlayers,
    maxHandSize: 10,
    status: 'waiting',
    password: options.password || '',
    betAmount,
    edition,
    gameState: null,
    customDefuses,
    customExplodingKittens,
  };
  rooms.set(code, room);
  return room;
}

function joinRoom(roomCode, userId, username = 'Guest', password = '') {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Không tìm thấy phòng chơi');
  if (room.players.find((p) => p.userId === userId)) return room;
  if (room.players.length >= room.maxPlayers) throw new Error('Phòng chơi đã đầy');
  if (room.status !== 'waiting') throw new Error('Trận đấu đã bắt đầu');
  if (room.password && room.password !== password) throw new Error('Mật khẩu phòng chơi không chính xác');
  room.players.push({ userId, username, hand: [], alive: true, isReady: false });
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
  return rooms.get(roomCode) ?? null;
}

function kickPlayer(roomCode, hostId, targetUserId) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Không tìm thấy phòng chơi');
  if (room.host !== hostId) throw new Error('Chỉ chủ phòng mới có thể kick người chơi');
  if (room.host === targetUserId) throw new Error('Không thể kick chủ phòng');
  room.players = room.players.filter((p) => p.userId !== targetUserId);
  return room;
}

function toggleReady(roomCode, userId, isReady) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Không tìm thấy phòng chơi');
  const player = room.players.find((p) => p.userId === userId);
  if (!player) throw new Error('Không tìm thấy người chơi trong phòng');
  if (room.host === userId) throw new Error('Chủ phòng luôn ở trạng thái sẵn sàng');
  player.isReady = !!isReady;
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

  const betAmount = parseInt(newSettings.betAmount, 10);
  if (!isNaN(betAmount) && betAmount >= 0) {
    room.betAmount = Math.min(betAmount, 10000000);
  }

  if (newSettings.customDefuses !== undefined || newSettings.customExplodingKittens !== undefined) {
    let cd = parseInt(newSettings.customDefuses, 10);
    let cek = parseInt(newSettings.customExplodingKittens, 10);
    if (!isNaN(cd) && !isNaN(cek)) {
      cd = Math.min(Math.max(0, cd), 8);
      cek = Math.min(Math.max(0, cek), 8);
      if (cek <= cd) {
        cek = cd + 1;
        if (cek > 8) {
          cek = 8;
          cd = 7;
        }
      }
      room.customDefuses = cd;
      room.customExplodingKittens = cek;
    } else {
      room.customDefuses = undefined;
      room.customExplodingKittens = undefined;
    }
  }

  // Khi chủ phòng đổi cài đặt, tất cả người chơi khác tự động bị Huỷ sẵn sàng
  room.players.forEach((p) => {
    if (p.userId !== room.host) {
      p.isReady = false;
    }
  });

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
    edition: room.edition,
    barkingKittenState: {
      waitingHolder: null,
    },
  };

  return room;
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
  kickPlayer,
  toggleReady,
  updateRoomSettings,
};
