const test = require('node:test');
const assert = require('node:assert/strict');

const { selectQuestFields } = require('../services/admin/questService');
const { selectCatalogFields } = require('../services/admin/catalogService');
const { validateInput: validateAnnouncementInput } = require('../services/admin/announcementService');

test('admin quest and catalog payloads persist Coin-only prices and rewards', () => {
  assert.deepEqual(
    selectQuestFields({ reward: { coins: 25, gems: 9 } }),
    { reward: { coins: 25 } },
  );
  assert.deepEqual(
    selectCatalogFields({ price: { coins: 100, gems: 3 } }),
    { price: { coins: 100 } },
  );
});

test('announcement targeting cannot reveal or use player rating', () => {
  assert.throws(
    () => validateAnnouncementInput({ message: 'hello', audience: { type: 'rank_range', minElo: 1, maxElo: 2 } }),
    (error) => error.code === 'VALIDATION_ERROR',
  );
});
