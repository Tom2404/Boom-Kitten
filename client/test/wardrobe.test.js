import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { translations } from '../src/utils/translations.js';
import {
  filterWardrobeItems,
  getWardrobeCounts,
  mergeWardrobeItems,
  paginateWardrobeItems,
} from '../src/utils/wardrobeCatalog.js';

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('registers Wardrobe as an authenticated player destination on desktop and mobile', () => {
  const app = read('../src/App.jsx');
  const navbar = read('../src/components/Navbar.jsx');

  assert.match(app, /const Wardrobe = lazy\(\(\) => import\('\.\/pages\/Wardrobe\.jsx'\)\)/);
  assert.match(app, /PAGES[^;]+Wardrobe/);
  assert.match(app, /\['Game', 'Mission', 'Shop', 'Wardrobe', 'Profile', 'Tournaments'\]/);
  assert.match(navbar, /page: 'Wardrobe'[^\n]+authenticated: true/);
  assert.match(navbar, /const active = page === targetPage/);
  assert.match(navbar, /aria-expanded/);
  assert.match(navbar, /lg:hidden/);
});

test('Wardrobe reads owned cosmetics and owns every equipment mutation', () => {
  const wardrobe = read('../src/pages/Wardrobe.jsx');
  const shop = read('../src/pages/Shop.jsx');

  assert.match(wardrobe, /\/api\/shop\/owned/);
  assert.match(wardrobe, /\/api\/shop\/items/);
  assert.match(wardrobe, /\/api\/users\/me/);
  assert.match(wardrobe, /\/api\/shop\/equipment\/\$\{slot\}/);
  assert.match(wardrobe, /EQUIPMENT_SLOTS/);
  assert.match(wardrobe, /WardrobePreview/);
  assert.match(wardrobe, /WardrobeInventory/);
  assert.match(wardrobe, /mergeWardrobeItems/);
  assert.match(wardrobe, /Promise\.allSettled/);
  assert.match(wardrobe, /setPage\('Shop'\)/);
  assert.doesNotMatch(shop, /\/api\/shop\/equipment/);
  assert.doesNotMatch(shop, /shop-loadout-title/);
});

test('Wardrobe copy is complete in Vietnamese and English', () => {
  const keys = [
    'wardrobe',
    'wardrobe_title',
    'wardrobe_desc',
    'wardrobe_loading',
    'wardrobe_empty_title',
    'wardrobe_empty_desc',
    'wardrobe_shop_cta',
    'wardrobe_load_error',
    'wardrobe_retry',
    'wardrobe_collection',
    'wardrobe_discover_title',
    'wardrobe_discover_desc',
    'wardrobe_preview_title',
    'wardrobe_loadout_title',
    'wardrobe_preview_apply',
    'wardrobe_preview_cancel',
    'wardrobe_change',
    'wardrobe_search_placeholder',
    'wardrobe_filter_all',
    'wardrobe_filter_owned',
    'wardrobe_filter_locked',
    'wardrobe_filter_equipped',
    'wardrobe_sort_default',
    'wardrobe_sort_rarity',
    'wardrobe_sort_name',
    'wardrobe_no_results_title',
    'wardrobe_clear_filters',
    'wardrobe_locked',
    'wardrobe_limited',
    'wardrobe_undo',
    'wardrobe_equipped_toast',
    'shop_error_FEATURE_UNAVAILABLE',
  ];

  for (const language of ['vi', 'en']) {
    for (const key of keys) {
      assert.equal(typeof translations[language][key], 'string', `${language}.${key}`);
      assert.notEqual(translations[language][key].trim(), '', `${language}.${key}`);
    }
  }
});

test('merges public and owned cosmetics without duplicates and keeps retired owned items', () => {
  const items = mergeWardrobeItems({
    catalogItems: [
      { _id: 'protector-1', type: 'protector', name: 'Neon Cat', rarity: 'epic', isLimited: true },
      { _id: 'field-1', type: 'field', name: 'Meow Arena', rarity: 'rare' },
    ],
    ownedItems: [
      { _id: 'protector-1', type: 'protector', name: 'Neon Cat', rarity: 'epic' },
      { _id: 'frame-retired', type: 'avatar_frame', name: 'Old Flame', rarity: 'legendary' },
    ],
    ownedItemIds: ['protector-1', 'frame-retired'],
    equipped: { protector: { id: 'protector-1' }, avatarFrame: null, field: null },
  });

  assert.deepEqual(items.map((item) => item._id), ['protector-1', 'field-1', 'frame-retired']);
  assert.equal(items[0].isOwned, true);
  assert.equal(items[0].isEquipped, true);
  assert.equal(items[0].isLimited, true);
  assert.equal(items[1].isLocked, true);
  assert.equal(items[2].isCatalogItem, false);
  assert.equal(items[2].isOwned, true);
});

