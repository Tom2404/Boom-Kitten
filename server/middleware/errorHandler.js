// Global API error handler for consistent JSON error responses.
function errorHandler(error, _req, res, _next) {
  const status = error.statusCode ?? 500;
  res.status(status).json({ message: error.message ?? 'Unexpected server error' });
}

module.exports = errorHandler;
