const test = require('node:test');
const assert = require('node:assert/strict');

const {
  SHOPPABLE_TYPES,
  buildEquippedCosmetics,
  equipCosmetic,
  isItemAvailableForPurchase,
  isSafeAssetUrl,
  purchaseCosmetic,
  toPublicCosmetic,
} = require('../services/shopEquipmentService');

test('only V1 cosmetics are purchasable and expired items stay unavailable', () => {
  assert.deepEqual([...SHOPPABLE_TYPES], ['protector', 'avatar_frame', 'field']);
  assert.equal(isItemAvailableForPurchase({
    type: 'protector',
    isActive: true,
    isLimited: false,
  }), true);
  assert.equal(isItemAvailableForPurchase({
    type: 'skin',
    isActive: true,
    isLimited: false,
  }), false);
  assert.equal(isItemAvailableForPurchase({
    type: 'field',
    isActive: true,
    isLimited: true,
    availableUntil: new Date('2026-01-01T00:00:00.000Z'),
  }, new Date('2026-01-02T00:00:00.000Z')), false);
});

test('cosmetic assets accept HTTPS and same-origin paths only', () => {
  assert.equal(isSafeAssetUrl('https://cdn.example.com/frame.webp'), true);
  assert.equal(isSafeAssetUrl('/assets/cosmetics/frame.webp'), true);
  assert.equal(isSafeAssetUrl('javascript:alert(1)'), false);
  assert.equal(isSafeAssetUrl('data:image/svg+xml;base64,abc'), false);
  assert.equal(isSafeAssetUrl('http://cdn.example.com/frame.webp'), false);
});

test('public cosmetic descriptor uses previewUrl and falls back to imageUrl', () => {
  assert.deepEqual(toPublicCosmetic({
    _id: 'frame-1',
    name: 'Gold Frame',
    type: 'avatar_frame',
    rarity: 'epic',
    imageUrl: '/thumb.webp',
    previewUrl: '/frame.webp',
    assetTransform: { scale: 1.5, x: 20, y: -10 },
  }), {
    _id: 'frame-1',
    id: 'frame-1',
    name: 'Gold Frame',
    type: 'avatar_frame',
    rarity: 'epic',
    imageUrl: '/thumb.webp',
    previewUrl: '/frame.webp',
    assetUrl: '/frame.webp',
    assetTransform: { scale: 1.5, x: 20, y: -10 },
  });

  assert.equal(toPublicCosmetic({
    _id: 'field-1',
    name: 'Default Field',
    type: 'field',
    imageUrl: '/field.webp',
  }).assetUrl, '/field.webp');
});

test('public cosmetic descriptor defaults and clamps asset framing', () => {
  assert.deepEqual(toPublicCosmetic({
    _id: 'default-transform',
    name: 'Default',
    type: 'protector',
    imageUrl: '/default.webp',
  }).assetTransform, { scale: 1, x: 0, y: 0 });

  assert.deepEqual(toPublicCosmetic({
    _id: 'clamped-transform',
    name: 'Clamped',
    type: 'field',
    imageUrl: '/field.webp',
    assetTransform: { scale: 0.1, x: -100, y: 100 },
  }).assetTransform, { scale: 0.5, x: -50, y: 50 });
});

test('equipment response resolves one public item per slot', () => {
  const items = [
    { _id: 'p-1', name: 'Protector', type: 'protector', imageUrl: '/p.webp' },
    { _id: 'f-1', name: 'Frame', type: 'avatar_frame', imageUrl: '/f.webp' },
  ];
  assert.deepEqual(buildEquippedCosmetics({
    protector: 'p-1',
    avatarFrame: 'f-1',
    field: null,
  }, items), {
    protector: toPublicCosmetic(items[0]),
    avatarFrame: toPublicCosmetic(items[1]),
    field: null,
  });
});

test('equip rejects an item the user does not own', async () => {
  const user = {
    _id: 'user-1',
    ownedItemIds: [],
    equippedCosmetics: {},
    save: async () => user,
  };

  await assert.rejects(
    equipCosmetic({
      userId: 'user-1',
      slot: 'avatarFrame',
      itemId: 'frame-1',
      UserModel: { findById: async () => user },
      ShopItemModel: {
        findById: async () => ({
          _id: 'frame-1',
          name: 'Gold Frame',
          type: 'avatar_frame',
          imageUrl: '/frame.webp',
        }),
      },
    }),
    (error) => error.code === 'ITEM_NOT_OWNED' && error.statusCode === 409,
  );
});