test('filters and sorts wardrobe items by query, category, rarity, and ownership state', () => {
  const items = mergeWardrobeItems({
    catalogItems: [
      { _id: '1', type: 'protector', name: 'Ocean Paws', rarity: 'rare' },
      { _id: '2', type: 'protector', name: 'Golden King', rarity: 'legendary' },
      { _id: '3', type: 'field', name: 'Golden Arena', rarity: 'legendary' },
    ],
    ownedItems: [{ _id: '2', type: 'protector', name: 'Golden King', rarity: 'legendary' }],
    ownedItemIds: ['2'],
    equipped: { protector: { id: '2' } },
  });

  assert.deepEqual(filterWardrobeItems(items, {
    type: 'protector', query: 'gold', rarity: 'legendary', ownership: 'equipped', sort: 'name',
  }).map((item) => item.name), ['Golden King']);

  assert.deepEqual(filterWardrobeItems(items, {
    type: 'protector', ownership: 'all', sort: 'rarity',
  }).map((item) => item.name), ['Golden King', 'Ocean Paws']);
});

test('counts each category and paginates a filtered collection without mutating it', () => {
  const items = Array.from({ length: 13 }, (_, index) => ({
    _id: String(index),
    type: index < 11 ? 'protector' : 'field',
    isOwned: index % 2 === 0,
  }));

  assert.deepEqual(getWardrobeCounts(items), { protector: 11, avatar_frame: 0, field: 2 });
  const secondPage = paginateWardrobeItems(items, 2, 10);
  assert.equal(secondPage.totalPages, 2);
  assert.deepEqual(secondPage.items.map((item) => item._id), ['10', '11', '12']);
  assert.equal(items.length, 13);
});

test('Wardrobe refinement keeps collection context inside Inventory and centers the preview hierarchy', () => {
  const wardrobe = read('../src/pages/Wardrobe.jsx');
  const inventory = read('../src/components/wardrobe/WardrobeInventory.jsx');
  const preview = read('../src/components/wardrobe/WardrobePreview.jsx');
  const card = read('../src/components/wardrobe/WardrobeItemCard.jsx');
  const styles = read('../src/styles.css');

  assert.match(wardrobe, /className="wardrobe-page-title/);
  assert.match(wardrobe, /ownedCount=\{ownedCount\}/);
  assert.match(wardrobe, /collectionPercent=\{collectionPercent\}/);
  assert.match(wardrobe, /previewItem=\{activePreviewItem\}/);
  assert.doesNotMatch(wardrobe, /<section[^>]+aria-label=\{t\('wardrobe_collection'\)\}/);
  assert.match(inventory, /wardrobe-inventory-heading/);
  assert.match(inventory, /wardrobe-inventory-grid/);
  assert.match(inventory, /wardrobe-inventory-discovery/);
  assert.match(preview, /wardrobe-preview-focus/);
  assert.match(preview, /wardrobe-preview-status/);
  assert.match(preview, /previewItem/);
  assert.match(card, /\(isPinned \|\| isTransient\) && !item\.isEquipped/);
  assert.match(styles, /\.wardrobe-page-title\s*\{[^}]*font-size:\s*clamp\(2\.375rem,\s*4vw,\s*3\.625rem\)/s);
  assert.match(styles, /\.wardrobe-inventory-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(11\.25rem,\s*13\.125rem\)\)/s);
});

test('equipped Wardrobe cards remove the item instead of previewing it again', () => {
  const card = read('../src/components/wardrobe/WardrobeItemCard.jsx');
  const inventory = read('../src/components/wardrobe/WardrobeInventory.jsx');

  assert.match(card, /onUnequip/);
  assert.match(card, /item\.isEquipped\s*\?\s*onUnequip\(item\)/);
  assert.match(card, /item\.isEquipped\s*\?\s*t\('shop_unequip'\)/);
  assert.match(inventory, /onUnequip=\{onUnequip\}/);
});
