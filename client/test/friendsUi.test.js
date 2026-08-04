import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('friends page supports search, request inbox, accept, decline, and removal', async () => {
  const source = await readFile(new URL('../src/pages/Friends.jsx', import.meta.url), 'utf8');
  for (const contract of ['/api/users/search', '/friendships', '/request', '/accept', '/decline', "'DELETE'"]) {
    assert.match(source, new RegExp(contract.replaceAll('/', '\\/')));
  }
});

test('waiting room can invite accepted friends and App handles room invitations', async () => {
  const waitingRoom = await readFile(new URL('../src/pages/Game/views/WaitingRoomView.jsx', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(waitingRoom, /inviteFriend/);
  assert.match(waitingRoom, /room:invite/);
  assert.match(app, /room:invitation/);
  assert.match(app, /room:join/);
});
