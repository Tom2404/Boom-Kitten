function getInteractionEventName(type) {
  const eventNames = {
    alter_the_future: 'alterFuture',
    garbage_collection: 'garbage',
  };
  return eventNames[type] || type.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
}

function buildInteractionRequestPayload(interaction, gameState) {
  const requestPayload = { timeoutMs: interaction.timeout };

  if (interaction.type === 'alter_the_future') {
    const count = interaction.metadata.count || 3;
    requestPayload.cards = gameState.deck.slice(-count).reverse();
    requestPayload.count = count;
  } else if (interaction.type === 'favor') {
    requestPayload.fromPlayerId = interaction.owner;
  } else if (interaction.type === 'feed_the_dead') {
    requestPayload.targetPlayerId = interaction.metadata.targetPlayerId;
  } else if (interaction.type === 'dig_deeper') {
    requestPayload.firstCard = interaction.metadata.firstCard;
  } else if (interaction.type === 'armageddon') {
    requestPayload.stage = gameState.pendingArmageddon?.stage || 'distribute';
  }

  return requestPayload;
}

function buildNormalizedInteractionRequest(interaction, participantId, requestPayload = {}) {
  return {
    interactionId: interaction.id,
    type: interaction.type,
    owner: interaction.owner,
    participantId,
    timeoutMs: interaction.timeout,
    metadata: interaction.metadata || {},
    ...requestPayload,
  };
}

module.exports = {
  buildInteractionRequestPayload,
  buildNormalizedInteractionRequest,
  getInteractionEventName,
};
