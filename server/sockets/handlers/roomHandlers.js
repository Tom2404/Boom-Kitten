const {
  createRoom,
  joinRoom,
  leaveRoom,
  kickPlayer,
  toggleReady,
  updateRoomSettings,
  getRoomState,
} = require('../../game/roomManager');
const { emitRoomUpdated, sanitizeRoom } = require('../broadcast/gameStateSync');
const { grantRoomInvite, consumeRoomInviteGrant, clearReconnectTimer } = require('../helpers/reconnectHelpers');
const { assertCanInviteFriend } = require('../../services/friendshipService');
const Friendship = require('../../models/Friendship');

function registerRoomHandlers(io, socket) {
  socket.on('create_room', (data = {}, respond) => {
    try {
      const { maxPlayers, isPublic, roomMode, isRanked, betAmount, password } = data;
      const hostUser = socket.user || {
        userId: socket.id,
        username: data.username || `Player_${socket.id.substring(0, 4)}`,
        avatar: data.avatar || '',
      };

      const room = createRoom(hostUser, {
        maxPlayers,
        isPublic,
        roomMode,
        isRanked,
        betAmount,
        password,
      });

      socket.join(room.code);
      socket.currentRoomCode = room.code;
      socket.userId = hostUser.userId;

      emitRoomUpdated(io.to(room.code), room);
      if (typeof respond === 'function') {
        respond({ ok: true, roomCode: room.code, room: sanitizeRoom(room) });
      }
    } catch (err) {
      if (typeof respond === 'function') {
        respond({ ok: false, error: err.message });
      } else {
        socket.emit('error_message', { message: err.message });
      }
    }
  });

  socket.on('join_room', (data = {}, respond) => {
    try {
      const { roomCode, password } = data;
      const user = socket.user || {
        userId: socket.id,
        username: data.username || `Player_${socket.id.substring(0, 4)}`,
        avatar: data.avatar || '',
      };

      const invited = consumeRoomInviteGrant(roomCode, user.userId);
      const room = joinRoom(roomCode, user, password, { bypassPassword: invited });

      socket.join(room.code);
      socket.currentRoomCode = room.code;
      socket.userId = user.userId;

      emitRoomUpdated(io.to(room.code), room);
      if (typeof respond === 'function') {
        respond({ ok: true, room: sanitizeRoom(room) });
      }
    } catch (err) {
      if (typeof respond === 'function') {
        respond({ ok: false, error: err.message });
      } else {
        socket.emit('error_message', { message: err.message });
      }
    }
  });

  socket.on('leave_room', (data = {}, respond) => {
    const roomCode = data.roomCode || socket.currentRoomCode;
    const userId = socket.userId || socket.user?.userId || socket.id;

    if (!roomCode) {
      if (typeof respond === 'function') respond({ ok: false, error: 'No room code provided' });
      return;
    }

    clearReconnectTimer(roomCode, userId);
    const room = leaveRoom(roomCode, userId);
    socket.leave(roomCode);
    delete socket.currentRoomCode;

    if (room) {
      emitRoomUpdated(io.to(roomCode), room);
    }
    if (typeof respond === 'function') respond({ ok: true });
  });

  socket.on('toggle_ready', (data = {}, respond) => {
    try {
      const roomCode = data.roomCode || socket.currentRoomCode;
      const userId = socket.userId || socket.user?.userId || socket.id;
      const room = toggleReady(roomCode, userId);

      emitRoomUpdated(io.to(room.code), room);
      if (typeof respond === 'function') respond({ ok: true, room: sanitizeRoom(room) });
    } catch (err) {
      if (typeof respond === 'function') respond({ ok: false, error: err.message });
      else socket.emit('error_message', { message: err.message });
    }
  });

  socket.on('kick_player', (data = {}, respond) => {
    try {
      const roomCode = data.roomCode || socket.currentRoomCode;
      const hostId = socket.userId || socket.user?.userId || socket.id;
      const { targetUserId } = data;

      const room = kickPlayer(roomCode, hostId, targetUserId);

      // Find target socket and make them leave room
      const targetSockets = io.sockets.adapter.rooms.get(`user:${targetUserId}`);
      if (targetSockets) {
        for (const socketId of targetSockets) {
          const targetSocket = io.sockets.sockets.get(socketId);
          if (targetSocket) {
            targetSocket.leave(roomCode);
            delete targetSocket.currentRoomCode;
            targetSocket.emit('kicked_from_room', { roomCode, reason: 'Kicked by host' });
          }
        }
      }

      emitRoomUpdated(io.to(room.code), room);
      if (typeof respond === 'function') respond({ ok: true, room: sanitizeRoom(room) });
    } catch (err) {
      if (typeof respond === 'function') respond({ ok: false, error: err.message });
      else socket.emit('error_message', { message: err.message });
    }
  });

  socket.on('update_room_settings', (data = {}, respond) => {
    try {
      const roomCode = data.roomCode || socket.currentRoomCode;
      const hostId = socket.userId || socket.user?.userId || socket.id;

      const room = updateRoomSettings(roomCode, hostId, data.settings || {});

      emitRoomUpdated(io.to(room.code), room);
      if (typeof respond === 'function') respond({ ok: true, room: sanitizeRoom(room) });
    } catch (err) {
      if (typeof respond === 'function') respond({ ok: false, error: err.message });
      else socket.emit('error_message', { message: err.message });
    }
  });

  socket.on('invite_friend', async (data = {}, respond) => {
    try {
      const senderId = socket.userId || socket.user?.userId;
      const { roomCode, friendId } = data;
      const room = getRoomState(roomCode);

      if (!room) throw new Error('ROOM_NOT_FOUND');
      await assertCanInviteFriend({ senderId, friendId, room, FriendshipModel: Friendship });

      grantRoomInvite(roomCode, friendId);
      io.to(`user:${friendId}`).emit('room:invite', {
        roomCode,
        inviterId: senderId,
        inviterUsername: socket.user?.username || 'Bạn bè',
        roomMode: room.roomMode,
        betAmount: room.betAmount || 0,
      });

      if (typeof respond === 'function') respond({ ok: true });
    } catch (err) {
      if (typeof respond === 'function') respond({ ok: false, error: err.message });
      else socket.emit('error_message', { message: err.message });
    }
  });
}

module.exports = { registerRoomHandlers };
