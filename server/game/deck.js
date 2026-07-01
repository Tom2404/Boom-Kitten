// Deck utilities for creating and dealing Exploding Kittens cards.
const crypto = require('crypto');

const { getDeckConfiguration, getSkinCount } = require('./data/cardDefinitions');

function makeCard(type) {
  const skinCount = getSkinCount(type);
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



function createDeck(playerCount, edition = 'original') {
  const deck = [];
  const counts = getDeckConfiguration(edition);
  
  // Add all normal cards from counts
  Object.entries(counts).forEach(([type, count]) => {
    for (let i = 0; i < count; i += 1) {
      deck.push(makeCard(type));
    }
  });

  return shuffleDeck(deck);
}

function dealCards(deck, players, handSize = 7, edition = 'original', customOptions = {}) {
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
    let remainingDefuses = Math.max(0, 6 - players.length);
    if (customOptions.customDefuses !== undefined) {
      remainingDefuses = Math.max(0, customOptions.customDefuses - players.length);
    }
    for (let i = 0; i < remainingDefuses; i += 1) {
      mutableDeck.push(makeCard('defuse'));
    }
  }

  // Add Exploding & Imploding Kittens to remaining deck
  if (edition === 'imploding') {
    mutableDeck.push(makeCard('imploding_kitten'));
    let explodingCount = Math.max(0, players.length - 2);
    if (customOptions.customExplodingKittens !== undefined) {
      explodingCount = Math.max(0, customOptions.customExplodingKittens - 1); // 1 imploding kitten replaces an exploding kitten
    }
    for (let i = 0; i < explodingCount; i += 1) {
      mutableDeck.push(makeCard('exploding_kitten'));
    }
  } else {
    let explodingCount;
    if (customOptions.customExplodingKittens !== undefined) {
      explodingCount = customOptions.customExplodingKittens;
    } else if (edition === '2_player') {
      explodingCount = 1;
    } else if (edition === 'streaking') {
      explodingCount = players.length;
    } else {
      explodingCount = Math.max(0, players.length - 1);
    }
    for (let i = 0; i < explodingCount; i += 1) {
      mutableDeck.push(makeCard('exploding_kitten'));
    }
  }

  const finalDeck = shuffleDeck(mutableDeck);
  return { deck: finalDeck, players };
}

module.exports = { createDeck, shuffleDeck, dealCards };
