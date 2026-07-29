import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterCatalog,
  filterQuests,
  getCatalogSummary,
  getQuestSummary,
} from '../src/pages/admin/adminListFilters.js';

const catalog = [
  { name: 'Red Skin', type: 'skin', rarity: 'rare', isActive: true },
  { name: 'Blue Frame', type: 'avatar_frame', rarity: 'common', isActive: false },
  { name: 'Cat Emote', type: 'emote', rarity: 'rare', isActive: true },
];

const quests = [
  { title: 'Play once', actionType: 'play_game', isActive: true, reward: { coins: 10 } },
  { title: 'Buy a skin', actionType: 'buy_item', isActive: false, reward: { coins: 25 } },
];

test('filters catalog with combined search, type, rarity, and status', () => {
  assert.deepEqual(
    filterCatalog(catalog, { search: 'cat', type: 'emote', rarity: 'rare', status: 'active' }),
    [catalog[2]],
  );
  assert.deepEqual(getCatalogSummary(catalog), { total: 3, active: 2, inactive: 1 });
});

test('filters quests and summarizes active state and reward budget', () => {
  assert.deepEqual(
    filterQuests(quests, { search: 'buy', actionType: 'buy_item', status: 'inactive' }),
    [quests[1]],
  );
  assert.deepEqual(getQuestSummary(quests), { total: 2, active: 1, inactive: 1, rewardCoins: 35 });
});
