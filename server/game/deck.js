// Deck utilities for creating and dealing Exploding Kittens cards.
const crypto = require('crypto');

// Number of image skin variants per card type.
// Must stay in sync with client/src/utils/cardSkins.js.
const SKIN_COUNTS = {
  defuse: 18,
  nope: 10,
  skip: 8,
  see_the_future_3: 10,
  shuffle: 8,
  favor: 6,
  cat_taco: 1,
  cat_watermelon: 1,
  cat_beard: 1,
  cat_rainbow: 1,
  cat_potato: 1,
  exploding_kitten: 13,
  zombie_kitten: 5,
  attack_of_the_dead: 3,
  feed_the_dead: 1,
  grave_robber: 1,
  clairvoyance_now: 2,
  dig_deeper: 4,
  godcat: 1,
  armageddon: 3,
  barking_kitten: 2,
  reveal_the_future_3x: 3,
  alter_the_future_3: 4,
  draw_from_bottom: 1,
  reverse: 4,
  target_attack_2x: 3,
  catomic_bomb: 1,
  feral_cat: 1,
  imploding_kitten: 1,
  streaking_kitten: 1,
  super_skip: 1,
  see_the_future_1: 1,
  see_the_future_5: 1,
  alter_the_future_5: 1,
  swap_top_and_bottom: 1,
  mark: 1,
  garbage_collection: 1,
  curse_of_the_cat_butt: 2,
};

// Card quantities strictly according to docs/Game rule.md
const CARD_COUNTS = {
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
  attack_of_the_dead: 2,
  feed_the_dead: 2,
  grave_robber: 2,
  clairvoyance_now: 2,
  dig_deeper: 2,
  godcat: 2,
  armageddon: 2,
  barking_kitten: 2,
  reveal_the_future_3x: 2,
  alter_the_future_3: 3,
  draw_from_bottom: 3,
  reverse: 3,
  target_attack_2x: 3,
  catomic_bomb: 1,
  feral_cat: 4,
  imploding_kitten: 1,
  streaking_kitten: 1,
  super_skip: 1,
  see_the_future_1: 1,
  see_the_future_5: 1,
  alter_the_future_5: 1,
  swap_top_and_bottom: 1,
  mark: 1,
  garbage_collection: 1,
  curse_of_the_cat_butt: 2,
};

function makeCard(type) {
  const skinCount = SKIN_COUNTS[type] ?? 1;
  const skinIndex = Math.floor(Math.random() * skinCount);
  return { id: crypto.randomUUID(), type, skinIndex };
}

