const test = require('node:test');
const assert = require('node:assert');
const { 
  getExpectedScore, 
  getActualScore, 
  getKFactor, 
  calculateMultiplayerElo 
} = require('../utils/eloCalculator');

test('ELO Calculator Utilities', async (t) => {
  await t.test('getExpectedScore calculation', () => {
    const exp1 = getExpectedScore(1000, 1000);
    assert.strictEqual(exp1, 0.5);

    const exp2 = getExpectedScore(1600, 1200);
    assert.ok(exp2 > 0.5); // Player with 1600 Elo is expected to win against 1200
  });

  await t.test('getActualScore mapping', () => {
    assert.strictEqual(getActualScore(1, 2), 1); // 1st place wins against 2nd
    assert.strictEqual(getActualScore(3, 2), 0); // 3rd place loses against 2nd
    assert.strictEqual(getActualScore(2, 2), 0.5); // Same placement is a draw
  });

  await t.test('getKFactor mapping', () => {
    assert.strictEqual(getKFactor({ elo: 1000, gamesPlayed: 5 }), 40); // New player
    assert.strictEqual(getKFactor({ elo: 3200, gamesPlayed: 20 }), 16); // Legend
    assert.strictEqual(getKFactor({ elo: 2500, gamesPlayed: 20 }), 24); // Diamond
    assert.strictEqual(getKFactor({ elo: 1800, gamesPlayed: 20 }), 28); // Gold/Platinum
    assert.strictEqual(getKFactor({ elo: 1200, gamesPlayed: 20 }), 32); // Bronze/Silver
  });

  await t.test('calculateMultiplayerElo results', () => {
    const players = [
      { userId: 'A', eloBefore: 1600, gamesPlayed: 12, placement: 1 },
      { userId: 'B', eloBefore: 1400, gamesPlayed: 15, placement: 2 },
      { userId: 'C', eloBefore: 1000, gamesPlayed: 8, placement: 3 }
    ];

    const results = calculateMultiplayerElo(players);
    assert.strictEqual(results.length, 3);

    const playerA = results.find(r => r.userId === 'A');
    const playerB = results.find(r => r.userId === 'B');
    const playerC = results.find(r => r.userId === 'C');

    // A placed 1st, should gain ELO
    assert.ok(playerA.eloDelta > 0);
    // C placed 3rd, should lose ELO but stay >= 1000
    assert.ok(playerC.eloDelta <= 0);
    assert.ok(playerC.eloAfter >= 1000);
  });
});
