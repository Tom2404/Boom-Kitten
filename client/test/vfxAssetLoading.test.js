import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { REQUIRED_VFX_ASSET_URLS } from '../src/vfx/config/vfxAssets.js';

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

test('the waiting room preloads the VFX bundle and required assets', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.match(source, /activeRoom\?\.status !== 'waiting'/);
  assert.match(source, /loadVfxOverlay\(\)/);
  assert.match(source, /REQUIRED_VFX_ASSET_URLS\.map/);
});

test('the VFX overlay cancels StrictMode rehearsal before Pixi initialization', async () => {
  const source = await readFile(new URL('../src/components/VFXOverlay.jsx', import.meta.url), 'utf8');

  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /cancelAnimationFrame/);
  assert.match(source, /vfxManager\.init/);
});

test('action-card presentation no longer preloads legacy PNG cinematics', () => {
  assert.deepEqual(REQUIRED_VFX_ASSET_URLS, ['/vfx/explosion-sheet.png']);
});
