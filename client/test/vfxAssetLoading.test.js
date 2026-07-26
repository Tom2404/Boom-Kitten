import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the VFX loader does not preload every card image into GPU memory', async () => {
  const source = await readFile(new URL('../src/vfx/AssetLoader.js', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /assets\/cards|import\.meta\.glob/);
  assert.match(source, /REQUIRED_VFX_ASSET_URLS/);
});

test('the lobby does not initialize the gameplay VFX canvas', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.match(source, /const shouldRenderVfx = page === 'Game' && activeRoom\?\.status === 'playing';/);
  assert.match(source, /\{shouldRenderVfx && \(/);
});
