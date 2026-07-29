const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createManagedUser,
  softDeleteManagedUser,
  updateManagedUser,
} = require('../services/admin/userAdminService');

const admin = { id: 'admin-1', username: 'manager', role: 'admin' };
const superAdmin = { id: 'root-1', username: 'root', role: 'super_admin' };
const mutation = { reason: 'Approved account request', requestId: 'user-op-1' };

test('admin creates a regular user with a hashed temporary password', async () => {
  let created;
  const UserModel = { create: async (input) => (created = { _id: 'user-1', ...input }) };

  const user = await createManagedUser({
    UserModel,
    hashPassword: async (password) => `hashed:${password}`,
    audit: async () => {},
    actor: admin,
    input: { username: 'new-user', email: 'NEW@EXAMPLE.COM', password: 'temporary-pass', role: 'user' },
    mutation,
  });

  assert.equal(created.passwordHash, 'hashed:temporary-pass');
  assert.equal(created.email, 'new@example.com');
  assert.equal(user.passwordHash, undefined);
});

test('admin cannot create another administrative account', async () => {
  await assert.rejects(
    createManagedUser({
      UserModel: {},
      actor: admin,
      input: { username: 'ops', email: 'ops@example.com', password: 'temporary-pass', role: 'admin' },
      mutation,
    }),
    (error) => error.code === 'ADMIN_PERMISSION_DENIED',
  );
});

test('updates user identity with optimistic versioning', async () => {
  let update;
  const UserModel = {
    findById: async () => ({ _id: 'user-1', username: 'before', email: 'before@example.com', role: 'user', __v: 2 }),
    findOneAndUpdate: (_filter, document) => {
      update = document;
      return { select: async () => ({ _id: 'user-1', username: 'after', email: 'after@example.com', role: 'user', __v: 3 }) };
    },
  };

  await updateManagedUser({
    UserModel,
    audit: async () => {},
    actor: admin,
    targetId: 'user-1',
    input: { username: 'after', email: 'AFTER@EXAMPLE.COM', expectedVersion: 2 },
    mutation,
  });

  assert.deepEqual(update, { $set: { username: 'after', email: 'after@example.com' }, $inc: { __v: 1 } });
});

test('soft delete preserves the user record and blocks login', async () => {
  let update;
  const UserModel = {
    findById: async () => ({ _id: 'user-1', username: 'player', email: 'p@example.com', role: 'user', __v: 1 }),
    findOneAndUpdate: (_filter, document) => {
      update = document;
      return { select: async () => ({ _id: 'user-1', role: 'user', isBanned: true, deletedAt: new Date(), __v: 2 }) };
    },
  };

  await softDeleteManagedUser({ UserModel, audit: async () => {}, actor: admin, targetId: 'user-1', expectedVersion: 1, mutation });

  assert.equal(update.$set.isBanned, true);
  assert.ok(update.$set.deletedAt instanceof Date);
});

test('admin cannot update or delete an administrative account', async () => {
  const UserModel = { findById: async () => ({ _id: 'other-admin', role: 'admin', __v: 1 }) };

  await assert.rejects(
    updateManagedUser({ UserModel, actor: admin, targetId: 'other-admin', input: { username: 'changed', expectedVersion: 1 }, mutation }),
    (error) => error.code === 'ADMIN_PERMISSION_DENIED',
  );
  await assert.rejects(
    softDeleteManagedUser({ UserModel, actor: admin, targetId: 'other-admin', expectedVersion: 1, mutation }),
    (error) => error.code === 'ADMIN_PERMISSION_DENIED',
  );
});

test('super admin can create an admin but cannot delete themselves', async () => {
  const UserModel = { create: async (input) => ({ _id: 'admin-2', ...input }) };
  const created = await createManagedUser({
    UserModel,
    hashPassword: async () => 'hash',
    audit: async () => {},
    actor: superAdmin,
    input: { username: 'admin-2', email: 'admin2@example.com', password: 'temporary-pass', role: 'admin' },
    mutation,
  });
  assert.equal(created.role, 'admin');

  await assert.rejects(
    softDeleteManagedUser({ UserModel: {}, actor: superAdmin, targetId: 'root-1', expectedVersion: 1, mutation }),
    (error) => error.code === 'ADMIN_SELF_ACTION_DENIED',
  );
});
