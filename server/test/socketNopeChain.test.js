const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const registerGameSocket = require('../sockets/gameSocket');
const { getRoomState, leaveRoom, startGame, toggleReady } = require('../game/roomManager');

function waitFor(socket, eventName, predicate = () => true, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      socket.off(eventName, onEvent);
    }

    function onEvent(payload) {
      if (!predicate(payload)) return;
      cleanup();
      resolve(payload);
    }

    socket.on(eventName, onEvent);
  });
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (!error || error.code === 'ERR_SERVER_NOT_RUNNING') {
        resolve();
        return;
      }
      reject(error);
    });
  });
}

async function createSocketHarness(t) {
  const httpServer = http.createServer();
  const ioServer = new Server(httpServer, { cors: { origin: '*' } });
  registerGameSocket(ioServer);

  const port = await listen(httpServer);
  const url = `http://127.0.0.1:${port}`;
  const clients = [];

  async function connect(guestId) {
    const socket = Client(url, {
      auth: { guestId },
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });
    clients.push(socket);
    await waitFor(socket, 'connect');
    return socket;
  }

  t.after(async () => {
    clients.forEach((socket) => socket.disconnect());
    await new Promise((resolve) => ioServer.close(resolve));
    await closeServer(httpServer);
  });

  return { connect };
}

async function createStartedRoom(p1, p2, p3) {
  const created = waitFor(p1, 'room:updated', ({ room }) => room?.host === 'p1');
  p1.emit('room:create', { betAmount: 0, maxPlayers: 3, edition: 'original' });
  const { room } = await created;

  const p2Joined = waitFor(p2, 'room:updated', (payload) => payload.room?.code === room.code);
  p2.emit('room:join', { roomCode: room.code });
  await p2Joined;

  const p3Joined = waitFor(p3, 'room:updated', (payload) => payload.room?.code === room.code);
  p3.emit('room:join', { roomCode: room.code });
  await p3Joined;

  toggleReady(room.code, 'p2', true);
  toggleReady(room.code, 'p3', true);
  startGame(room.code);

  return getRoomState(room.code);
}

test('socket Nope chain cancels a combo before combo effects mutate state', async (t) => {
  const { connect } = await createSocketHarness(t);
  const p1 = await connect('p1');
  const p2 = await connect('p2');
  const p3 = await connect('p3');
  const room = await createStartedRoom(p1, p2, p3);
  const state = room.gameState;

  state.players = state.players.map((player) => {
    if (player.userId === 'p1') {
      return {
        ...player,
        hand: [
          { id: 'cat-1', type: 'cat_taco' },
          { id: 'cat-2', type: 'cat_taco' },
        ],
      };
    }
    if (player.userId === 'p2') {
      return { ...player, hand: [{ id: 'nope-1', type: 'nope' }] };
    }
    return { ...player, hand: [] };
  });
  state.currentPlayerIndex = state.players.findIndex((player) => player.userId === 'p1');
  state.discardPile = [];
  state.pendingAction = null;
  state.pendingNowOnlyWindow = null;

  const opened = waitFor(p1, 'game:nopeWindow', (payload) => payload.cardType === 'combo_2');
  p1.emit('game:combo', { cards: ['cat-1', 'cat-2'], targetPlayerId: 'p2' });
  const firstWindow = await opened;

  assert.equal(state.players.find((player) => player.userId === 'p1').hand.length, 2);
  assert.equal(state.discardPile.length, 0);
  assert.equal(state.pendingAction.cardType, 'combo_2');

  const nopedWindow = waitFor(p1, 'game:nopeWindow', (payload) => payload.nopeCount === 1);
  p2.emit('game:nope', { originalEventId: firstWindow.eventId });
  const secondWindow = await nopedWindow;

  assert.equal(state.players.find((player) => player.userId === 'p1').hand.length, 2);
  assert.deepEqual(state.discardPile.map((card) => card.type), ['nope']);

  const nopeResult = waitFor(p1, 'game:nopeResult', (payload) => payload.cardType === 'combo_2');
  p2.emit('game:nopeWindow:pass', { eventId: secondWindow.eventId });
  p3.emit('game:nopeWindow:pass', { eventId: secondWindow.eventId });
  const result = await nopeResult;

  assert.equal(result.canceled, true);
  assert.equal(state.pendingAction, null);
  assert.equal(state.players.find((player) => player.userId === 'p1').hand.length, 2);
  assert.deepEqual(state.discardPile.map((card) => card.type), ['nope']);

  leaveRoom(room.code, 'p1');
  leaveRoom(room.code, 'p2');
  leaveRoom(room.code, 'p3');
});

