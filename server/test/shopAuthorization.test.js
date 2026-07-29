const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const shopRoutes = require('../routes/shop');
const errorHandler = require('../middleware/errorHandler');

test('removed legacy roles cannot mutate the shop catalog through the API', async () => {
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => ({
      _id: { toString: () => 'analyst-1' },
      username: 'read-only',
      email: 'read-only@boom-kitten.local',
      role: 'analyst',
      isBanned: false,
    }),
  });

  process.env.JWT_SECRET = 'shop-route-test-secret';
  const token = jwt.sign({ sub: 'analyst-1', role: 'analyst' }, process.env.JWT_SECRET);
  const app = express();
  app.use(express.json());
  app.use('/api/shop', shopRoutes);
  app.use(errorHandler);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/shop/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Must not exist', type: 'skin' }),
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error.code, 'ADMIN_PERMISSION_DENIED');
    assert.equal(body.error.details, undefined);
  } finally {
    User.findById = originalFindById;
    await new Promise((resolve) => server.close(resolve));
  }
});
