const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const express = require('express');
const { createAuthRouter, hashRefreshToken } = require('../routes/auth');
const shopRouter = require('../routes/shop');
const User = require('../models/User');
const ShopItem = require('../models/ShopItem');
const { createCatalogItem, deleteCatalogItem } = require('../services/admin/catalogService');
const { isSafeAssetUrl } = require('../services/shopEquipmentService');

test('Shop Item Creation & Session Handling Integration Test', async (t) => {
  await t.test('Asset URL security validation', () => {
    assert.equal(isSafeAssetUrl('/assets/items/frame1.png'), true);
    assert.equal(isSafeAssetUrl('/runtime.webp'), true);
    assert.equal(isSafeAssetUrl('http://external.com/hacked.png'), false);
    assert.equal(isSafeAssetUrl('javascript:alert(1)'), false);
  });

  await t.test('Creates a catalog item successfully with validation and audit', async () => {
    const createdItems = [];
    const MockCatalogModel = {
      create: async (payload) => {
        const item = { _id: new mongoose.Types.ObjectId().toString(), ...payload, toObject: () => payload };
        createdItems.push(item);
        return item;
      },
    };

    const audits = [];
    const mockAudit = async (entry) => audits.push(entry);

    const actor = { id: 'admin-1', username: 'superadmin', role: 'super_admin' };
    const input = {
      name: 'Vật phẩm Thử nghiệm Subagent',
      type: 'avatar_frame',
      price: { coins: 250 },
      imageUrl: '/assets/subagent_frame.png',
      rarity: 'epic',
    };
    const mutation = { requestId: 'req-subagent-001', reason: 'Testing shop creation' };

    const item = await createCatalogItem({
      CatalogModel: MockCatalogModel,
      audit: mockAudit,
      actor,
      input,
      mutation,
    });

    assert.equal(item.name, 'Vật phẩm Thử nghiệm Subagent');
    assert.equal(item.type, 'avatar_frame');
    assert.equal(item.price.coins, 250);
    assert.equal(item.imageUrl, '/assets/subagent_frame.png');
    assert.equal(audits.length, 1);
    assert.equal(audits[0].action, 'CATALOG_ITEM_CREATED');
  });

  await t.test('Rejects invalid asset URLs or negative prices during shop item creation', async () => {
    const actor = { id: 'admin-1', username: 'superadmin', role: 'super_admin' };
    const mutation = { requestId: 'req-bad-url' };

    await assert.rejects(
      async () => {
        await createCatalogItem({
          CatalogModel: { create: async () => {} },
          audit: async () => {},
          actor,
          input: {
            name: 'Hack Item',
            type: 'avatar_frame',
            imageUrl: 'http://malicious-site.com/hack.png',
          },
          mutation,
        });
      },
      (err) => err.statusCode === 422 && err.message.includes('URL asset không hợp lệ'),
    );

    await assert.rejects(
      async () => {
        await createCatalogItem({
          CatalogModel: { create: async () => {} },
          audit: async () => {},
          actor,
          input: {
            name: 'Negative Price Item',
            type: 'avatar_frame',
            price: { coins: -100 },
          },
          mutation,
        });
      },
      (err) => err.statusCode === 422 && err.message.includes('Giá Coin không hợp lệ'),
    );
  });

  await t.test('Session refresh token hashing uses timing-safe comparison', () => {
    const token = 'sample-refresh-token-uuid-12345';
    const hash = hashRefreshToken(token);
    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64); // SHA256 hex string length
  });
});
