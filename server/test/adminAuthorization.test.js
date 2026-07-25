const test = require('node:test');
const assert = require('node:assert/strict');

const adminMiddlewareModule = require('../middleware/adminMiddleware');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createUserModel(user) {
  return {
    findById() {
      return { select: async () => user };
    },
  };
}

test('loads the current database role instead of trusting a stale JWT role', async () => {
  const middleware = adminMiddlewareModule.createAdminMiddleware({
    UserModel: createUserModel({ _id: 'admin-1', username: 'Minh', email: 'm@example.com', role: 'analyst', isBanned: false }),
  });
  const req = { user: { id: 'admin-1', role: 'admin' } };
  const res = createResponse();
  let nextCalled = false;

  await middleware(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.admin.role, 'analyst');
  assert.equal(req.user.role, 'analyst');
  assert.equal(req.admin.permissions.includes('economy.adjust'), false);
});

test('accepts a legacy admin record as super_admin during migration', async () => {
  const middleware = adminMiddlewareModule.createAdminMiddleware({
    UserModel: createUserModel({ _id: 'admin-1', username: 'Lan', email: 'l@example.com', role: 'admin', isBanned: false }),
  });
  const req = { user: { id: 'admin-1', role: 'admin' } };
  const res = createResponse();

  await middleware(req, res, () => {});

  assert.equal(req.admin.role, 'super_admin');
  assert.equal(req.admin.permissions.includes('live_ops.publish'), true);
});

test('rejects a non-admin database record with the v2 error envelope', async () => {
  const middleware = adminMiddlewareModule.createAdminMiddleware({
    UserModel: createUserModel({ _id: 'user-1', username: 'User', role: 'user', isBanned: false }),
  });
  const req = { user: { id: 'user-1', role: 'admin' }, requestId: 'req-403' };
  const res = createResponse();

  await middleware(req, res, () => assert.fail('next must not be called'));

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    error: {
      code: 'ADMIN_PERMISSION_DENIED',
      message: 'Bạn không có quyền truy cập khu vực quản trị.',
      requestId: 'req-403',
    },
  });
});

test('rejects a banned administrator even when the role is valid', async () => {
  const middleware = adminMiddlewareModule.createAdminMiddleware({
    UserModel: createUserModel({ _id: 'admin-1', username: 'Blocked', role: 'operator', isBanned: true }),
  });
  const req = { user: { id: 'admin-1', role: 'operator' } };
  const res = createResponse();

  await middleware(req, res, () => assert.fail('next must not be called'));

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error.code, 'ADMIN_ACCOUNT_DISABLED');
});

test('permission middleware allows reads and blocks mutations for analysts', () => {
  const readMiddleware = adminMiddlewareModule.requireAdminPermission('players.read');
  const writeMiddleware = adminMiddlewareModule.requireAdminPermission('economy.adjust');
  const req = { admin: { role: 'analyst', permissions: ['players.read'] }, requestId: 'req-perm' };
  const readRes = createResponse();
  const writeRes = createResponse();
  let readAllowed = false;

  readMiddleware(req, readRes, () => { readAllowed = true; });
  writeMiddleware(req, writeRes, () => assert.fail('write must not be allowed'));

  assert.equal(readAllowed, true);
  assert.equal(writeRes.statusCode, 403);
  assert.equal(writeRes.body.error.code, 'ADMIN_PERMISSION_DENIED');
  assert.equal(writeRes.body.error.details.permission, 'economy.adjust');
});
