const test = require('node:test');
const assert = require('node:assert');

function getTieredResetElo(rank) {
  if (!rank) return 1000;
  if (rank === 'Legend') return 1800; // Gold IV
  if (rank.startsWith('Diamond')) return 1500; // Silver III
  if (rank.startsWith('Platinum')) return 1300; // Bronze I
  if (rank.startsWith('Gold')) return 1200; // Bronze II
  if (rank.startsWith('Silver')) return 1100; // Bronze III
  return 1000; // Bronze IV
}

test('Season Reset ELO Strategy Formulas', async (t) => {
  await t.test('Soft Reset Ratio (Linear nén ELO)', () => {
    const baseElo = 1000;
    const ratio = 0.5;

    // Player A has 1000 ELO -> stays 1000
    const eloA = 1000;
    const newEloA = baseElo + Math.max(0, eloA - baseElo) * ratio;
    assert.strictEqual(newEloA, 1000);

    // Player B has 1800 ELO -> becomes 1400
    const eloB = 1800;
    const newEloB = baseElo + Math.max(0, eloB - baseElo) * ratio;
    assert.strictEqual(newEloB, 1400);

    // Player C has 3000 ELO -> becomes 2000
    const eloC = 3000;
    const newEloC = baseElo + Math.max(0, eloC - baseElo) * ratio;
    assert.strictEqual(newEloC, 2000);
  });

  await t.test('Soft Reset Tiered (Lùi bậc Hearthstone-style)', () => {
    assert.strictEqual(getTieredResetElo('Legend'), 1800);
    assert.strictEqual(getTieredResetElo('Diamond II'), 1500);
    assert.strictEqual(getTieredResetElo('Platinum IV'), 1300);
    assert.strictEqual(getTieredResetElo('Gold I'), 1200);
    assert.strictEqual(getTieredResetElo('Silver III'), 1100);
    assert.strictEqual(getTieredResetElo('Bronze II'), 1000);
  });
});
