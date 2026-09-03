// Socket Handler: Room lifecycle events (create, join, leave, ready, kick, settings)
const CreateRoomUseCase = require('../../application/usecases/CreateRoomUseCase');
const JoinRoomUseCase = require('../../application/usecases/JoinRoomUseCase');
const {
  toggleReady,
  kickPlayer,
  updateRoomSettings,
  getRoomState,
  leaveRoom,
} = require('../../game/roomManager');

function registerRoomHandlers(io, socket, helpers) {
  const {
    getUserId,
    emitRoomUpdated,
    findUserByIdSafe,
    toPlayerPresentation,
    safeSocketHandler,
  } = helpers;

  socket.on('room:create', safeSocketHandler(socket, async (data = {}) => {
    const userId = getUserId(socket);
    const dbUser = await findUserByIdSafe(userId);
    const profile = dbUser ? toPlayerPresentation(dbUser) : 'Guest';

    const room = CreateRoomUseCase.execute({
      hostId: userId,
      options: data,
      profile,
    });

    socket.join(room.code);
    emitRoomUpdated(socket, room);
  }));

  socket.on('room:join', safeSocketHandler(socket, async ({ roomCode, password } = {}) => {
    const userId = getUserId(socket);
    const dbUser = await findUserByIdSafe(userId);
    const profile = dbUser ? toPlayerPresentation(dbUser) : 'Guest';

    const room = JoinRoomUseCase.execute({
      roomCode,
      userId,
      profile,
      password,
    });

    socket.join(room.code);
    emitRoomUpdated(io.to(room.code), room);
  }));

  socket.on('room:leave', safeSocketHandler(socket, async ({ roomCode }) => {
    const userId = getUserId(socket);
    const room = leaveRoom(roomCode, userId);
    socket.leave(roomCode);
    if (room) {
      emitRoomUpdated(io.to(roomCode), room);
    }
  }));

  socket.on('room:ready', safeSocketHandler(socket, async ({ roomCode, isReady }) => {
    const userId = getUserId(socket);
    const room = toggleReady(roomCode, userId, isReady);
    emitRoomUpdated(io.to(roomCode), room);
  }));

  socket.on('room:kick', safeSocketHandler(socket, async ({ roomCode, targetUserId }) => {
    const hostId = getUserId(socket);
    const room = kickPlayer(roomCode, hostId, targetUserId);
    emitRoomUpdated(io.to(roomCode), room);
  }));

  socket.on('room:settings', safeSocketHandler(socket, async ({ roomCode, newSettings }) => {
    const hostId = getUserId(socket);
    const room = updateRoomSettings(roomCode, hostId, newSettings);
    emitRoomUpdated(io.to(roomCode), room);
  }));
}

module.exports = registerRoomHandlers;