test('defuse completion reaction window emits cleared pendingAction state after pass', async (t) => {
  const { connect } = await createSocketHarness(t);
  const p1 = await connect('p1');
  const p2 = await connect('p2');
  const p3 = await connect('p3');
  const room = await createStartedRoom(p1, p2, p3);
  const state = room.gameState;

  state.players = state.players.map((player) => ({
    ...player,
    hand: [],
    alive: true,
  }));
  state.currentPlayerIndex = state.players.findIndex((player) => player.userId === 'p1');
  state.drawsRequired = 0;
  state.deck = [];
  state.discardPile = [];
  state.pendingAction = null;
  state.pendingDefuse = {
    playerId: 'p1',
    card: { id: 'ek-1', type: 'exploding_kitten' },
    startedAt: Date.now(),
  };

  const opened = waitFor(p1, 'game:nopeWindow', (payload) => payload.cardType === 'defuse_resolved');
  p1.emit('game:defuse:respond', { insertPosition: 0 });
  const windowPayload = await opened;

  assert.equal(state.pendingAction.cardType, 'defuse_resolved');

  const clearedState = waitFor(
    p1,
    'game:stateUpdate',
    ({ publicGameState }) => publicGameState?.pendingAction === null,
  );
  p2.emit('game:nopeWindow:pass', { eventId: windowPayload.eventId });
  p3.emit('game:nopeWindow:pass', { eventId: windowPayload.eventId });
  await clearedState;

  assert.equal(state.pendingAction, null);
  assert.equal(state.pendingDefuse, null);

  leaveRoom(room.code, 'p1');
  leaveRoom(room.code, 'p2');
  leaveRoom(room.code, 'p3');
});

test('reverse opens a Now window that clears after timeout', async (t) => {
  const { connect } = await createSocketHarness(t);
  const p1 = await connect('p1');
  const p2 = await connect('p2');
  const p3 = await connect('p3');
  const room = await createStartedRoom(p1, p2, p3);
  const state = room.gameState;

  state.players = state.players.map((player) => ({
    ...player,
    hand: player.userId === 'p1' ? [{ id: 'reverse-1', type: 'reverse' }] : [],
    alive: true,
  }));
  state.currentPlayerIndex = state.players.findIndex((player) => player.userId === 'p1');
  state.playDirection = 1;
  state.drawsRequired = 1;
  state.discardPile = [];
  state.pendingAction = null;
  state.pendingNowOnlyWindow = null;

  const nopeWindow = waitFor(p1, 'game:nopeWindow', (payload) => payload.cardType === 'reverse');
  p1.emit('game:playCard', { cardType: 'reverse' });
  const nopePayload = await nopeWindow;

  const nowWindow = waitFor(p1, 'game:nowOnlyWindow', (payload) => payload.resolvedCardType === 'reverse');
  p2.emit('game:nopeWindow:pass', { eventId: nopePayload.eventId });
  p3.emit('game:nopeWindow:pass', { eventId: nopePayload.eventId });
  const nowPayload = await nowWindow;

  assert.equal(state.pendingAction, null);
  assert.equal(state.pendingNowOnlyWindow.eventId, nowPayload.eventId);

  const clearedState = waitFor(
    p1,
    'game:stateUpdate',
    ({ publicGameState }) => publicGameState?.pendingNowOnlyWindow === null,
    5000,
  );
  await waitFor(p1, 'game:nowOnlyWindow:end', ({ eventId }) => eventId === nowPayload.eventId, 5000);
  await clearedState;

  assert.equal(state.pendingNowOnlyWindow, null);

  leaveRoom(room.code, 'p1');
  leaveRoom(room.code, 'p2');
  leaveRoom(room.code, 'p3');
});

