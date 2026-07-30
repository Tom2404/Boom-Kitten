const test = require('node:test');
const assert = require('node:assert/strict');

const roomManager = require('../game/roomManager');
const registerGameSocket = require('../sockets/gameSocket');
const { ensureTournamentMatchRoom } = require('../services/tournamentLifecycleService');

test('room player presentation survives dealing while private cosmetics stay absent', () => {
  const frame = {
    id: 'frame-1',
    name: 'Gold Frame',
    rarity: 'epic',
    assetUrl: '/frame.webp',
  };
  const protector = {
    id: 'protector-1',
    name: 'Inferno Protector',
    rarity: 'rare',
    assetUrl: '/protector.webp',
  };
  const room = roomManager.createRoom(
    'user-1',
    { gameMode: 'custom', betAmount: 0, maxPlayers: 2 },
    { username: 'One', avatar: 'crown_kitten', avatarFrame: frame, protector },
  );

  try {
    roomManager.joinRoom(
      room.code,
      'user-2',
      { username: 'Two', avatar: 'sleepy_kitten', avatarFrame: null },
    );
    roomManager.toggleReady(room.code, 'user-2', true);
    const started = roomManager.startGame(room.code);

    assert.deepEqual(started.gameState.players[0].avatarFrame, frame);
    assert.equal(started.gameState.players[0].avatar, 'crown_kitten');
    assert.deepEqual(started.gameState.players[0].protector, protector);
    assert.equal(started.gameState.players[0].field, undefined);
  } finally {
    roomManager.forceCloseRoom(room.code);
  }
});

test('public game state exposes social cosmetics but never hand or local field', () => {
  const publicState = registerGameSocket.sanitizePublicGameState({
    deck: [{ id: 'deck-1', type: 'skip' }],
    players: [{
      userId: 'user-1',
      username: 'One',
      avatar: 'crown_kitten',
      avatarFrame: { id: 'frame-1', assetUrl: '/frame.webp' },
      protector: { id: 'protector-1', assetUrl: '/protector.webp' },
      field: { id: 'field-1' },
      alive: true,
      hand: [{ id: 'secret-card', type: 'nope' }],
    }],
  });

  assert.equal(publicState.players[0].avatar, 'crown_kitten');
  assert.deepEqual(publicState.players[0].avatarFrame, { id: 'frame-1', assetUrl: '/frame.webp' });
  assert.deepEqual(publicState.players[0].protector, { id: 'protector-1', assetUrl: '/protector.webp' });
  assert.equal(publicState.players[0].field, undefined);
  assert.equal(publicState.players[0].hand, undefined);
});

test('tournament rooms hydrate the same public player presentation contract', async () => {
  const createdProfiles = [];
  const joinedProfiles = [];
  const tournament = {
    _id: 'tournament-1',
    status: 'active',
    stateVersion: 2,
    bracket: {
      rounds: [{
        matches: [{
          id: 'match-1',
          matchReference: 'round-1:match-1',
          status: 'pending',
          participants: [
            { userId: 'user-1', username: 'One' },
            { userId: 'user-2', username: 'Two' },
          ],
        }],
      }],
    },
  };
  const users = [
    {
      _id: 'user-1',
      username: 'One',
      avatar: 'crown_kitten',
      equippedCosmetics: {
        avatarFrame: {
          _id: 'frame-1',
          name: 'Gold Frame',
          type: 'avatar_frame',
          rarity: 'epic',
          imageUrl: '/frame.webp',
        },
        protector: {
          _id: 'protector-1',
          name: 'Inferno Protector',
          type: 'protector',
          rarity: 'rare',
          previewUrl: '/protector.webp',
        },
      },
    },
    { _id: 'user-2', username: 'Two', avatar: 'sleepy_kitten', equippedCosmetics: {} },
  ];
  const rooms = {
    getOperationalRoomStates: () => [],
    createRoom: (_id, _options, profile) => {
      createdProfiles.push(profile);
      return { code: 'ABC123' };
    },
    joinRoom: (_code, _id, profile) => joinedProfiles.push(profile),
    forceCloseRoom: () => {},
  };

  const result = await ensureTournamentMatchRoom({
    tournamentId: 'tournament-1',
    matchReference: 'round-1:match-1',
    userId: 'user-1',
    TournamentModel: {
      findById: async () => tournament,
      findOneAndUpdate: async () => tournament,
    },
    UserModel: {
      find: () => ({ populate: async () => users }),
    },
    rooms,
  });

  assert.equal(result.roomCode, 'ABC123');
  assert.equal(createdProfiles[0].avatar, 'crown_kitten');
  assert.equal(createdProfiles[0].avatarFrame.id, 'frame-1');
  assert.equal(createdProfiles[0].protector.id, 'protector-1');
  assert.equal(createdProfiles[0].protector.assetUrl, '/protector.webp');
  assert.equal(joinedProfiles[0].avatar, 'sleepy_kitten');
  assert.equal(joinedProfiles[0].avatarFrame, null);
  assert.equal(joinedProfiles[0].protector, null);
});
