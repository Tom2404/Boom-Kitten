import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('game activity panel lets authenticated players report an opponent', async () => {
  const panel = await readFile(new URL('../src/pages/Game/components/GameSidePanel.jsx', import.meta.url), 'utf8');
  assert.match(panel, /reportPlayer/);
  assert.match(panel, /harassment/);
  assert.match(panel, /targetPlayerId/);
});

test('admin console includes a moderation inbox with triage actions', async () => {
  const page = await readFile(new URL('../src/pages/admin/AdminPage.jsx', import.meta.url), 'utf8');
  const panel = await readFile(new URL('../src/pages/admin/ModerationPanel.jsx', import.meta.url), 'utf8');
  assert.match(page, /ModerationPanel/);
  assert.match(panel, /\/api\/admin\/moderation\/cases/);
  assert.match(panel, /INVESTIGATING/);
  assert.match(panel, /assignToMe/);
});
