const reconnectTimers = new Map();
const roomInviteGrants = new Map();

function roomInviteKey(roomCode, userId) {
  return `${roomCode}:${userId}`;
}

function grantRoomInvite(roomCode, userId, ttlMs = 30000) {
  const expiresAt = Date.now() + ttlMs;
  roomInviteGrants.set(roomInviteKey(roomCode, userId), expiresAt);
  return expiresAt;
}

function consumeRoomInviteGrant(roomCode, userId, now = Date.now()) {
  const key = roomInviteKey(roomCode, userId);
  const expiresAt = roomInviteGrants.get(key) || 0;
  roomInviteGrants.delete(key);
  return expiresAt > now;
}

function reconnectTimerKey(roomCode, userId) {
  return `${roomCode}:${userId}`;
}

function setReconnectTimer(roomCode, userId, timer) {
  const key = reconnectTimerKey(roomCode, userId);
  if (reconnectTimers.has(key)) {
    clearTimeout(reconnectTimers.get(key));
  }
  reconnectTimers.set(key, timer);
}

function clearReconnectTimer(roomCode, userId) {
  const key = reconnectTimerKey(roomCode, userId);
  const timer = reconnectTimers.get(key);
  if (timer) clearTimeout(timer);
  reconnectTimers.delete(key);
}

function clearRoomReconnectTimers(roomCode) {
  const prefix = `${roomCode}:`;
  for (const [key, timer] of reconnectTimers) {
    if (!key.startsWith(prefix)) continue;
    clearTimeout(timer);
    reconnectTimers.delete(key);
  }
}

module.exports = {
  reconnectTimers,
  roomInviteGrants,
  grantRoomInvite,
  consumeRoomInviteGrant,
  setReconnectTimer,
  clearReconnectTimer,
  clearRoomReconnectTimers,
};
