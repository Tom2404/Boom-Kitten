import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshAccessToken } from '../src/utils/authSession.js';

test('refreshAccessToken requests the HttpOnly session cookie and returns a new access token', async () => {
  let request;
  const accessToken = await refreshAccessToken(async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ accessToken: 'new-access-token' }), { status: 200 });
  }, 'https://api.boom-kitten.test');

  assert.equal(accessToken, 'new-access-token');
  assert.deepEqual(request, {
    url: 'https://api.boom-kitten.test/api/auth/refresh',
    options: { method: 'POST', credentials: 'include' },
  });
});

test('refreshAccessToken returns null when the refresh cookie is invalid', async () => {
  const accessToken = await refreshAccessToken(async () => new Response(JSON.stringify({ message: 'Invalid refresh token' }), { status: 401 }));
  assert.equal(accessToken, null);
});
