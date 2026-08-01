import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('Catalog Admin persists framing and blocks unconfirmed oversized assets', () => {
  const catalog = read('../src/pages/admin/CatalogPanel.jsx');

  assert.match(catalog, /assetTransform:\s*normalizeAssetTransform\(item\.assetTransform\)/);
  assert.match(catalog, /assetTransform:\s*item\.assetTransform/);
  assert.match(catalog, /requiresFraming/);
  assert.match(catalog, /fitConfirmed/);
  assert.match(catalog, /AssetPositionEditor/);
});

test('asset editor supports pointer drag, zoom, reset, and explicit confirmation', () => {
  const editor = read('../src/pages/admin/AssetPositionEditor.jsx');

  assert.match(editor, /onPointerDown/);
  assert.match(editor, /onPointerMove/);
  assert.match(editor, /type="range"/);
  assert.match(editor, /Đặt lại/);
  assert.match(editor, /Xác nhận căn khung/);
  assert.match(editor, /Không thể tải asset như một hình ảnh hợp lệ/);
});

test('runtime renderers consume the saved transform for every equipment slot', () => {
  const gameTable = read('../src/pages/Game/components/GameTable.jsx');
  const deckPile = read('../src/components/DeckPile.jsx');
  const playerAvatar = read('../src/components/PlayerAvatar.jsx');
  const profile = read('../src/pages/Profile.jsx');
  const waitingRoom = read('../src/pages/Game/views/WaitingRoomView.jsx');
  const handDock = read('../src/pages/Game/components/PlayerHandDock.jsx');
  const resultOverlay = read('../src/pages/Game/Modals/GameEndedOverlay.jsx');

  assert.match(gameTable, /getFieldTransformStyle/);
  assert.match(deckPile, /getAssetTransformStyle\(protectorTransform\)/);
  for (const source of [playerAvatar, profile, waitingRoom, handDock, resultOverlay]) {
    assert.match(source, /getAssetTransformStyle/);
  }
});
