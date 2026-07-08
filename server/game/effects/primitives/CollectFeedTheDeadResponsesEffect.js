const BaseEffect = require('./BaseEffect');

class CollectFeedTheDeadResponsesEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const targetPlayerId = payload.metadata?.targetPlayerId;
    const target = state.players.find((player) => player.userId === targetPlayerId);

    if (!target) {
      return { status: 'FAILED', error: 'Feed the Dead target not found' };
    }

    Object.entries(payload.responses || {}).forEach(([playerId, response]) => {
      const cardId = typeof response === 'string' ? response : response?.cardId;
      const giver = state.players.find((player) => player.userId === playerId);
      if (!giver || !cardId) return;

      const cardIndex = giver.hand.findIndex((card) => card.id === cardId);
      if (cardIndex === -1) return;

      const [card] = giver.hand.splice(cardIndex, 1);
      delete card.marked;
      target.hand.push(card);
    });

    return { status: 'SUCCESS' };
  }
}

module.exports = CollectFeedTheDeadResponsesEffect;
