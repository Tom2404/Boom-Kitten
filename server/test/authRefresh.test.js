const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const bcrypt = require('bcrypt');

const authRoutes = require('../routes/auth');
const errorHandler = require('../middleware/errorHandler');

test('login stores only a hashed refresh session and rotates an HttpOnly refresh cookie', async () => {
  process.env.JWT_SECRET = 'auth-refresh-access-secret';
  process.env.JWT_REFRESH_SECRET = 'auth-refresh-cookie-secret';
  const user = {
    _id: { toString: () => 'user-1' },
    email: 'player@boom-kitten.local',
    username: 'player-one',
    role: 'user',
    passwordHash: await bcrypt.hash('correct-horse-battery-staple', 4),
    saveCount: 0,
    async save() { this.saveCount += 1; },
  };
  const UserModel = {
    findOne: () => ({ select: async () => user }),
    findById: () => ({ select: async () => user }),
  };
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes.createAuthRouter({ UserModel }));
  app.use(errorHandler);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const login = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'correct-horse-battery-staple' }),
    });
    const loginBody = await login.json();
    const firstCookie = login.headers.get('set-cookie');

    assert.equal(login.status, 200);
    assert.equal(typeof loginBody.accessToken, 'string');
    assert.equal(loginBody.refreshToken, undefined);
    assert.match(firstCookie, /refreshToken=/);
    assert.match(firstCookie, /HttpOnly/);
    assert.notEqual(user.refreshTokenHash, undefined);
    assert.notEqual(user.refreshTokenHash, firstCookie.match(/refreshToken=([^;]+)/)[1]);

    const firstHash = user.refreshTokenHash;
    const refresh = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: firstCookie },
    });
    const refreshBody = await refresh.json();
    const secondCookie = refresh.headers.get('set-cookie');

    assert.equal(refresh.status, 200);
    assert.equal(typeof refreshBody.accessToken, 'string');
    assert.match(secondCookie, /HttpOnly/);
    assert.notEqual(user.refreshTokenHash, firstHash);
    assert.equal(user.saveCount, 2);

    const logout = await fetch(`http://127.0.0.1:${port}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: secondCookie },
    });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /refreshToken=;/);
    assert.equal(user.refreshTokenHash, null);

    const reusedSession = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: secondCookie },
    });
    assert.equal(reusedSession.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('refresh rejects a token that does not match the stored session hash', async () => {
  process.env.JWT_SECRET = 'auth-refresh-access-secret';
  process.env.JWT_REFRESH_SECRET = 'auth-refresh-cookie-secret';
  const UserModel = {
    findById: () => ({ select: async () => ({ refreshTokenHash: 'different-hash' }) }),
  };
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes.createAuthRouter({ UserModel }));
  app.use(errorHandler);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, { method: 'POST', headers: { Cookie: 'refreshToken=not-a-jwt' } });
    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('refresh rejects a malformed encoded cookie without escaping the request handler', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes.createAuthRouter({ UserModel: {} }));
  app.use(errorHandler);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: 'refreshToken=%E0%A4%A' },
    });
    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
