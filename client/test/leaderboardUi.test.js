import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('leaderboard page renders the public Top 20 contract with loading, error, and empty states', async () => {
  const source = await readFile(new URL('../src/pages/Leaderboard.jsx', import.meta.url), 'utf8');
  assert.match(source, /\/api\/leaderboard/);
  assert.match(source, /Top 20/);
  for (const field of ['rating', 'wins', 'losses', 'winRate']) assert.match(source, new RegExp(field));
  assert.match(source, /loading/);
  assert.match(source, /error/);
  assert.match(source, /rows\.length === 0/);
});

test('leaderboard is registered in App and player navigation', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const nav = await readFile(new URL('../src/components/Navbar.jsx', import.meta.url), 'utf8');
  assert.match(app, /Leaderboard/);
  assert.match(nav, /page: 'Leaderboard'/);
});
