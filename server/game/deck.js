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
  attack_of_the_dead: 3,
  feed_the_dead: 1,
  grave_robber: 1,
  clairvoyance: 1,
  dig_deeper: 4,
  godcat: 1,
  armageddon: 3,
  barking_kitten: 2,
  reveal_the_future_3x: 3,
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
  clairvoyance: 2,
  dig_deeper: 2,
  godcat: 2,
  armageddon: 2,
  barking_kitten: 2,
  reveal_the_future_3x: 2,
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

function getCardCounts(playerCount, edition = 'all') {
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
  
  // Base original cards are always included for other editions
  const baseTypes = [
    'nope', 'attack', 'skip', 'see_the_future_3', 'shuffle', 'favor',
    'cat_taco', 'cat_watermelon', 'cat_beard', 'cat_rainbow', 'cat_potato'
  ];
  
  baseTypes.forEach((type) => {
    counts[type] = CARD_COUNTS[type];
  });
  
  // Add expansion cards selectively based on edition
  if (edition === 'all') {
    counts.attack_of_the_dead = CARD_COUNTS.attack_of_the_dead;
    counts.feed_the_dead = CARD_COUNTS.feed_the_dead;
    counts.grave_robber = CARD_COUNTS.grave_robber;
    counts.dig_deeper = CARD_COUNTS.dig_deeper;
  }
  
  if (edition === 'all' || edition === 'barking') {
    counts.barking_kitten = CARD_COUNTS.barking_kitten;
    counts.clairvoyance = CARD_COUNTS.clairvoyance;
    counts.reveal_the_future_3x = CARD_COUNTS.reveal_the_future_3x;
  }
  
  if (edition === 'all' || edition === 'good_vs_evil') {
    counts.godcat = CARD_COUNTS.godcat;
    counts.armageddon = CARD_COUNTS.armageddon;
  }
  
  return counts;
}

function createDeck(playerCount, edition = 'all') {
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

function dealCards(deck, players, handSize = 7, edition = 'all') {
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

  // Remaining defuses are excluded from the draw pile as per project rules (0 Defuses in deck)

  // Add Exploding Kittens to remaining deck
  const explodingCount = edition === '2_player' ? 1 : Math.max(0, players.length - 1);
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
