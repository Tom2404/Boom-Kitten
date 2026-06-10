// JWT auth middleware to verify access tokens and attach req.user.
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing access token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, username: payload.username };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
}

module.exports = authMiddleware;
