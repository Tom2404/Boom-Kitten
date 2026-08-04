const test = require('node:test');
const assert = require('node:assert/strict');

const securityHeaders = require('../middleware/securityHeaders');

test('security headers disable framing, MIME sniffing, and Express disclosure', () => {
  const headers = {};
  let nextCalled = false;
  securityHeaders({}, { setHeader(name, value) { headers[name] = value; } }, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(headers['Content-Security-Policy'], "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(headers['Permissions-Policy'], 'camera=(), geolocation=(), microphone=()');
});
