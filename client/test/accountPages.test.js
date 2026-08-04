import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('account navigation exposes forgot and reset password screens', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const login = await readFile(new URL('../src/pages/Login.jsx', import.meta.url), 'utf8');
  assert.match(app, /ForgotPassword/);
  assert.match(app, /ResetPassword/);
  assert.match(app, /resetToken/);
  assert.match(login, /setPage\('ForgotPassword'\)/);
});

test('registration and reset forms share the server password length contract and reset removes its token from the URL', async () => {
  const register = await readFile(new URL('../src/pages/Register.jsx', import.meta.url), 'utf8');
  const reset = await readFile(new URL('../src/pages/ResetPassword.jsx', import.meta.url), 'utf8');
  assert.match(register, /minLength="10"/);
  assert.match(register, /maxLength="72"/);
  assert.match(reset, /useState\(\(\) =>/);
  assert.match(reset, /history\.replaceState/);
});

test('profile uses preset avatars and provides an authenticated password change form', async () => {
  const profile = await readFile(new URL('../src/pages/Profile.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(profile, /FileReader|type="file"/);
  assert.match(profile, /\/api\/users\/me\/change-password/);
  assert.match(profile, /currentPassword/);
  assert.match(profile, /newPassword/);
});
