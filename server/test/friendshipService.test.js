const test = require('node:test');
const assert = require('node:assert/strict');

const { acceptFriendRequest, assertCanInviteFriend, sendFriendRequest } = require('../services/friendshipService');

test('sending a friend request creates a pending relationship', async () => {
  let created;
  let userFilter;
  const result = await sendFriendRequest({
    actorId: 'user-1',
    targetId: 'user-2',
    UserModel: { exists: async (filter) => { userFilter = filter; return true; } },
    FriendshipModel: { findOne: async () => null, create: async (payload) => { created = payload; return payload; } },
  });
  assert.equal(result.status, 'pending');
  assert.deepEqual(userFilter, { _id: 'user-2', role: 'user', deletedAt: null, isBanned: false });
  assert.deepEqual(created, { requester: 'user-1', recipient: 'user-2', status: 'pending', actionUser: 'user-1' });
});

test('accepting requires an incoming pending request and marks it accepted', async () => {
  const friendship = { status: 'pending', actionUser: 'user-2', async save() { this.saved = true; } };
  await acceptFriendRequest({ actorId: 'user-1', requesterId: 'user-2', FriendshipModel: { findOne: async () => friendship } });
  assert.equal(friendship.status, 'accepted');
  assert.equal(friendship.actionUser, 'user-1');
  assert.equal(friendship.saved, true);
});

test('room invites require an accepted friend and a waiting room membership', async () => {
  const room = { code: 'ABC123', status: 'waiting', players: [{ userId: 'user-1' }] };
  await assertCanInviteFriend({ inviterId: 'user-1', friendId: 'user-2', room, FriendshipModel: { exists: async () => true } });
  await assert.rejects(
    assertCanInviteFriend({ inviterId: 'user-1', friendId: 'stranger', room, FriendshipModel: { exists: async () => false } }),
    /bạn bè/,
  );
});
