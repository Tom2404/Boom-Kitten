// Deck utilities for creating and dealing Exploding Kittens cards.
const crypto = require('crypto');

const CARD_COUNTS = {
  defuse: 4,
  nope: 5,
  attack: 3,
  skip: 4,
  see_the_future_1: 2,
  see_the_future_3: 3,
  see_the_future_5: 1,
  alter_the_future_3: 3,
  super_skip: 2,
  shuffle: 4,
  draw_from_bottom: 2,
  favor: 3,
  cat_taco: 3,
  cat_watermelon: 3,
  cat_beard: 3,
  cat_rainbow: 3,
  cat_potato: 3,
  
  // Expansion Cards
  reverse: 3,
  attack_2x: 2,
  personal_attack: 2,
  alter_the_future_5: 1,
  alter_the_future_3_now: 1,
  shuffle_now: 1,
  clairvoyance_now: 1,
  bury: 2,
  swap_top_and_bottom: 2,
  catomic_bomb: 1,
  mark: 2,
  ill_take_that: 2,
  garbage_collection: 1,
  pot_luck: 1,
  raising_heck: 1,
  streaking_kitten: 1,
  zombie_kitten: 2,
  feral_cat: 3,
  clone: 2,
  godcat: 1,
};

function makeCard(type) {
  return { id: crypto.randomUUID(), type };
}

function shuffleDeck(deck) {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createDeck(playerCount) {
  const deck = [];
  
  // Add all normal cards from counts
  Object.entries(CARD_COUNTS).forEach(([type, count]) => {
    for (let i = 0; i < count; i += 1) {
      deck.push(makeCard(type));
    }
  });

  // Calculate number of lethal kittens:
  // If streaking_kitten is in the deck, we need playerCount lethal kittens.
  // Otherwise, we need playerCount - 1 lethal kittens.
  const hasStreaking = CARD_COUNTS.streaking_kitten > 0;
  const totalKittensNeeded = hasStreaking ? playerCount : playerCount - 1;
  
  // We will have 1 Imploding Kitten, and the rest Exploding Kittens
  const implodingCount = Math.min(1, totalKittensNeeded);
  const explodingCount = totalKittensNeeded - implodingCount;
  
  for (let i = 0; i < implodingCount; i += 1) {
    deck.push(makeCard('imploding_kitten'));
  }
  for (let i = 0; i < explodingCount; i += 1) {
    deck.push(makeCard('exploding_kitten'));
  }

  return shuffleDeck(deck);
}

function dealCards(deck, players, handSize = 7) {
  const mutableDeck = [...deck];
  players.forEach((player) => {
    player.hand = player.hand ?? [];
    player.hand.push(makeCard('defuse'));
    for (let i = 0; i < handSize; i += 1) {
      const card = mutableDeck.pop();
      if (card) player.hand.push(card);
    }
  });
  return { deck: mutableDeck, players };
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
