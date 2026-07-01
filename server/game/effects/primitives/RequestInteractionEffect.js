const BaseEffect = require('./BaseEffect');

class RequestInteractionEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const interactionType = this.params.type; // 'alter_the_future', 'favor', 'bury', etc.
    const duration = this.params.duration || 10000; // time limit in ms, optional
    
    // Instead of legacy 'pendingAlter', we use a standardized activeInteraction
    state.activeInteraction = {
      type: interactionType,
      requesterId: payload.userId,
      targetId: payload.targetPlayerId, // optional
      startedAt: Date.now(),
      duration,
      metadata: this.params.metadata || {}
    };

    // Keep legacy support for socket until fully refactored
    if (interactionType === 'favor') {
      state.pendingFavor = { fromPlayerId: payload.userId, targetPlayerId: payload.targetPlayerId, startedAt: Date.now() };
    } else if (interactionType === 'alter_the_future') {
      state.pendingAlter = { playerId: payload.userId, count: this.params.metadata.count || 3, startedAt: Date.now() };
    } else if (interactionType === 'bury') {
      state.pendingBury = { playerId: payload.userId, startedAt: Date.now() };
    }

    return { status: 'WAIT_INPUT', data: { interaction: state.activeInteraction } };
  }
}

module.exports = RequestInteractionEffect;
