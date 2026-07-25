const test = require('node:test');
const assert = require('node:assert/strict');

const { changePlayerRole } = require('../services/admin/roleService');

const actor = { id: 'admin-1', username: 'root-cat', role: 'super_admin' };
const mutation = { reason: 'Approved support access', requestId: 'role-op-1' };

test('prevents an administrator from changing their own role', async () => {
  await assert.rejects(
    changePlayerRole({ UserModel: {}, actor, targetId: 'admin-1', nextRole: 'operator', mutation }),
    (error) => error.code === 'ADMIN_SELF_ACTION_DENIED' && error.statusCode === 409,
  );
});

test('protects the final super admin from demotion', async () => {
  const UserModel = {
    findById: async () => ({ _id: 'last-admin', username: 'last-root', role: 'super_admin', __v: 3 }),
    countDocuments: async () => 0,
  };

  await assert.rejects(
    changePlayerRole({ UserModel, actor, targetId: 'last-admin', nextRole: 'operator', mutation }),
    (error) => error.code === 'LAST_SUPER_ADMIN' && error.statusCode === 409,
  );
});

test('reports a conflict when the player changed after the admin preview', async () => {
  const UserModel = {
    findById: async () => ({ _id: 'player-1', username: 'player', role: 'user', __v: 2 }),
    findOneAndUpdate: () => ({ select: async () => null }),
  };

  await assert.rejects(
    changePlayerRole({ UserModel, actor, targetId: 'player-1', nextRole: 'operator', mutation }),
    (error) => error.code === 'STATE_CONFLICT' && error.statusCode === 409,
  );
});

test('changes role with optimistic versioning and writes normalized audit context', async () => {
  let updateFilter;
  let updateDocument;
  let auditInput;
  const updated = { _id: 'player-1', username: 'player', role: 'operator', __v: 3 };
  const UserModel = {
    findById: async () => ({ _id: 'player-1', username: 'player', role: 'user', __v: 2 }),
    findOneAndUpdate: (filter, update) => {
      updateFilter = filter;
      updateDocument = update;
      return { select: async () => updated };
    },
  };
  const audit = async (input) => { auditInput = input; };

  const result = await changePlayerRole({
    UserModel,
    audit,
    actor,
    targetId: 'player-1',
    nextRole: 'operator',
    mutation,
    request: { requestId: 'transport-1', ip: '127.0.0.1', userAgent: 'Admin Browser' },
  });

  assert.equal(result, updated);
  assert.deepEqual(updateFilter, { _id: 'player-1', __v: 2 });
  assert.deepEqual(updateDocument, { $set: { role: 'operator' }, $inc: { __v: 1 } });
  assert.equal(auditInput.action, 'PLAYER_ROLE_CHANGED');
  assert.deepEqual(auditInput.before, { role: 'user', version: 2 });
  assert.deepEqual(auditInput.after, { role: 'operator', version: 3 });
  assert.equal(auditInput.request.operationRequestId, 'role-op-1');
});
