const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const adminRoutes = require('../routes/admin');
const errorHandler = require('../middleware/errorHandler');

async function withAdminServer(role, run) {
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => ({
      _id: { toString: () => 'admin-1' },
      username: 'ops-cat',
      email: 'ops@boom-kitten.local',
      role,
      isBanned: false,
    }),
  });

  process.env.JWT_SECRET = 'admin-route-test-secret';
  const token = jwt.sign(
    { sub: 'admin-1', username: 'ops-cat', email: 'ops@boom-kitten.local', role: 'admin' },
    process.env.JWT_SECRET,
  );

  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  app.use(errorHandler);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    await run({ baseUrl: `http://127.0.0.1:${port}`, token });
  } finally {
    User.findById = originalFindById;
    await new Promise((resolve) => server.close(resolve));
  }
}

test('GET /api/admin/me returns current role, permissions, and policy', async () => {
  await withAdminServer('operator', async ({ baseUrl, token }) => {
    const response = await fetch(`${baseUrl}/api/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.admin.role, 'operator');
    assert.equal(body.data.permissions.includes('economy.adjust'), true);
    assert.equal(body.data.permissions.includes('players.role.write'), false);
    assert.deepEqual(body.data.policy.maxCurrencyAdjustment, { coin: 10000 });
    assert.equal(body.data.permissions.includes('players.elo.write'), false);
  });
});

test('route-level permission blocks analyst economy mutations before business logic', async () => {
  await withAdminServer('analyst', async ({ baseUrl, token }) => {
    const response = await fetch(`${baseUrl}/api/admin/users/player-1/currency`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currency: 'coin', amount: 100, operation: 'add', reason: 'test' }),
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error.code, 'ADMIN_PERMISSION_DENIED');
    assert.equal(body.error.details.permission, 'economy.adjust');
  });
});

test('does not register legacy season mutation or reset routes', () => {
  const paths = adminRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);

  assert.equal(paths.some((path) => String(path).includes('season')), false);
});
