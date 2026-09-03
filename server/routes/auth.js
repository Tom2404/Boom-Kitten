// Authentication routes for register/login/refresh/logout.
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getAccountRestriction } = require('../utils/accountStatus');
const { assertStrongPassword } = require('../services/accountService');
const { sendPasswordResetEmail: deliverPasswordResetEmail } = require('../services/passwordResetEmailService');

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_TOKEN_FIELDS = '+refreshTokenHash +refreshTokenExpiresAt';
const RESET_TOKEN_FIELDS = '+passwordResetTokenHash +passwordResetExpiresAt +refreshTokenHash +refreshTokenExpiresAt';
const RESET_MESSAGE = 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.';
const RESET_WINDOW_MS = 15 * 60 * 1000;

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hasRefreshTokenHash(user, token) {
  if (!user?.refreshTokenHash || !token) return false;
  const expected = Buffer.from(user.refreshTokenHash, 'utf8');
  const actual = Buffer.from(hashRefreshToken(token), 'utf8');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function getRefreshCookie(req) {
  const header = req.headers.cookie || '';
  const entry = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${REFRESH_COOKIE}=`));
  if (!entry) return '';
  try {
    return decodeURIComponent(entry.slice(REFRESH_COOKIE.length + 1));
  } catch (_error) {
    return '';
  }
}

function refreshCookieOptions(expiresAt) {
  const options = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
  };
  if (expiresAt) options.expires = expiresAt;
  return options;
}

function makeAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' },
  );
}

function makeRefreshToken(user) {
  const token = jwt.sign({ sub: user._id.toString(), jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  });
  const { exp } = jwt.decode(token);
  return { token, expiresAt: new Date(exp * 1000) };
}

async function createRefreshSession(user) {
  const session = makeRefreshToken(user);
  user.refreshTokenHash = hashRefreshToken(session.token);
  user.refreshTokenExpiresAt = session.expiresAt;
  await user.save();
  return session;
}

function clearRefreshSession(user) {
  user.refreshTokenHash = null;
  user.refreshTokenExpiresAt = null;
  return user.save();
}

function createAuthRouter({ UserModel = User, sendPasswordResetEmail = deliverPasswordResetEmail } = {}) {
  const router = express.Router();
  // ponytail: per-process throttling is sufficient for one server; replace with a shared store when horizontally scaling.
  const forgotAttempts = new Map();

  function canRequestReset(ip, now = Date.now()) {
    const current = forgotAttempts.get(ip);
    if (!current || current.resetAt <= now) {
      forgotAttempts.set(ip, { count: 1, resetAt: now + RESET_WINDOW_MS });
      return true;
    }
    current.count += 1;
    return current.count <= 5;
  }

  router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, and password are required' });
    }
    assertStrongPassword(password);

    const exists = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const role = 'user';
    const user = await UserModel.create({ username, email, passwordHash, role });
    return res.status(201).json({ id: user._id, username: user.username, email: user.email, role: user.role });
  } catch (error) {
    return next(error);
  }
  });

  router.post('/login', async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (typeof email === 'string' && email ? email : typeof username === 'string' ? username : '').trim();
    if (!identifier || !password) return res.status(400).json({ message: 'Email or username and password are required' });

    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { $or: [{ username: identifier }, { email: identifier.toLowerCase() }] };
    const user = await UserModel.findOne(query).select(REFRESH_TOKEN_FIELDS);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const restriction = getAccountRestriction(user);
    if (restriction) return res.status(403).json({ message: restriction.message, code: restriction.type === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_BANNED' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = makeAccessToken(user);
    const refreshSession = await createRefreshSession(user);
    res.cookie(REFRESH_COOKIE, refreshSession.token, refreshCookieOptions(refreshSession.expiresAt));
    return res.json({ accessToken });
  } catch (error) {
    return next(error);
  }
  });

  router.post('/forgot-password', async (req, res, next) => {
    const genericResponse = { success: true, message: RESET_MESSAGE };
    if (!canRequestReset(req.ip)) return res.status(202).json(genericResponse);
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || email.length > 254) return res.status(202).json(genericResponse);

    try {
      const user = await UserModel.findOne({ email }).select(RESET_TOKEN_FIELDS);
      if (!user) return res.status(202).json(genericResponse);

      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetTokenHash = hashRefreshToken(token);
      user.passwordResetExpiresAt = new Date(Date.now() + RESET_WINDOW_MS);
      await user.save();
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:2404'}?resetToken=${encodeURIComponent(token)}`;
      try {
        await sendPasswordResetEmail({ to: user.email, resetUrl });
      } catch (_error) {
        process.stderr.write('Password reset delivery failed.\n');
      }
      return res.status(202).json(process.env.NODE_ENV === 'development' ? { ...genericResponse, resetUrl } : genericResponse);
    } catch (error) {
      return next(error);
    }
  });

  router.post('/reset-password', async (req, res, next) => {
    try {
      const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
      assertStrongPassword(req.body?.password);
      if (!token || token.length > 128) return res.status(400).json({ message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' });
      const user = await UserModel.findOne({
        passwordResetTokenHash: hashRefreshToken(token),
        passwordResetExpiresAt: { $gt: new Date() },
      }).select(`${RESET_TOKEN_FIELDS} +passwordHash`);
      if (!user) return res.status(400).json({ message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' });

      user.passwordHash = await bcrypt.hash(req.body.password, 12);
      user.passwordResetTokenHash = null;
      user.passwordResetExpiresAt = null;
      user.refreshTokenHash = null;
      user.refreshTokenExpiresAt = null;
      await user.save();
      res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
      return res.json({ success: true, message: 'Mật khẩu đã được đặt lại.' });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/refresh', async (req, res) => {
    const refreshToken = getRefreshCookie(req);
    if (!refreshToken) return res.status(401).json({ message: 'Invalid refresh token' });

    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await UserModel.findById(payload.sub).select(REFRESH_TOKEN_FIELDS);
      if (!user || !hasRefreshTokenHash(user, refreshToken) || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt <= new Date()) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      const restriction = getAccountRestriction(user);
      if (restriction) return res.status(403).json({ message: restriction.message, code: restriction.type === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_BANNED' });
      const refreshSession = await createRefreshSession(user);
      res.cookie(REFRESH_COOKIE, refreshSession.token, refreshCookieOptions(refreshSession.expiresAt));
      return res.json({ accessToken: makeAccessToken(user) });
    } catch (_error) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  });

  router.post('/logout', async (req, res) => {
    const refreshToken = getRefreshCookie(req);
    try {
      const payload = refreshToken && jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = payload ? await UserModel.findById(payload.sub).select(REFRESH_TOKEN_FIELDS) : null;
      if (user && hasRefreshTokenHash(user, refreshToken)) await clearRefreshSession(user);
    } catch (_error) {
      // Logging out remains successful even when the cookie is expired or malformed.
    }
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    res.json({ success: true });
  });

  return router;
}

module.exports = createAuthRouter();
module.exports.createAuthRouter = createAuthRouter;
module.exports.hashRefreshToken = hashRefreshToken;
