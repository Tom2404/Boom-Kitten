const { sendApiError } = require('../utils/apiResponse');

function errorHandler(error, req, res, _next) {
  if (error?.isOperational) {
    return sendApiError(
      res,
      error.statusCode,
      error.code,
      error.message,
      { details: error.details, requestId: req.requestId },
    );
  }

  return sendApiError(
    res,
    500,
    'INTERNAL_ERROR',
    'Đã xảy ra lỗi máy chủ.',
    { requestId: req.requestId },
  );
}

module.exports = errorHandler;