function shuffleDeck(deck) {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getCardCounts(playerCount, edition = 'original') {
  const counts = {};
  
  if (edition === '2_player') {
    // 2-Player Edition has exactly 29 action/cat cards in deck (excluding starting hands and kittens)
    counts.nope = 3;
    counts.attack = 2;
    counts.skip = 4;
    counts.see_the_future_3 = 3;
    counts.shuffle = 3;
    counts.favor = 2;
    counts.cat_taco = 3;
    counts.cat_watermelon = 3;
    counts.cat_beard = 3;
    counts.cat_potato = 3;
    return counts;
  }
  
  if (edition === 'zombie') {
    // Zombie standalone deck (standard action/cat counts)
    counts.nope = 4;
    counts.skip = 4;
    counts.see_the_future_3 = 3;
    counts.shuffle = 3;
    counts.favor = 3;
    // Zombie Kittens actions
    counts.attack_of_the_dead = 2;
    counts.feed_the_dead = 2;
    counts.grave_robber = 2;
    counts.dig_deeper = 2;
    // Cat cards (Taco, Watermelon, Beard, Potato, Rainbow)
    counts.cat_taco = 2;
    counts.cat_watermelon = 2;
    counts.cat_beard = 2;
    counts.cat_potato = 2;
    counts.cat_rainbow = 2;
    return counts;
  }
  
  // Base original cards are always included for standard and expansion editions.
  const baseTypes = [
    'nope', 'attack', 'skip', 'see_the_future_3', 'shuffle', 'favor',
    'cat_taco', 'cat_watermelon', 'cat_beard', 'cat_rainbow', 'cat_potato'
  ];
  
  baseTypes.forEach((type) => {
    counts[type] = CARD_COUNTS[type];
  });
  
  if (edition === 'barking') {
    counts.barking_kitten = CARD_COUNTS.barking_kitten;
    counts.clairvoyance_now = CARD_COUNTS.clairvoyance_now;
    counts.reveal_the_future_3x = CARD_COUNTS.reveal_the_future_3x;
  }
  
  if (edition === 'good_vs_evil') {
    counts.godcat = CARD_COUNTS.godcat;
    counts.armageddon = CARD_COUNTS.armageddon;
  }

  if (edition === 'imploding') {
    counts.alter_the_future_3 = CARD_COUNTS.alter_the_future_3;
    counts.draw_from_bottom = CARD_COUNTS.draw_from_bottom;
    counts.reverse = CARD_COUNTS.reverse;
    counts.target_attack_2x = CARD_COUNTS.target_attack_2x;
    counts.catomic_bomb = CARD_COUNTS.catomic_bomb;
    counts.feral_cat = CARD_COUNTS.feral_cat;
    counts.skip = CARD_COUNTS.skip + 1; // 1 additional skip card
  }

  if (edition === 'streaking') {
    counts.streaking_kitten = CARD_COUNTS.streaking_kitten;
    counts.super_skip = CARD_COUNTS.super_skip;
    counts.see_the_future_5 = CARD_COUNTS.see_the_future_5;
    counts.alter_the_future_5 = CARD_COUNTS.alter_the_future_5;
    counts.swap_top_and_bottom = CARD_COUNTS.swap_top_and_bottom;
    counts.catomic_bomb = CARD_COUNTS.catomic_bomb;
    counts.mark = CARD_COUNTS.mark;
    counts.garbage_collection = CARD_COUNTS.garbage_collection;
    counts.curse_of_the_cat_butt = CARD_COUNTS.curse_of_the_cat_butt;
  }

  return counts;
}

function createDeck(playerCount, edition = 'original') {
  const deck = [];
  const counts = getCardCounts(playerCount, edition);
  
  // Add all normal cards from counts
  Object.entries(counts).forEach(([type, count]) => {
    for (let i = 0; i < count; i += 1) {
      deck.push(makeCard(type));
    }
  });

  return shuffleDeck(deck);
}

function dealCards(deck, players, handSize = 7, edition = 'original') {
  const mutableDeck = [...deck];
  
  // Give each player their starting Defuse / Zombie Kitten card
  players.forEach((player) => {
    player.hand = player.hand ?? [];
    if (edition === 'zombie') {
      player.hand.push(makeCard('zombie_kitten'));
    } else {
      player.hand.push(makeCard('defuse'));
    }
  });

  // Deal handSize (default 7) cards to each player from the deck
  players.forEach((player) => {
    for (let i = 0; i < handSize; i += 1) {
      const card = mutableDeck.pop();
      if (card) player.hand.push(card);
    }
  });

  if (edition === 'zombie') {
    const remainingZombieKittens = Math.max(0, 5 - players.length);
    for (let i = 0; i < remainingZombieKittens; i += 1) {
      mutableDeck.push(makeCard('zombie_kitten'));
    }
  }

  // Remaining defuses are shuffled back into the deck for standard/expansion editions using Defuse cards
  if (edition === 'original' || edition === 'barking' || edition === 'good_vs_evil' || edition === 'imploding' || edition === 'streaking') {
    const remainingDefuses = Math.max(0, 6 - players.length);
    for (let i = 0; i < remainingDefuses; i += 1) {
      mutableDeck.push(makeCard('defuse'));
    }
  }

  // Add Exploding & Imploding Kittens to remaining deck
  if (edition === 'imploding') {
    mutableDeck.push(makeCard('imploding_kitten'));
    const explodingCount = Math.max(0, players.length - 1);
    for (let i = 0; i < explodingCount; i += 1) {
      mutableDeck.push(makeCard('exploding_kitten'));
    }
  } else {
    const explodingCount = edition === '2_player' ? 1 : Math.max(0, players.length - 1);
    for (let i = 0; i < explodingCount; i += 1) {
      mutableDeck.push(makeCard('exploding_kitten'));
    }
  }

  const finalDeck = shuffleDeck(mutableDeck);
  return { deck: finalDeck, players };
}

function insertExplodingKittens(deck, count) {
  const mutableDeck = [...deck];
  for (let i = 0; i < count; i += 1) {
    const index = Math.floor(Math.random() * (mutableDeck.length + 1));
    mutableDeck.splice(index, 0, makeCard('exploding_kitten'));
  }
  return mutableDeck;
}

module.exports = { createDeck, shuffleDeck, dealCards, insertExplodingKittens };
