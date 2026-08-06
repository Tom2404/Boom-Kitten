/**
 * Shared Card Types, Categories, and Editions
 * Single Source of Truth
 */
const CARD_TYPES = Object.freeze({
  EXPLODING_KITTEN: 'EXPLODING_KITTEN',
  DEFUSE: 'DEFUSE',
  NOPE: 'NOPE',
  ATTACK: 'ATTACK',
  SKIP: 'SKIP',
  FAVOR: 'FAVOR',
  SHUFFLE: 'SHUFFLE',
  SEE_THE_FUTURE: 'SEE_THE_FUTURE',
  TACOCAT: 'TACOCAT',
  CATTERMELON: 'CATTERMELON',
  HAIRY_POTATO_CAT: 'HAIRY_POTATO_CAT',
  RAINBOW_RALPHING_CAT: 'RAINBOW_RALPHING_CAT',
  BEARD_CAT: 'BEARD_CAT',
  
  // Expansion Cards
  BARKING_KITTEN: 'BARKING_KITTEN',
  ALTER_THE_FUTURE: 'ALTER_THE_FUTURE',
  DRAW_FROM_BOTTOM: 'DRAW_FROM_BOTTOM',
  FERAL_CAT: 'FERAL_CAT',
  TARGETED_ATTACK: 'TARGETED_ATTACK',
  SUPER_SKIP: 'SUPER_SKIP',
  PERSONAL_ATTACK: 'PERSONAL_ATTACK',
});

const COMBO_TYPES = Object.freeze({
  PAIR: 'PAIR',             // 2 of a kind: steal random card
  THREE_OF_A_KIND: 'THREE_OF_A_KIND', // 3 of a kind: request specific card
  FIVE_DIFFERENT: 'FIVE_DIFFERENT',   // 5 different: pick card from discard pile
});

const EDITIONS = Object.freeze({
  CLASSIC: 'classic',
  STREAKING: 'streaking',
  BARKING: 'barking',
  IMPLODING: 'imploding',
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CARD_TYPES, COMBO_TYPES, EDITIONS };
}

export { CARD_TYPES, COMBO_TYPES, EDITIONS };
