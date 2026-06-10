// Deck utilities for creating and dealing Exploding Kittens cards.
const crypto = require('crypto');

const CARD_COUNTS = {
  defuse: 6,
  nope: 5,
  attack: 4,
  skip: 4,
  see_the_future: 5,
  shuffle: 4,
  favor: 4,
  cat_taco: 4,
  cat_watermelon: 4,
  cat_beard: 4,
  cat_rainbow: 4,
  cat_potato: 4,
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
  Object.entries(CARD_COUNTS).forEach(([type, count]) => {
    for (let i = 0; i < count; i += 1) deck.push(makeCard(type));
  });

  for (let i = 0; i < playerCount - 1; i += 1) {
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
