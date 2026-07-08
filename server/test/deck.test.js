const test = require('node:test');
const assert = require('node:assert/strict');
const { createDeck, dealCards } = require('../game/deck');

const ORIGINAL_COUNTS = {
  nope: 5,
  attack: 4,
  skip: 4,
  see_the_future_3: 5,
  shuffle: 4,
  favor: 4,
  cat_taco: 4,
  cat_watermelon: 4,
  cat_beard: 4,
  cat_rainbow: 4,
  cat_potato: 4,
};

const EXPANSION_TYPES = new Set([
  'attack_of_the_dead',
  'feed_the_dead',
  'grave_robber',
  'clairvoyance_now',
  'dig_deeper',
  'godcat',
  'armageddon',
  'barking_kitten',
  'reveal_the_future_3x',
]);

function countTypes(cards) {
  return cards.reduce((counts, card) => {
    counts[card.type] = (counts[card.type] ?? 0) + 1;
    return counts;
  }, {});
}

test('createDeck defaults to the original edition only', () => {
  const deck = createDeck(4);
  const counts = countTypes(deck);

  assert.equal(deck.length, 46);
  assert.deepEqual(counts, ORIGINAL_COUNTS);
  assert.equal(deck.some((card) => EXPANSION_TYPES.has(card.type)), false);
});

test('dealCards adds one defuse per player and N-1 exploding kittens for original games', () => {
  const players = [
    { userId: 'p1', hand: [], alive: true },
    { userId: 'p2', hand: [], alive: true },
    { userId: 'p3', hand: [], alive: true },
  ];

  const dealt = dealCards(createDeck(players.length, 'original'), players, 4, 'original');
  const deckCounts = countTypes(dealt.deck);

  assert.equal(dealt.players.every((player) => player.hand.length === 5), true);
  assert.equal(dealt.players.every((player) => player.hand.filter((card) => card.type === 'defuse').length === 1), true);
  assert.equal(deckCounts.exploding_kitten, 2);
  assert.equal(deckCounts.defuse, 3);
});

test('barking edition uses the playable NOW clairvoyance card type', () => {
  const deck = createDeck(4, 'barking');
  const counts = countTypes(deck);

  assert.equal(counts.barking_kitten, 2);
  assert.equal(counts.reveal_the_future_3x, 2);
  assert.equal(counts.clairvoyance_now, 2);
  assert.equal(counts.clairvoyance ?? 0, 0);
});

test('zombie edition adds remaining zombie kittens to the draw pile after dealing', () => {
  const players = [
    { userId: 'p1', hand: [], alive: true },
    { userId: 'p2', hand: [], alive: true },
    { userId: 'p3', hand: [], alive: true },
  ];

  const dealt = dealCards(createDeck(players.length, 'zombie'), players, 7, 'zombie');
  const deckCounts = countTypes(dealt.deck);

  assert.equal(dealt.players.every((player) => player.hand.filter((card) => card.type === 'zombie_kitten').length === 1), true);
  assert.equal(deckCounts.zombie_kitten, 2);
  assert.equal(deckCounts.defuse ?? 0, 0);
});

test('createDeck has correct card counts for imploding edition', () => {
  const deck = createDeck(4, 'imploding');
  const counts = countTypes(deck);

  assert.equal(counts.nope, 5);
  assert.equal(counts.attack, 4);
  assert.equal(counts.skip, 5);
  assert.equal(counts.see_the_future_3, 5);
  assert.equal(counts.shuffle, 4);
  assert.equal(counts.favor, 4);
  assert.equal(counts.cat_taco, 4);
  assert.equal(counts.cat_watermelon, 4);
  assert.equal(counts.cat_beard, 4);
  assert.equal(counts.cat_rainbow, 4);
  assert.equal(counts.cat_potato, 4);

  assert.equal(counts.alter_the_future_3, 3);
  assert.equal(counts.draw_from_bottom, 3);
  assert.equal(counts.reverse, 3);
  assert.equal(counts.target_attack_2x, 3);
  assert.equal(counts.catomic_bomb, 1);
  assert.equal(counts.feral_cat, 4);

  assert.equal(counts.barking_kitten ?? 0, 0);
  assert.equal(counts.zombie_kitten ?? 0, 0);
  assert.equal(counts.godcat ?? 0, 0);
  assert.equal(counts.armageddon ?? 0, 0);
});

test('dealCards deals 8 cards per player and sets kittens properly for imploding', () => {
  const players = [
    { userId: 'p1', hand: [], alive: true },
    { userId: 'p2', hand: [], alive: true },
    { userId: 'p3', hand: [], alive: true },
    { userId: 'p4', hand: [], alive: true },
  ];

  const deck = createDeck(players.length, 'imploding');
  const dealt = dealCards(deck, players, 7, 'imploding');
  const deckCounts = countTypes(dealt.deck);

  assert.equal(dealt.players.every((player) => player.hand.length === 8), true);
  assert.equal(dealt.players.every((player) => player.hand.filter((card) => card.type === 'defuse').length === 1), true);

  assert.equal(deckCounts.imploding_kitten, 1);
  assert.equal(deckCounts.exploding_kitten, 2);
  assert.equal(deckCounts.defuse, 2);
});

test('dealCards sets 1 exploding kitten and 1 imploding kitten for 2 players in imploding edition', () => {
  const players = [
    { userId: 'p1', hand: [], alive: true },
    { userId: 'p2', hand: [], alive: true },
  ];

  const deck = createDeck(players.length, 'imploding');
  const dealt = dealCards(deck, players, 7, 'imploding');
  const deckCounts = countTypes(dealt.deck);

  assert.equal(deckCounts.imploding_kitten, 1);
  assert.equal(deckCounts.exploding_kitten, undefined);
});

test('dealCards respects customDefuses and customExplodingKittens options', () => {
  const players = [
    { userId: 'p1', hand: [], alive: true },
    { userId: 'p2', hand: [], alive: true },
    { userId: 'p3', hand: [], alive: true },
  ];

  const deck = createDeck(players.length, 'original');
  const customOptions = {
    customDefuses: 8, // 8 defuses in total -> 3 for players, 5 in deck
    customExplodingKittens: 5, // 5 exploding kittens
  };
  const dealt = dealCards(deck, players, 4, 'original', customOptions);
  const deckCounts = countTypes(dealt.deck);

  assert.equal(dealt.players.every((player) => player.hand.filter((card) => card.type === 'defuse').length === 1), true);
  
  assert.equal(deckCounts.defuse, 5, 'Should have 5 defuses left in deck');
  assert.equal(deckCounts.exploding_kitten, 5, 'Should have 5 exploding kittens in deck');
});
