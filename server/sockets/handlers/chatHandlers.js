function registerChatHandlers(io, socket) {
  socket.on('send_chat_message', (data = {}, respond) => {
    const roomCode = data.roomCode || socket.currentRoomCode;
    const text = (data.text || '').trim();

    if (!roomCode || !text) {
      if (typeof respond === 'function') respond({ ok: false, error: 'Invalid message or room' });
      return;
    }

    const payload = {
      userId: socket.userId || socket.user?.userId || socket.id,
      username: socket.user?.username || data.username || 'Player',
      text: text.substring(0, 500),
      timestamp: new Date().toISOString(),
    };

    io.to(roomCode).emit('chat:message', payload);
    if (typeof respond === 'function') respond({ ok: true });
  });

  socket.on('send_emote', (data = {}, respond) => {
    const roomCode = data.roomCode || socket.currentRoomCode;
    const { emoteId } = data;

    if (!roomCode || !emoteId) {
      if (typeof respond === 'function') respond({ ok: false, error: 'Invalid emote or room' });
      return;
    }

    const payload = {
      playerId: socket.userId || socket.user?.userId || socket.id,
      emoteId,
      timestamp: new Date().toISOString(),
    };

    io.to(roomCode).emit('emote_received', payload);
    if (typeof respond === 'function') respond({ ok: true });
  });
}

module.exports = { registerChatHandlers };
