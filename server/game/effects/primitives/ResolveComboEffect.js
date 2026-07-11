const BaseEffect = require('./BaseEffect');
const { handleCombo } = require('../../gameLogic');
const RequestInteractionEffect = require('./RequestInteractionEffect');

class ResolveComboEffect extends BaseEffect {
  execute(context, payload = {}) {
    const cardIds = payload.options?.cardIds || payload.options?.cards || [];
    const result = handleCombo(context.state, payload.userId, cardIds, payload.targetPlayerId);

    if (!result) {
      return { status: 'FAILED', error: 'Invalid combo' };
    }

    if (cardIds.length === 2 && payload.targetPlayerId) {
      const target = context.state.players.find((player) => player.userId === payload.targetPlayerId);
      if (!target || !target.alive || target.hand.length === 0) {
        return { status: 'NO_EFFECT', data: result };
      }

      return new RequestInteractionEffect({
        type: 'favor',
        duration: 15000,
        onCompleteEffects: [{ type: 'CollectFavorResponse', params: {} }],
      }).execute(context, payload);
    }

    if (cardIds.length === 5) {
      return new RequestInteractionEffect({
        type: 'combo_5',
        duration: 15000,
        onCompleteEffects: [{ type: 'CollectCombo5Response', params: {} }],
      }).execute(context, payload);
    }

    return { status: 'SUCCESS', data: result };
  }
}

module.exports = ResolveComboEffect;
