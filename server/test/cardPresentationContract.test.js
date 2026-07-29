const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const {
  ensurePresentationId,
  isNopeableAction,
} = require('../game/interactions/cardPresentationContract');
const PlayCardInitAction = require('../game/actions/PlayCardInitAction');

test('keeps one presentation id while Nope rotates the response-window event id', () => {
  const action = { eventId: 'window-1', cardType: 'skip' };
  let generated = 0;

  const firstId = ensurePresentationId(action, () => `presentation-${++generated}`);
  action.eventId = 'window-2';
  const secondId = ensurePresentationId(action, () => `presentation-${++generated}`);

  assert.equal(firstId, 'presentation-1');
  assert.equal(secondId, 'presentation-1');
  assert.equal(action.presentationId, 'presentation-1');
  assert.equal(generated, 1);
});

test('does not replace a presentation id restored from pending game state', () => {
  const action = {
    eventId: 'window-resumed',
    presentationId: 'presentation-original',
  };

  assert.equal(
    ensurePresentationId(action, () => 'presentation-replacement'),
    'presentation-original',
  );
});

test('opens a Nope response window only for cards allowed by the current rules', () => {
  assert.equal(isNopeableAction('skip'), true);
  assert.equal(isNopeableAction('combo_2'), true);
  assert.equal(isNopeableAction('reverse'), false);
  assert.equal(isNopeableAction('defuse_resolved'), false);
});

test('auto-played Defuse starts a card presentation before it resolves', async () => {
  const source = await readFile(path.join(__dirname, '..', 'sockets', 'gameSocket.js'), 'utf8');

  assert.match(source, /game:cardPlayedPending'[\s\S]*cardType: 'defuse'/);
  assert.match(source, /cardType: 'defuse'[\s\S]*presentationId/);
  const defuseResolvedBranch = source.slice(
    source.indexOf("if (action.type === 'defuse_completed')"),
    source.indexOf('} else {', source.indexOf("if (action.type === 'defuse_completed')")),
  );
  assert.match(defuseResolvedBranch, /broadcastActionResolved\(room, action, 'RESOLVED'\)/);
});

test('card presentation keeps the skin of the exact card removed from the acting player hand', async () => {
  const action = new PlayCardInitAction();
  const context = {
    state: {
      players: [{
        userId: 'player-a',
        alive: true,
        hand: [{ id: 'favor-skin-3', type: 'favor', skinIndex: 3 }],
      }],
      discardPile: [],
      lastAction: null,
    },
  };
  context.getPlayer = (userId) => context.state.players.find((player) => player.userId === userId);
  const payload = {
    userId: 'player-a',
    cardType: 'favor',
    options: { cardId: 'favor-skin-3' },
  };

  action.execute(context, payload);

  assert.equal(payload.playedCardSkinIndex, 3);

  const socketSource = await readFile(path.join(__dirname, '..', 'sockets', 'gameSocket.js'), 'utf8');
  assert.match(socketSource, /const cardSkinIndex = payload\.playedCardSkinIndex \?\? 0/);
});

test('combo presentation publishes every selected card type and skin', async () => {
  const source = await readFile(path.join(__dirname, '..', 'sockets', 'gameSocket.js'), 'utf8');
  const comboHandler = source.slice(
    source.indexOf("socket.on('game:combo'"),
    source.indexOf("socket.on('game:selectTarget:respond'"),
  );

  assert.match(comboHandler, /comboCards/);
  assert.match(comboHandler, /id: card\.id/);
  assert.match(comboHandler, /type: card\.type/);
  assert.match(comboHandler, /skinIndex: card\.skinIndex \?\? 0/);
});
