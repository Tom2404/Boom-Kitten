import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('shared admin feedback announces errors and supports localized loading labels', async () => {
  const ui = await read('../src/pages/admin/ui.jsx');

  assert.match(ui, /tone === 'danger' \? 'alert' : 'status'/);
  assert.match(ui, /SkeletonBlock\(\{ rows = 3, label/);
  assert.match(ui, /aria-label=\{label\}/);
});

test('admin shell exposes a keyboard skip link and content target', async () => {
  const shell = await read('../src/pages/admin/AdminPage.jsx');

  assert.match(shell, /href="#admin-content"/);
  assert.match(shell, /id="admin-content"/);
});

test('player selection communicates single-select behavior without emoji actions', async () => {
  const players = await read('../src/pages/admin/PlayersPanel.jsx');

  assert.match(players, /type="radio"/);
  assert.doesNotMatch(players, /＋|🪙/);
  assert.match(players, /material-symbols-outlined/);
});
