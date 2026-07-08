// Card definitions acting as a single source of truth for all cards and editions.
// This replaces the hardcoded SKIN_COUNTS, CARD_COUNTS, and getCardCounts in deck.js.

const CARD_DEFINITIONS = {
  // Base original cards
  nope: { skins: 10, counts: { original: 5, '2_player': 2, zombie: 4 } },
  attack: { 
    skins: 8, 
    counts: { original: 4, '2_player': 2 },
    effects: [
      { type: 'AlterTurnCount', params: { countDelta: 2 } }
    ]
  },
  skip: { 
    skins: 8, 
    counts: { original: 4, '2_player': 2, zombie: 4, imploding: 5 },
    effects: [
      { type: 'EndTurnWithoutDraw', params: { super: false } }
    ]
  },
  see_the_future_3: { 
    skins: 10, 
    counts: { original: 5, '2_player': 3, zombie: 3 },
    effects: [
      { type: 'PeekDeck', params: { count: 3 } }
    ]
  },
  shuffle: { 
    skins: 8, 
    counts: { original: 4, '2_player': 2, zombie: 3 },
    effects: [
      { type: 'ShuffleDeck', params: {} }
    ]
  },
  favor: { 
    skins: 6, 
    counts: { original: 4, '2_player': 2, zombie: 3 },
    effects: [
      { type: 'RequestInteraction', params: { type: 'favor', duration: 15000, onCompleteEffects: [{ type: 'CollectFavorResponse', params: {} }] } }
    ]
  },
  
  // Normal Cat cards
  cat_taco: { skins: 1, counts: { original: 4, '2_player': 2, zombie: 2 } },
  cat_watermelon: { skins: 1, counts: { original: 4, '2_player': 2, zombie: 2 } },
  cat_beard: { skins: 1, counts: { original: 4, '2_player': 2, zombie: 2 } },
  cat_potato: { skins: 1, counts: { original: 4, '2_player': 2, zombie: 2 } },
  cat_rainbow: { skins: 1, counts: { original: 4, zombie: 2 } }, // No 2_player count in deck.js for rainbow
  
  // Special/Action kittens
  defuse: { skins: 18, counts: {} }, // Handled dynamically during dealCards
  exploding_kitten: { skins: 13, counts: {} }, // Handled dynamically during dealCards
  
  // Zombie Kittens expansion
  zombie_kitten: { skins: 5, counts: {} }, // Handled dynamically
  attack_of_the_dead: { 
    skins: 3, 
    counts: { zombie: 2 },
    effects: [
      { type: 'AlterTurnCount', params: { forceTarget: false, shouldPassTurn: true } }
    ]
  },
  feed_the_dead: { 
    skins: 1, 
    counts: { zombie: 2 },
    effects: [
      { type: 'RequestInteraction', params: { type: 'feed_the_dead', duration: 15000, onCompleteEffects: [{ type: 'CollectFeedTheDeadResponses', params: {} }] } }
    ]
  },
  grave_robber: { 
    skins: 1, 
    counts: { zombie: 2 },
    effects: [
      { type: 'RequestInteraction', params: { type: 'grave_robber', duration: 15000, onCompleteEffects: [{ type: 'CollectGraveRobberResponses', params: {} }] } }
    ]
  },
  clairvoyance_now: { skins: 2, counts: { zombie: 2, barking: 2 } },
  dig_deeper: { 
    skins: 4, 
    counts: { zombie: 2 },
    effects: [
      { type: 'RequestInteraction', params: { type: 'dig_deeper', duration: 15000, onCompleteEffects: [{ type: 'ApplyDigDeeperResponse', params: {} }] } }
    ]
  },
  
  // Good vs Evil expansion
  godcat: { skins: 1, counts: { good_vs_evil: 2 } },
  devilcat: { skins: 1, counts: { good_vs_evil: 1 } },
  armageddon: { 
    skins: 3, 
    counts: { good_vs_evil: 2 },
    effects: [
      { type: 'RequestInteraction', params: { type: 'armageddon', duration: 15000 } }
    ]
  },
  
  // Barking Kittens expansion
  barking_kitten: { skins: 2, counts: { barking: 2 } },
  reveal_the_future_3x: { skins: 3, counts: { barking: 2 } },
  
  // Imploding Kittens expansion
  alter_the_future_3: { 
    skins: 4, 
    counts: { imploding: 3 },
    effects: [
      { type: 'RequestInteraction', params: { type: 'alter_the_future', duration: 15000, metadata: { count: 3 }, onCompleteEffects: [{ type: 'ApplyAlterFutureResponse', params: {} }] } }
    ]
  },
  draw_from_bottom: { 
    skins: 1, 
    counts: { imploding: 3 },
    effects: [
      { type: 'DrawSpecificCard', params: { position: 'bottom' } }
    ]
  },
  reverse: { 
    skins: 4, 
    counts: { imploding: 3 },
    effects: [
      { type: 'ReverseDirection', params: {} },
      { type: 'EndTurnWithoutDraw', params: { super: false } }
    ]
  },
  target_attack_2x: { 
    skins: 3, 
    counts: { imploding: 3 },
    effects: [
      { type: 'AlterTurnCount', params: { countDelta: 2, forceTarget: true } }
    ]
  },
  catomic_bomb: { 
    skins: 1, 
    counts: { imploding: 1, streaking: 1 },
    effects: [
      { type: 'ExtractCards', params: { matchTypes: ['exploding_kitten', 'imploding_kitten'] } },
      { type: 'ShuffleDeck', params: {} },
      { type: 'InsertExtractedCardsToTop', params: {} },
      { type: 'EndTurnWithoutDraw', params: { super: false } }
    ]
  },
  feral_cat: { skins: 1, counts: { imploding: 4 } },
  imploding_kitten: { skins: 1, counts: {} }, // Handled dynamically
  
  // Streaking Kittens expansion
  streaking_kitten: { skins: 1, counts: { streaking: 1 } },
  pot_luck: { 
    skins: 1, 
    counts: { streaking: 1 },
    effects: [
      { type: 'RequestInteraction', params: { type: 'pot_luck', duration: 20000, onCompleteEffects: [{ type: 'CollectPotLuckResponses', params: {} }] } }
    ]
  },
  super_skip: { 
    skins: 1, 
    counts: { streaking: 1 },
    effects: [
      { type: 'EndTurnWithoutDraw', params: { super: true } }
    ]
  },
  see_the_future_1: { 
    skins: 1, 
    counts: {},
    effects: [
      { type: 'PeekDeck', params: { count: 1 } }
    ]
  },
  see_the_future_5: { 
    skins: 1, 
    counts: { streaking: 3 },
    effects: [
      { type: 'PeekDeck', params: { count: 5 } }
    ]
  },
  alter_the_future_5: { 
    skins: 1, 
    counts: { streaking: 2 },
    effects: [
      { type: 'RequestInteraction', params: { type: 'alter_the_future', duration: 15000, metadata: { count: 5 }, onCompleteEffects: [{ type: 'ApplyAlterFutureResponse', params: {} }] } }
    ]
  },
  swap_top_and_bottom: { 
    skins: 1, 
    counts: { streaking: 1 },
    effects: [
      { type: 'SwapTopBottom', params: {} }
    ]
  },
  mark: { 
    skins: 1, 
    counts: { streaking: 3 },
    effects: [
      { type: 'MarkCard', params: { target: 'targetPlayer' } }
    ]
  },
  garbage_collection: { 
    skins: 1, 
    counts: { streaking: 1 },
    effects: [
      { type: 'RequestInteraction', params: { type: 'garbage_collection', duration: 20000, onCompleteEffects: [{ type: 'CollectGarbageResponses', params: {} }] } }
    ]
  },
  curse_of_the_cat_butt: { 
    skins: 2, 
    counts: { streaking: 2 },
    effects: [
      { type: 'ApplyStatus', params: { statusId: 'blinded', target: 'targetPlayer' } }
    ]
  },
};

/**
 * Gets the number of required cards of each type based on the edition.
 * @param {string} edition - The edition to build a deck for.
 * @returns {Record<string, number>} Object mapping card type to its required count.
 */
function getDeckConfiguration(edition = 'original') {
  const deckConfig = {};

  Object.entries(CARD_DEFINITIONS).forEach(([type, def]) => {
    let count = 0;

    if (def.counts[edition] !== undefined) {
      // Explicit override for the edition
      count = def.counts[edition];
    } else if (def.counts.original !== undefined && edition !== '2_player' && edition !== 'zombie') {
      // Standard expansions usually include original base cards
      count = def.counts.original;
    }
    
    if (count > 0) {
      deckConfig[type] = count;
    }
  });

  return deckConfig;
}

/**
 * Gets the skin count for a given card type.
 * @param {string} type - The card type.
 * @returns {number} The number of available skins.
 */
function getSkinCount(type) {
  return CARD_DEFINITIONS[type]?.skins || 1;
}

module.exports = {
  CARD_DEFINITIONS,
  getDeckConfiguration,
  getSkinCount,
};
