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

test('Protector previews use the shared 5:7 card frame in Wardrobe and Admin', () => {
  const editor = read('../src/pages/admin/AssetPositionEditor.jsx');
  const wardrobeAsset = read('../src/components/wardrobe/WardrobeAsset.jsx');

  assert.match(editor, /protector:\s*'aspect-\[5\/7\] max-w-48'/);
  assert.match(wardrobeAsset, /protector:.*aspect:\s*'aspect-\[5\/7\]'/);

  const itemCard = read('../src/components/wardrobe/WardrobeItemCard.jsx');
  assert.match(itemCard, /item\.type === 'protector' \? 'h-full w-auto' : 'w-full max-w-\[9rem\]'/);
});

test('runtime renderers consume the saved transform for every equipment slot', () => {
  const gameTable = read('../src/pages/Game/components/GameTable.jsx');
  const deckPile = read('../src/components/DeckPile.jsx');
  const playerAvatar = read('../src/components/PlayerAvatar.jsx');
  const profile = read('../src/pages/Profile.jsx');
  const waitingRoom = read('../src/pages/Game/views/WaitingRoomView.jsx');
  const handDock = read('../src/pages/Game/components/PlayerHandDock.jsx');
  const resultOverlay = read('../src/pages/Game/Modals/GameEndedOverlay.jsx');
  const shop = read('../src/pages/Shop.jsx');

  assert.match(gameTable, /getFieldTransformStyle/);
  assert.match(deckPile, /getAssetTransformStyle\(protectorTransform\)/);
  for (const source of [playerAvatar, profile, waitingRoom, handDock, resultOverlay, shop]) {
    assert.match(source, /getAssetTransformStyle/);
  }
  assert.match(shop, /aspectRatio:\s*'0\.716 \/ 1'/);
  assert.match(shop, /object-cover/);
});
