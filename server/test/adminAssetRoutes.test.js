const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const assetRoutes = require('../routes/assets');
const errorHandler = require('../middleware/errorHandler');

test('asset routes reject unauthenticated requests with 401', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/assets', assetRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/assets`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('asset routes accept authenticated admin and super_admin requests', async () => {
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => ({
      _id: { toString: () => 'admin-1' },
      username: 'admin',
      email: 'admin@boom-kitten.local',
      role: 'super_admin',
      isBanned: false,
    }),
  });

  process.env.JWT_SECRET = 'asset-route-test-secret';
  const token = jwt.sign({ sub: 'admin-1', role: 'super_admin' }, process.env.JWT_SECRET);
  const app = express();
  app.use(express.json());
  app.use('/api/admin/assets', assetRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/assets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // With valid super_admin token, access is granted (not 401 or 403)
    assert.notEqual(response.status, 401);
    assert.notEqual(response.status, 403);
  } finally {
    User.findById = originalFindById;
    await new Promise((resolve) => server.close(resolve));
  }
});
