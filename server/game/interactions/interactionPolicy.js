function getInteractionParticipants(state, { type, owner, targetPlayerId }) {
  const players = state?.players || [];
  const alivePlayers = players.filter((player) => player.alive);
  const participantsByType = {
    alter_the_future: [owner],
    bury: [owner],
    dig_deeper: [owner],
    armageddon: [owner],
    favor: targetPlayerId ? [targetPlayerId] : [],
    feed_the_dead: alivePlayers
      .filter((player) => player.userId !== owner)
      .map((player) => player.userId),
    pot_luck: alivePlayers.map((player) => player.userId),
    garbage_collection: alivePlayers.map((player) => player.userId),
    grave_robber: players
      .filter((player) => !player.alive && player.hand.length > 0)
      .map((player) => player.userId),
    combo_5: [owner],
  };

  return (participantsByType[type] || [owner]).filter(Boolean);
}

function getNopeResponseOwnerId(pendingAction) {
  return pendingAction?.responseOwnerId || pendingAction?.playerId || null;
}

function isNopeResponderEligible(state, pendingAction, playerId) {
  const player = state?.players?.find((candidate) => candidate.userId === playerId);
  return Boolean(
    player?.alive
    && playerId !== getNopeResponseOwnerId(pendingAction),
  );
}

function sanitizeActiveInteractionForPublic(interaction) {
  if (!interaction) return null;
  return {
    id: interaction.id,
    type: interaction.type,
    owner: interaction.owner,
    status: interaction.status,
    startedAt: interaction.startedAt,
    timeout: interaction.timeout,
    respondedCount: Object.keys(interaction.responses || {}).length,
    participantCount: interaction.participants?.length || 0,
  };
}

module.exports = {
  getInteractionParticipants,
  getNopeResponseOwnerId,
  isNopeResponderEligible,
  sanitizeActiveInteractionForPublic,
};
