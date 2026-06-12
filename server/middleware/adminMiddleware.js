// Middleware to verify req.user has admin role.
function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  return next();
}

module.exports = adminMiddleware;
