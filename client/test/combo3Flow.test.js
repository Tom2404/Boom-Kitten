import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('combo 3 selects only a target before play and requests the card name after resolution', async () => {
  const [hand, actions, interactions, game] = await Promise.all([
    read('../src/components/PlayerHand.jsx'),
    read('../src/hooks/useGameActions.js'),
    read('../src/hooks/useGameInteractions.js'),
    read('../src/hooks/useGame.js'),
  ]);

  assert.match(hand, /onPlayCombo\(combo3Pending\.ids, opponentId\)/);
  assert.match(hand, /combo3Request/);
  assert.match(hand, /handleCombo3StealConfirm\(ct\.type\)/);
  assert.match(hand, /onRespondCombo3\(stealType\)/);
  assert.match(hand, /\{ type: 'attack_2x', label: 'Attack' \}/);
  assert.doesNotMatch(hand, /\{ type: 'attack', label: 'Attack' \}/);
  assert.match(hand, /\{ type: 'see_the_future_3', label: 'See the Future' \}/);
  assert.doesNotMatch(hand, /\{ type: 'see_the_future', label: 'See the Future' \}/);
  assert.doesNotMatch(hand, /setCombo3Step\('card'\)/);

  assert.match(actions, /const respondCombo3 = \(cardType\)/);
  assert.match(actions, /game:combo3:respond/);
  assert.match(interactions, /combo_3/);
  assert.match(game, /combo3Request: interactions\.combo3Request/);
});
