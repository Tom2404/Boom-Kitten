const test = require('node:test');
const assert = require('node:assert/strict');

const { createRequestContextMiddleware } = require('../middleware/requestContext');

function runMiddleware(headerValue, generateId = () => 'generated-id') {
  const req = { get: () => headerValue };
  const headers = {};
  const res = { setHeader: (name, value) => { headers[name] = value; } };
  let nextCalled = false;

  createRequestContextMiddleware({ generateId })(req, res, () => { nextCalled = true; });
  return { req, headers, nextCalled };
}

test('preserves a safe client request id for cross-service tracing', () => {
  const result = runMiddleware('adm_01J7-test.retry');

  assert.equal(result.req.requestId, 'adm_01J7-test.retry');
  assert.equal(result.headers['X-Request-Id'], 'adm_01J7-test.retry');
  assert.equal(result.nextCalled, true);
});

test('replaces missing or unsafe request ids', () => {
  assert.equal(runMiddleware(undefined).req.requestId, 'generated-id');
  assert.equal(runMiddleware('bad id with spaces').req.requestId, 'generated-id');
  assert.equal(runMiddleware('x'.repeat(129)).req.requestId, 'generated-id');
});
