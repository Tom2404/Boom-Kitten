import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EQUIPMENT_SLOTS,
  getEquipmentAction,
  getEquippedAssetUrl,
  getProtectorStackSize,
  isOwnedItem,
} from '../src/utils/shopEquipment.js';
import { translations } from '../src/utils/translations.js';

test('maps the three V1 item types to stable equipment slots', () => {
  assert.deepEqual(EQUIPMENT_SLOTS, [
    { slot: 'protector', type: 'protector' },
    { slot: 'avatarFrame', type: 'avatar_frame' },
    { slot: 'field', type: 'field' },
  ]);
});

test('shop item action moves from buy to equip to equipped', () => {
  const item = { _id: 'frame-1', type: 'avatar_frame' };
  assert.equal(getEquipmentAction(item, { ownedItemIds: [], equipped: {} }), 'buy');
  assert.equal(getEquipmentAction(item, {
    ownedItemIds: ['frame-1'],
    equipped: {},
  }), 'equip');
  assert.equal(getEquipmentAction(item, {
    ownedItemIds: ['frame-1'],
    equipped: { avatarFrame: { id: 'frame-1' } },
  }), 'equipped');
});

test('ownership compares stable ids and equipped assets prefer assetUrl', () => {
  assert.equal(isOwnedItem({ _id: 'field-1' }, ['field-1']), true);
  assert.equal(isOwnedItem({ _id: 'field-2' }, ['field-1']), false);
  assert.equal(getEquippedAssetUrl({ assetUrl: '/runtime.webp', imageUrl: '/thumb.webp' }), '/runtime.webp');
  assert.equal(getEquippedAssetUrl({ imageUrl: '/thumb.webp' }), '/thumb.webp');
  assert.equal(getEquippedAssetUrl(null), '');
});

test('opponent Protector stack stays representative instead of scaling with hand size', () => {
  assert.equal(getProtectorStackSize(0), 0);
  assert.equal(getProtectorStackSize(1), 1);
  assert.equal(getProtectorStackSize(2), 2);
  assert.equal(getProtectorStackSize(8), 3);
  assert.equal(getProtectorStackSize(55), 3);
  assert.equal(getProtectorStackSize('invalid'), 0);
});

test('equipment loadout copy is complete in Vietnamese and English', () => {
  const keys = [
    'shop_loadout_title',
    'shop_loadout_desc',
    'shop_slot_protector',
    'shop_slot_avatar_frame',
    'shop_slot_field',
    'shop_equip',
    'shop_equipping',
    'shop_equipped',
    'shop_unequip',
    'shop_unequipping',
    'shop_equipment_update_fail',
    'shop_error_ITEM_NOT_OWNED',
    'shop_error_SLOT_TYPE_MISMATCH',
  ];
  for (const language of ['vi', 'en']) {
    for (const key of keys) {
      assert.equal(typeof translations[language][key], 'string', `${language}.${key}`);
      assert.notEqual(translations[language][key].trim(), '', `${language}.${key}`);
    }
  }
});
