const BaseEffect = require('./BaseEffect');
const InteractionManager = require('../../interactions/InteractionManager');
const { getInteractionParticipants } = require('../../interactions/interactionPolicy');

class RequestInteractionEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const interactionType = this.params.type; // 'alter_the_future', 'favor', 'bury', etc.
    const duration = this.params.duration || 10000; // time limit in ms, optional

    const owner = payload.userId;

    const metadata = {
      ...(this.params.metadata || {}),
      targetPlayerId: payload.targetPlayerId,
    };

    if (interactionType === 'dig_deeper') {
      const firstCard = state.deck.pop();
      if (!firstCard) {
        return { status: 'NO_EFFECT' };
      }
      metadata.firstCard = firstCard;
      state.pendingDigDeeper = { playerId: owner, firstCard, startedAt: Date.now() };
    }

    const interaction = InteractionManager.createInteraction(context, {
      type: interactionType,
      owner,
      participants: getInteractionParticipants(state, {
        type: interactionType,
        owner,
        targetPlayerId: payload.targetPlayerId,
      }),
      metadata,
      timeout: duration,
      onCompleteEffects: this.params.onCompleteEffects || [],
    });

    if (interaction.status === 'NO_PARTICIPANTS') {
      return { status: 'NO_EFFECT' };
    }

    // Keep legacy support for socket until fully refactored
    if (interactionType === 'favor') {
      state.pendingFavor = { fromPlayerId: payload.userId, targetPlayerId: payload.targetPlayerId, startedAt: Date.now() };
    } else if (interactionType === 'alter_the_future') {
      state.pendingAlter = { playerId: payload.userId, count: this.params.metadata.count || 3, startedAt: Date.now() };
    } else if (interactionType === 'bury') {
      state.pendingBury = { playerId: payload.userId, startedAt: Date.now() };
    } else if (interactionType === 'pot_luck') {
      state.pendingPotLuck = { playerId: payload.userId, startedAt: Date.now() };
    } else if (interactionType === 'garbage_collection') {
      state.pendingGarbage = { playerId: payload.userId, startedAt: Date.now() };
    } else if (interactionType === 'feed_the_dead') {
      state.pendingFeedTheDead = { playerId: payload.userId, targetPlayerId: payload.targetPlayerId, startedAt: Date.now() };
    } else if (interactionType === 'grave_robber') {
      state.pendingGraveRobber = { playerId: payload.userId, startedAt: Date.now() };
    } else if (interactionType === 'armageddon') {
      state.pendingArmageddon = { playerId: payload.userId, targetPlayerId: payload.targetPlayerId, stage: 'distribute', startedAt: Date.now() };
    } else if (interactionType === 'combo_5') {
      state.pendingCombo5 = { playerId: payload.userId, startedAt: Date.now() };
    }

    return { status: 'WAIT_INPUT', data: { interaction } };
  }
}

module.exports = RequestInteractionEffect;
