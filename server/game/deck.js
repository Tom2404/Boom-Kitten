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
  // Use exact quantities from Game rule.md without scaling factors
  const counts = {};
  Object.entries(CARD_COUNTS).forEach(([type, count]) => {
    counts[type] = count;
  });
  return counts;
}

function createDeck(playerCount) {
  const deck = [];
  const counts = getCardCounts(playerCount);
  
  // Add all normal cards from counts
  Object.entries(counts).forEach(([type, count]) => {
    for (let i = 0; i < count; i += 1) {
      deck.push(makeCard(type));
    }
  });

  return shuffleDeck(deck);
}

function dealCards(deck, players, handSize = 7) {
  const mutableDeck = [...deck];
  
  // Give each player exactly 1 defuse card
  players.forEach((player) => {
    player.hand = player.hand ?? [];
    player.hand.push(makeCard('defuse'));
  });

  // Deal handSize (default 7) cards to each player from the deck (total 8 cards in hand)
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

  // Add Exploding Kittens to remaining deck (players.length - 1)
  const explodingCount = Math.max(0, players.length - 1);
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
