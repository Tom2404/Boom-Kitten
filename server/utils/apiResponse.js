function sendApiError(res, status, code, message, options = {}) {
  const error = { code, message };
  if (options.details !== undefined) error.details = options.details;
  if (options.requestId) error.requestId = options.requestId;
  return res.status(status).json({ error });
}

class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = { ApiError, sendApiError };