test('playing a Now card during Now window clears the previous Now blocker', async (t) => {
  const { connect } = await createSocketHarness(t);
  const p1 = await connect('p1');
  const p2 = await connect('p2');
  const p3 = await connect('p3');
  const room = await createStartedRoom(p1, p2, p3);
  const state = room.gameState;

  state.players = state.players.map((player) => {
    if (player.userId === 'p1') {
      return { ...player, hand: [{ id: 'reverse-1', type: 'reverse' }], alive: true };
    }
    if (player.userId === 'p2') {
      return { ...player, hand: [{ id: 'shuffle-now-1', type: 'shuffle_now' }], alive: true };
    }
    return { ...player, hand: [], alive: true };
  });
  state.currentPlayerIndex = state.players.findIndex((player) => player.userId === 'p1');
  state.playDirection = 1;
  state.drawsRequired = 1;
  state.discardPile = [];
  state.pendingAction = null;
  state.pendingNowOnlyWindow = null;

  const nopeWindow = waitFor(p1, 'game:nopeWindow', (payload) => payload.cardType === 'reverse');
  p1.emit('game:playCard', { cardType: 'reverse' });
  const nopePayload = await nopeWindow;

  const nowWindow = waitFor(p2, 'game:nowOnlyWindow', (payload) => payload.resolvedCardType === 'reverse');
  p2.emit('game:nopeWindow:pass', { eventId: nopePayload.eventId });
  p3.emit('game:nopeWindow:pass', { eventId: nopePayload.eventId });
  const nowPayload = await nowWindow;

  const previousNowEnded = waitFor(p2, 'game:nowOnlyWindow:end', ({ eventId }) => eventId === nowPayload.eventId);
  p2.emit('game:playCard', {
    cardType: 'shuffle_now',
    options: { cardId: 'shuffle-now-1' },
  });
  await previousNowEnded;

  assert.equal(state.pendingNowOnlyWindow, null);
  assert.equal(state.players.find((player) => player.userId === 'p2').hand.length, 0);

  leaveRoom(room.code, 'p1');
  leaveRoom(room.code, 'p2');
  leaveRoom(room.code, 'p3');
});

test('room updated payload sanitizes pending action timers on reconnect', async (t) => {
  const { connect } = await createSocketHarness(t);
  const p1 = await connect('p1');
  const p2 = await connect('p2');
  const p3 = await connect('p3');
  const room = await createStartedRoom(p1, p2, p3);
  const state = room.gameState;

  const pendingTimer = setTimeout(() => {}, 10000);
  const nowTimer = setTimeout(() => {}, 10000);
  const resolvedTimer = setTimeout(() => {}, 10000);

  t.after(() => {
    clearTimeout(pendingTimer);
    clearTimeout(nowTimer);
    clearTimeout(resolvedTimer);
  });

  state.pendingAction = {
    eventId: 'pending-action',
    playerId: 'p1',
    cardType: 'reverse',
    nopeCount: 0,
    timerId: pendingTimer,
  };
  state.pendingNowOnlyWindow = {
    eventId: 'now-window',
    timeoutMs: 3000,
    startedAt: Date.now(),
    timerId: nowTimer,
    resolvedAction: {
      eventId: 'resolved-action',
      playerId: 'p1',
      cardType: 'reverse',
      nopeCount: 0,
      timerId: resolvedTimer,
    },
  };

  const reconnected = await connect('p1');
  const payload = await waitFor(
    reconnected,
    'room:updated',
    ({ room: updatedRoom }) => updatedRoom?.code === room.code,
    1000,
  );

  assert.equal(payload.room.gameState.pendingAction.timerId, undefined);
  assert.equal(payload.room.gameState.pendingNowOnlyWindow.timerId, undefined);
  assert.equal(payload.room.gameState.pendingNowOnlyWindow.resolvedAction.timerId, undefined);
  assert.equal(payload.room.gameState.deck, undefined);

  leaveRoom(room.code, 'p1');
  leaveRoom(room.code, 'p2');
  leaveRoom(room.code, 'p3');
});
