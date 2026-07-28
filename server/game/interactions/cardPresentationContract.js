let presentationSequence = 0;

const NOPEABLE_ACTIONS = new Set([
  'attack_2x', 'personal_attack_2x', 'target_attack_2x', 'attack_of_the_dead',
  'skip', 'super_skip',
  'see_the_future_1', 'see_the_future_3', 'see_the_future_5', 'see_the_future_3_now', 'reveal_the_future',
  'alter_the_future_3', 'alter_the_future_5', 'alter_the_future_3_now',
  'favor', 'garbage', 'pot_luck',
  'shuffle', 'shuffle_now',
  'swap_top_and_bottom_now',
  'feed_the_dead',
  'grave_robber',
  'dig_deeper',
  'armageddon',
  'nope',
]);

function createPresentationId() {
  presentationSequence += 1;
  return `presentation-${Date.now()}-${presentationSequence}`;
}

function ensurePresentationId(action, createId = createPresentationId) {
  if (!action.presentationId) action.presentationId = createId();
  return action.presentationId;
}

function isNopeableAction(cardType) {
  return Boolean(cardType) && (NOPEABLE_ACTIONS.has(cardType) || cardType.startsWith('combo_'));
}

module.exports = {
  createPresentationId,
  ensurePresentationId,
  isNopeableAction,
};
