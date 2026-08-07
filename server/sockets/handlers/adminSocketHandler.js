// Socket Handler: LiveOps and admin spectate operations
const { getRoomState, getOperationalRoomStates } = require('../../game/roomManager');

function registerAdminSocketHandlers(io, socket, helpers) {
  const { getUserId, safeSocketHandler } = helpers;

  socket.on('admin:spectate', safeSocketHandler(socket, async ({ roomCode }) => {
    if (!socket.user || socket.user.role !== 'admin') {
      return socket.emit('error', { message: 'Không có quyền truy cập.' });
    }

    const room = getRoomState(roomCode);
    if (!room) return;

    socket.join(`spectate:${roomCode}`);
    socket.emit('admin:spectateState', { room });
  }));

  socket.on('admin:getRooms', safeSocketHandler(socket, async () => {
    if (!socket.user || socket.user.role !== 'admin') return;
    const roomStates = getOperationalRoomStates();
    socket.emit('admin:roomsList', { rooms: roomStates });
  }));
}

module.exports = registerAdminSocketHandlers;
