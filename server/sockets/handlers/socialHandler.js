// Socket Handler: Social chat, emotes, and room invitations
const Friendship = require('../../models/Friendship');
const { assertCanInviteFriend } = require('../../services/friendshipService');
const { getRoomState } = require('../../game/roomManager');

function registerSocialHandlers(io, socket, helpers) {
  const { getUserId, safeSocketHandler } = helpers;

  socket.on('chat:send', safeSocketHandler(socket, async ({ roomCode, text }) => {
    const userId = getUserId(socket);
    const room = getRoomState(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player) return;

    const trimmedText = String(text ?? '').trim().slice(0, 200);
    if (!trimmedText) return;

    io.to(roomCode).emit('chat:message', {
      userId,
      username: player.username || 'Guest',
      text: trimmedText,
      timestamp: new Date().toISOString(),
    });
  }));

  socket.on('emote:send', safeSocketHandler(socket, async ({ roomCode, emoteId }) => {
    const userId = getUserId(socket);
    const room = getRoomState(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player) return;

    io.to(roomCode).emit('emote:received', {
      userId,
      emoteId,
      timestamp: Date.now(),
    });
  }));

  socket.on('room:invite', safeSocketHandler(socket, async ({ targetUserId, roomCode }, callback) => {
    try {
      const inviterId = getUserId(socket);
      const room = getRoomState(roomCode);
      if (!room || room.status !== 'waiting') {
        throw new Error('Chỉ có thể mời bạn bè khi phòng đang ở trạng thái chờ.');
      }

      await assertCanInviteFriend({
        inviterId,
        targetUserId,
        room,
        FriendshipModel: Friendship,
      });

      io.to(`user:${targetUserId}`).emit('room:invited', {
        roomCode,
        inviterId,
        inviterUsername: room.players.find((p) => p.userId === inviterId)?.username || 'Guest',
      });

      if (typeof callback === 'function') {
        callback({ ok: true });
      }
    } catch (error) {
      if (typeof callback === 'function') {
        callback({ ok: false, error: error.message });
      }
    }
  }));
}

module.exports = registerSocialHandlers;
