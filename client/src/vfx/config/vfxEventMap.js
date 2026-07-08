const CARD_ALIASES = {
  exploding_kitten: 'CARD_EXPLODING_KITTEN',
  imploding_kitten: 'CARD_EXPLODING_KITTEN',
  defuse: 'CARD_DEFUSE',
  skip: 'CARD_SKIP',
  super_skip: 'CARD_SUPER_SKIP',
  reverse: 'CARD_REVERSE',
  nope: 'CARD_NOPE',
  attack: 'CARD_ATTACK',
  attack_2x: 'CARD_ATTACK_2X',
  target_attack: 'CARD_TARGET_ATTACK',
  shuffle: 'CARD_SHUFFLE',
  shuffle_now: 'CARD_SHUFFLE_NOW',
};

export function cardTypeToAnimKey(cardType) {
  if (!cardType) return 'CARD_GENERIC';
  const cleanType = String(cardType).replace(/^discard_/, '').toLowerCase();
  if (CARD_ALIASES[cleanType]) return CARD_ALIASES[cleanType];
  return `CARD_${cleanType.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}

export function gameEventToAnimKey(eventName, payload = {}) {
  if (eventName === 'game:cardDrawn') return 'DRAW_CARD';
  if (eventName === 'game:drewKitten') return 'CARD_EXPLODING_KITTEN';
  if (eventName === 'game:exploded') return 'EXPLOSION';
  if (eventName === 'game:nopeWindow' || eventName === 'game:nopeResult') return 'CARD_NOPE';
  if (eventName === 'game:turnChanged') return 'ENV_TURN_TRANSITION';
  // game:cardPlayedPending — small card fly animation only, NOT a main VFX
  if (eventName === 'game:cardPlayedPending') return 'CARD_FLY_SMALL';
  // game:actionResolved — main VFX, determined by result + vfxType
  if (eventName === 'game:actionResolved') return mapResolvedActionToAnimKey(payload);
  // game:cardPlayed is kept for Nope card or animationOnly cases
  if (eventName === 'game:cardPlayed') return cardTypeToAnimKey(payload.displayCardType || payload.cardType);
  return payload.animKey || 'CARD_GENERIC';
}

/**
 * Returns the correct animation key for a resolved action.
 * CANCELLED actions always show the Nope/Cancel VFX regardless of original card type.
 * RESOLVED actions show the main VFX for the card/combo type.
 */
export function mapResolvedActionToAnimKey(payload = {}) {
  if (!payload) return 'CARD_GENERIC';
  if (payload.result === 'CANCELLED' || (payload.nopeCount && payload.nopeCount % 2 === 1)) {
    return 'CARD_NOPE';
  }
  return cardTypeToAnimKey(
    payload.vfxType || payload.comboType || payload.cardType
  );
}
