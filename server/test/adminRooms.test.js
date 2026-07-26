const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sanitizeRoomForAdmin,
  forceCloseRoomForAdmin,
  disconnectRoomPlayerForAdmin,
} = require('../services/admin/roomOperationsService');

function secretRoom() {
  return {
    code: 'ABC123',
    host: 'user-1',
    password: 'do-not-leak',
    status: 'playing',
    edition: 'zombie',
    gameMode: 'ranked',
    betAmount: 50,
    wagerReference: 'ABC123:round-1',
    maxPlayers: 5,
    createdAt: new Date('2026-07-22T00:00:00.000Z'),
    updatedAt: new Date('2026-07-22T00:09:00.000Z'),
    players: [
      { userId: 'user-1', username: 'Host', isReady: true, hand: [{ id: 'c1', type: 'defuse' }] },
      { userId: 'user-2', username: 'Guest', isReady: true, hand: [{ id: 'c2', type: 'exploding_kitten' }] },
    ],
    gameState: {
      deck: [{ id: 'top-secret', type: 'exploding_kitten' }],
      discardPile: [{ id: 'discard-secret', type: 'attack' }],
      currentPlayerIndex: 1,
      players: [
        { userId: 'user-1', username: 'Host', alive: true, hand: [{ id: 'c1', type: 'defuse' }] },
        { userId: 'user-2', username: 'Guest', alive: true, hand: [{ id: 'c2', type: 'exploding_kitten' }] },
      ],
      pendingAction: { cardType: 'favor', targetPlayerId: 'user-1', privateChoice: 'c1' },
      pendingTargetSelect: { options: [{ cardId: 'c1' }] },
    },
  };
}

test('admin room projection exposes operational metadata without card or password secrets', () => {
  const result = sanitizeRoomForAdmin(secretRoom(), { now: new Date('2026-07-22T00:10:00.000Z') });
  const serialized = JSON.stringify(result);

  assert.equal(result.code, 'ABC123');
  assert.equal(result.currentTurn.userId, 'user-2');
  assert.equal(result.players[0].handCount, 1);
  assert.equal(result.phase, 'response_window');
  assert.equal(result.pendingInteraction, true);
  for (const secret of ['do-not-leak', 'top-secret', 'discard-secret', 'exploding_kitten', 'defuse', 'favor', 'privateChoice', 'cardId']) {
    assert.equal(serialized.includes(secret), false, `leaked ${secret}`);
  }
  assert.equal(Object.hasOwn(result, 'gameState'), false);
  assert.equal(Object.hasOwn(result, 'password'), false);
});

test('admin room projection marks idle playing rooms stale after five minutes', () => {
  const room = secretRoom();
  room.updatedAt = new Date('2026-07-22T00:04:59.000Z');
  const result = sanitizeRoomForAdmin(room, { now: new Date('2026-07-22T00:10:00.000Z') });
  assert.equal(result.stale, true);
  assert.equal(result.idleMs, 301000);
});

test('force close removes the room, broadcasts closure, and audits only the safe snapshot', async () => {
  const room = secretRoom();
  const events = [];
  let auditPayload;
  let refundPayload;
  const result = await forceCloseRoomForAdmin({
    roomCode: room.code,
    actor: { id: 'admin-1', username: 'root', role: 'super_admin' },
    mutation: { reason: 'Room is stuck', requestId: 'force-1' },
    request: { requestId: 'transport-1' },
    roomManager: { getRoomState: () => room, forceCloseRoom: () => room },
    io: { to: (target) => ({ emit: (event, payload) => events.push({ target, event, payload }) }) },
    audit: async (payload) => { auditPayload = payload; },
    refund: async (payload) => { refundPayload = payload; },
  });

  assert.equal(result.code, room.code);
  assert.equal(events[0].event, 'admin:roomClosed');
  assert.equal(refundPayload.reference, room.wagerReference);
  assert.equal(refundPayload.requestId, 'admin-refund:force-1');
  assert.equal(auditPayload.action, 'ROOM_FORCE_CLOSED');
  assert.equal(JSON.stringify(auditPayload).includes('top-secret'), false);
});

test('disconnect player requires room membership, removes them, broadcasts, and disconnects their sockets', async () => {
  const room = secretRoom();
  const events = [];
  let disconnected = false;
  const io = {
    to: (target) => ({ emit: (event, payload) => events.push({ target, event, payload }) }),
    in: () => ({ disconnectSockets: () => { disconnected = true; } }),
  };
  let refundPayload;
  let forceClosed = false;
  const result = await disconnectRoomPlayerForAdmin({
    roomCode: room.code,
    userId: 'user-2',
    actor: { id: 'admin-1', username: 'root', role: 'super_admin' },
    mutation: { reason: 'Abusive session', requestId: 'disconnect-1' },
    roomManager: {
      getRoomState: () => room,
      disconnectPlayer: () => ({ ...room, players: room.players.slice(0, 1) }),
      forceCloseRoom: () => { forceClosed = true; return room; },
    },
    io,
    audit: async () => {},
    refund: async (payload) => { refundPayload = payload; },
  });

  assert.equal(result.disconnectedUserId, 'user-2');
  assert.equal(disconnected, true);
  assert.equal(forceClosed, true);
  assert.equal(refundPayload.reference, room.wagerReference);
  assert.equal(events.some(({ event }) => event === 'admin:playerDisconnected'), true);
});
