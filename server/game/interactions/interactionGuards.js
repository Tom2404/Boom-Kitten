const LEGACY_PENDING_KEYS = [
  'pendingFavor',
  'pendingAlter',
  'pendingBury',
  'pendingGarbage',
  'pendingPotLuck',
  'pendingZombie',
  'pendingDefuse',
  'pendingTargetSelect',
  'pendingFeedTheDead',
  'pendingGraveRobber',
  'pendingDigDeeper',
  'pendingArmageddon',
];

function hasBlockingInteraction(state, { includePendingAction = true, includeNowWindow = false } = {}) {
  if (!state) return false;

  return Boolean(
    (includePendingAction && state.pendingAction) ||
    state.activeInteraction ||
    (includeNowWindow && state.pendingNowOnlyWindow) ||
    LEGACY_PENDING_KEYS.some((key) => Boolean(state[key])),
  );
}

function getCardId(responseData) {
  if (typeof responseData === 'string') return responseData;
  if (responseData && typeof responseData === 'object') return responseData.cardId;
  return null;
}

function getPlayer(state, userId) {
  return state.players.find((player) => player.userId === userId);
}

function validateOwnedCardResponse(state, userId, responseData, { allowEmptyHandSkip = false } = {}) {
  const player = getPlayer(state, userId);
  if (!player) {
    return { valid: false, reason: 'Không tìm thấy người chơi!' };
  }

  const cardId = getCardId(responseData);
  if (!cardId) {
    if (allowEmptyHandSkip && player.hand.length === 0) {
      return { valid: true };
    }
    return { valid: false, reason: 'Bạn phải chọn một lá bài hợp lệ!' };
  }

  if (!player.hand.some((card) => card.id === cardId)) {
    return { valid: false, reason: 'Lá bài đã chọn không còn trên tay bạn!' };
  }

  return { valid: true };
}

function validateAlterFutureResponse(state, interaction, responseData) {
  const count = interaction.metadata?.count || 3;
  const rearrangedCards = Array.isArray(responseData)
    ? responseData
    : responseData?.rearrangedCards;

  if (!Array.isArray(rearrangedCards)) {
    return { valid: false, reason: 'Thứ tự lá bài không hợp lệ!' };
  }

  const topCards = state.deck.slice(Math.max(0, state.deck.length - count));
  if (rearrangedCards.length !== topCards.length) {
    return { valid: false, reason: 'Số lượng lá bài sắp xếp không đúng!' };
  }

  const expectedIds = new Set(topCards.map((card) => card.id));
  const submittedIds = rearrangedCards.map((card) => card?.id);
  if (
    submittedIds.some((id) => !expectedIds.has(id)) ||
    new Set(submittedIds).size !== expectedIds.size
  ) {
    return { valid: false, reason: 'Danh sách lá bài sắp xếp không khớp bộ bài!' };
  }

  return { valid: true };
}

function validateBuryResponse(state, userId, responseData) {
  const cardValidation = validateOwnedCardResponse(state, userId, responseData);
  if (!cardValidation.valid) return cardValidation;

  const insertPosition = responseData && typeof responseData === 'object'
    ? responseData.insertPosition
    : 0;
  const parsedPosition = Number.parseInt(insertPosition, 10);

  if (Number.isNaN(parsedPosition) || parsedPosition < 0 || parsedPosition > state.deck.length) {
    return { valid: false, reason: 'Vị trí chèn lá bài không hợp lệ!' };
  }

  return { valid: true };
}

function validateDigDeeperResponse(responseData) {
  const decision = typeof responseData === 'string' ? responseData : responseData?.decision;
  if (decision !== 'keep' && decision !== 'bottom') {
    return { valid: false, reason: 'Lựa chọn Dig Deeper không hợp lệ!' };
  }
  return { valid: true };
}

function validateInteractionResponse(state, userId, responseData) {
  const interaction = state.activeInteraction;
  if (!interaction) {
    return { valid: false, reason: 'No active interaction' };
  }

  switch (interaction.type) {
    case 'favor':
      return validateOwnedCardResponse(state, userId, responseData);
    case 'alter_the_future':
      return validateAlterFutureResponse(state, interaction, responseData);
    case 'bury':
      return validateBuryResponse(state, userId, responseData);
    case 'garbage_collection':
    case 'pot_luck':
    case 'feed_the_dead':
    case 'grave_robber':
      return validateOwnedCardResponse(state, userId, responseData, { allowEmptyHandSkip: true });
    case 'dig_deeper':
      return validateDigDeeperResponse(responseData);
    default:
      return { valid: true };
  }
}

module.exports = {
  LEGACY_PENDING_KEYS,
  getCardId,
  hasBlockingInteraction,
  validateInteractionResponse,
};
