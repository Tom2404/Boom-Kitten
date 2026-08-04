const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const bcrypt = require('bcrypt');

const authRoutes = require('../routes/auth');
const errorHandler = require('../middleware/errorHandler');

async function withAuthServer(UserModel, sendPasswordResetEmail, run) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes.createAuthRouter({ UserModel, sendPasswordResetEmail }));
  app.use(errorHandler);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('forgot password stores only a hash and reset consumes the token once', async () => {
  process.env.CLIENT_URL = 'http://localhost:2404';
  process.env.NODE_ENV = 'test';
  const user = {
    _id: 'user-reset-1',
    email: 'player@boom-kitten.local',
    passwordHash: await bcrypt.hash('old-password-123', 4),
    refreshTokenHash: 'active-session',
    async save() { this.saveCount = (this.saveCount || 0) + 1; },
  };
  const UserModel = {
    findOne(query) {
      if (query.email) return { select: async () => (query.email === user.email ? user : null) };
      if (query.passwordResetTokenHash) {
        const valid = query.passwordResetTokenHash === user.passwordResetTokenHash
          && query.passwordResetExpiresAt.$gt < user.passwordResetExpiresAt;
        return { select: async () => (valid ? user : null) };
      }
      return { select: async () => null };
    },
  };
  let delivered;

  await withAuthServer(UserModel, async (payload) => { delivered = payload; }, async (baseUrl) => {
    const forgot = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    });
    const forgotBody = await forgot.json();
    const token = new URL(delivered.resetUrl).searchParams.get('resetToken');

    assert.equal(forgot.status, 202);
    assert.equal(forgotBody.success, true);
    assert.equal(typeof token, 'string');
    assert.notEqual(user.passwordResetTokenHash, token);
    assert.equal(user.saveCount, 1);

    const reset = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: 'replacement-password-123' }),
    });
    assert.equal(reset.status, 200);
    assert.equal(await bcrypt.compare('replacement-password-123', user.passwordHash), true);
    assert.equal(user.passwordResetTokenHash, null);
    assert.equal(user.refreshTokenHash, null);

    const replay = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: 'another-password-123' }),
    });
    assert.equal(replay.status, 400);
  });
});

test('forgot password uses the same generic response for unknown emails', async () => {
  process.env.NODE_ENV = 'production';
  const UserModel = { findOne: () => ({ select: async () => null }) };
  let deliveryCount = 0;

  await withAuthServer(UserModel, async () => { deliveryCount += 1; }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing@boom-kitten.local' }),
    });
    const body = await response.json();
    assert.equal(response.status, 202);
    assert.deepEqual(body, { success: true, message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.' });
    assert.equal(deliveryCount, 0);
  });
});

test('registration enforces the same strong password policy as password changes and resets', async () => {
  let createCalls = 0;
  const UserModel = {
    findOne: async () => null,
    create: async () => { createCalls += 1; return {}; },
  };

  await withAuthServer(UserModel, async () => {}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'kitten', email: 'kitten@example.com', password: 'short' }),
    });
    assert.equal(response.status, 422);
    assert.equal(createCalls, 0);
  });
});