test('equip validates slot type, supports unequip, and dual-writes legacy avatar frame', async () => {
  const frame = {
    _id: 'frame-1',
    name: 'Gold Frame',
    type: 'avatar_frame',
    imageUrl: '/frame.webp',
    isActive: false,
  };
  const user = {
    _id: 'user-1',
    ownedItemIds: ['frame-1'],
    equippedCosmetics: {},
    activeAvatarFrame: '',
    save: async () => user,
  };
  const dependencies = {
    UserModel: { findById: async () => user },
    ShopItemModel: { findById: async () => frame },
  };

  const equipped = await equipCosmetic({
    userId: 'user-1',
    slot: 'avatarFrame',
    itemId: 'frame-1',
    ...dependencies,
  });
  assert.equal(String(user.equippedCosmetics.avatarFrame), 'frame-1');
  assert.equal(user.activeAvatarFrame, 'Gold Frame');
  assert.equal(equipped.avatarFrame.assetUrl, '/frame.webp');

  const repeated = await equipCosmetic({
    userId: 'user-1',
    slot: 'avatarFrame',
    itemId: 'frame-1',
    ...dependencies,
  });
  assert.equal(repeated.avatarFrame.id, 'frame-1');

  await assert.rejects(
    equipCosmetic({
      userId: 'user-1',
      slot: 'field',
      itemId: 'frame-1',
      ...dependencies,
    }),
    (error) => error.code === 'SLOT_TYPE_MISMATCH' && error.statusCode === 422,
  );

  const unequipped = await equipCosmetic({
    userId: 'user-1',
    slot: 'avatarFrame',
    itemId: null,
    ...dependencies,
  });
  assert.equal(user.equippedCosmetics.avatarFrame, null);
  assert.equal(user.activeAvatarFrame, '');
  assert.equal(unequipped.avatarFrame, null);
});

test('purchase rejects hidden legacy items and expired V1 items before charging', async () => {
  const UserModel = { findOneAndUpdate: async () => assert.fail('must not charge unavailable items') };
  await assert.rejects(
    purchaseCosmetic({
      userId: 'user-1',
      itemId: 'skin-1',
      now: new Date('2026-01-02T00:00:00.000Z'),
      UserModel,
      ShopItemModel: {
        findById: async () => ({ _id: 'skin-1', type: 'skin', isActive: true, price: { coins: 50 } }),
      },
      TransactionModel: { create: async () => {} },
    }),
    (error) => error.code === 'ITEM_NOT_AVAILABLE',
  );

  await assert.rejects(
    purchaseCosmetic({
      userId: 'user-1',
      itemId: 'field-1',
      now: new Date('2026-01-02T00:00:00.000Z'),
      UserModel,
      ShopItemModel: {
        findById: async () => ({
          _id: 'field-1',
          type: 'field',
          isActive: true,
          isLimited: true,
          availableUntil: new Date('2026-01-01T00:00:00.000Z'),
          price: { coins: 50 },
        }),
      },
      TransactionModel: { create: async () => {} },
    }),
    (error) => error.code === 'ITEM_NOT_AVAILABLE',
  );
});

test('purchase atomically charges coins, adds stable ownership, and dual-writes avatar frames', async () => {
  const frame = {
    _id: 'frame-1',
    name: 'Gold Frame',
    type: 'avatar_frame',
    isActive: true,
    isLimited: false,
    price: { coins: 250 },
  };
  let updateFilter;
  let updateFields;
  let ledger;
  const result = await purchaseCosmetic({
    userId: 'user-1',
    itemId: 'frame-1',
    ShopItemModel: { findById: async () => frame },
    UserModel: {
      findOneAndUpdate: async (filter, fields) => {
        updateFilter = filter;
        updateFields = fields;
        return { _id: 'user-1', coins: 750, ownedItemIds: ['frame-1'] };
      },
    },
    TransactionModel: { create: async (entry) => { ledger = entry; } },
  });

  assert.deepEqual(updateFilter, {
    _id: 'user-1',
    coins: { $gte: 250 },
    ownedItemIds: { $ne: 'frame-1' },
  });
  assert.deepEqual(updateFields.$addToSet, {
    ownedItemIds: 'frame-1',
    ownedAvatarFrames: 'Gold Frame',
  });
  assert.equal(updateFields.$inc.coins, -250);
  assert.equal(ledger.source, 'shop:frame-1');
  assert.equal(result.coins, 750);
});

test('purchase distinguishes duplicate ownership from insufficient funds', async () => {
  const item = {
    _id: 'field-1',
    name: 'Lava Field',
    type: 'field',
    isActive: true,
    price: { coins: 500 },
  };
  const base = {
    userId: 'user-1',
    itemId: 'field-1',
    ShopItemModel: { findById: async () => item },
    TransactionModel: { create: async () => assert.fail('must not write ledger') },
  };

  await assert.rejects(
    purchaseCosmetic({
      ...base,
      UserModel: {
        findOneAndUpdate: async () => null,
        findById: async () => ({ ownedItemIds: ['field-1'], coins: 999 }),
      },
    }),
    (error) => error.code === 'ITEM_ALREADY_OWNED',
  );

  await assert.rejects(
    purchaseCosmetic({
      ...base,
      UserModel: {
        findOneAndUpdate: async () => null,
        findById: async () => ({ ownedItemIds: [], coins: 100 }),
      },
    }),
    (error) => error.code === 'INSUFFICIENT_FUNDS',
  );
});
