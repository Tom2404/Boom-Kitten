// Deck utilities for creating and dealing Exploding Kittens cards.
const crypto = require('crypto');

// Number of image skin variants per card type.
// Must stay in sync with client/src/utils/cardSkins.js.
const SKIN_COUNTS = {
  defuse: 18,
  nope: 10,
  skip: 8,
  super_skip: 2,
  see_the_future_1: 10,
  see_the_future_3: 10,
  see_the_future_5: 1,
  alter_the_future_3: 4,
  alter_the_future_3_now: 1,
  alter_the_future_5: 1,
  shuffle: 8,
  draw_from_bottom: 1,
  favor: 6,
  cat_taco: 1,
  cat_watermelon: 1,
  cat_beard: 1,
  cat_rainbow: 1,
  cat_potato: 1,
  feral_cat: 1,
  reverse: 4,
  attack_2x: 8,
  personal_attack: 4,
  bury: 2,
  swap_top_and_bottom: 1,
  catomic_bomb: 1,
  mark: 1,
  ill_take_that: 4,
  garbage_collection: 1,
  pot_luck: 2,
  streaking_kitten: 1,
  exploding_kitten: 13,
  imploding_kitten: 1,
  clairvoyance_now: 2,
  target_attack_2x: 3,
  share_the_future_3: 2,
};

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
  target_attack_2x: 2,
  share_the_future_3: 2,
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

function getCardCounts(playerCount) {
  // We scale the quantities based on playerCount (2 to 5)
  // If playerCount is 2, factor 0.5
  // If playerCount is 3, factor 0.7
  // If playerCount is 4, factor 0.9
  // If playerCount is 5, factor 1.0 (full deck)
  const factor = playerCount === 2 ? 0.5 : playerCount === 3 ? 0.7 : playerCount === 4 ? 0.9 : 1.0;
  
  const scaled = {};
  Object.entries(CARD_COUNTS).forEach(([type, count]) => {
    if (type === 'defuse') {
      // Defuse is handled separately in dealCards: we need 6 total defuse cards in the game.
      scaled[type] = 6;
    } else if (type === 'streaking_kitten') {
      scaled[type] = 1; // Only 1 Streaking Kitten
    } else if (type === 'imploding_kitten' || type === 'exploding_kitten') {
      scaled[type] = 0; // Added dynamically in dealCards
    } else {
      let scaledCount = Math.round(count * factor);
      if (count > 0 && scaledCount === 0) {
        // Keep at least 1 for common cards
        if (['nope', 'attack', 'skip', 'shuffle', 'favor'].includes(type) || type.startsWith('cat_')) {
          scaledCount = 1;
        }
      }
      scaled[type] = scaledCount;
    }
  });
  return scaled;
}

function createDeck(playerCount) {
  const deck = [];
  const counts = getCardCounts(playerCount);
  
  // Add all normal cards from counts (excluding defuse and kittens)
  Object.entries(counts).forEach(([type, count]) => {
    if (type !== 'defuse' && type !== 'exploding_kitten' && type !== 'imploding_kitten') {
      for (let i = 0; i < count; i += 1) {
        deck.push(makeCard(type));
      }
    }
  });

  return shuffleDeck(deck);
}

function dealCards(deck, players, handSize = 4) {
  const mutableDeck = [...deck];
  
  // Give each player exactly 1 defuse card
  players.forEach((player) => {
    player.hand = player.hand ?? [];
    player.hand.push(makeCard('defuse'));
  });

  // Deal handSize (default 4) cards to each player from the deck (which has no defuses or kittens)
  players.forEach((player) => {
    for (let i = 0; i < handSize; i += 1) {
      const card = mutableDeck.pop();
      if (card) player.hand.push(card);
    }
  });

  // Put remaining defuse cards back into the deck (6 total - players.length)
  const remainingDefuses = Math.max(0, 6 - players.length);
  for (let i = 0; i < remainingDefuses; i += 1) {
    mutableDeck.push(makeCard('defuse'));
  }

  // Add Exploding and Imploding Kittens to remaining deck
  const totalKittensNeeded = players.length; // Since Streaking Kitten is in the deck (always 1)
  const implodingCount = Math.min(1, totalKittensNeeded);
  const explodingCount = totalKittensNeeded - implodingCount;

  for (let i = 0; i < implodingCount; i += 1) {
    mutableDeck.push(makeCard('imploding_kitten'));
  }
  for (let i = 0; i < explodingCount; i += 1) {
    mutableDeck.push(makeCard('exploding_kitten'));
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
