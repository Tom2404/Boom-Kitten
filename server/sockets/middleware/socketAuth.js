const jwt = require('jsonwebtoken');

function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.user = {
        userId: decoded.userId || decoded.id,
        username: decoded.username,
        role: decoded.role,
      };
      socket.userId = socket.user.userId;
    }
  } catch (err) {
    // Ignore invalid tokens for guest connections
  }
  next();
}

module.exports = { socketAuthMiddleware };
