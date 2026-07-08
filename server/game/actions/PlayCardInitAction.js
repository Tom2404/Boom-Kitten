const PlayCardAction = require('./PlayCardAction');
const { playCard } = require('../gameLogic');

class PlayCardInitAction extends PlayCardAction {
  validate(context, payload) {
    const validation = super.validate(context, payload);
    if (!validation.valid) return validation;

    const finalPayload = validation.payload || payload;
    const { userId, cardType, options = {} } = finalPayload;
    const player = context.getPlayer(userId);
    if (!player) {
      return { valid: false, error: 'Không tìm thấy người chơi!' };
    }

    const card = options.cardId
      ? player.hand.find((c) => c.id === options.cardId)
      : player.hand.find((c) => c.type === cardType);

    if (!card) {
      return { valid: false, error: 'Không tìm thấy lá bài trên tay!' };
    }

    if (!options.cardId && (cardType === 'nope' || cardType === 'defuse')) {
      return { valid: false, error: 'Không thể đánh lá bài này trực tiếp!' };
    }

    return { valid: true, payload: finalPayload };
  }

  execute(context, payload) {
    const actualCardType = playCard(
      context.state,
      payload.userId,
      payload.cardType,
      payload.finalTargetPlayerId ?? payload.targetPlayerId,
      payload.options || {},
    );

    payload.actualCardType = actualCardType;
    payload.finalTargetPlayerId = payload.finalTargetPlayerId ?? payload.targetPlayerId;
  }
}

module.exports = PlayCardInitAction;
