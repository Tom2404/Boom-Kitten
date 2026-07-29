const test = require('node:test');
const assert = require('node:assert/strict');

const errorHandler = require('../middleware/errorHandler');
const { ApiError } = require('../utils/apiResponse');

function invoke(error, requestId = 'req-errors') {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  errorHandler(error, { requestId }, res, () => {});
  return res;
}

test('serializes expected API errors with code, details, and request id', () => {
  const response = invoke(new ApiError(422, 'VALIDATION_ERROR', 'Payload không hợp lệ', {
    fields: { reason: 'Bắt buộc' },
  }));

  assert.equal(response.statusCode, 422);
  assert.deepEqual(response.body, {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Payload không hợp lệ',
      details: { fields: { reason: 'Bắt buộc' } },
      requestId: 'req-errors',
    },
  });
});

test('does not expose unexpected internal error messages', () => {
  const response = invoke(new Error('mongodb://user:password@secret-host'));

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Đã xảy ra lỗi máy chủ.',
      requestId: 'req-errors',
    },
  });
});
