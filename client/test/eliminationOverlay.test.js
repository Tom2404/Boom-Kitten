import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('eliminated player overlay offers watching or leaving the active room', async () => {
  const [overlay, game] = await Promise.all([
    read('../src/pages/Game/Modals/EliminatedPlayerOverlay.jsx'),
    read('../src/pages/Game.jsx'),
  ]);

  assert.match(overlay, /role="dialog"/);
  assert.match(overlay, /onContinue/);
  assert.match(overlay, /onLeave/);
  assert.match(overlay, /eliminated_continue/);
  assert.match(overlay, /eliminated_leave/);
  assert.match(game, /EliminatedPlayerOverlay/);
  assert.match(game, /shouldShowEliminationOverlay/);
});
