const BaseEffect = require('./BaseEffect');
const { shuffleDeck } = require('../../deck');

class CollectGraveRobberResponsesEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    let collected = 0;

    Object.entries(payload.responses || {}).forEach(([playerId, response]) => {
      const cardId = typeof response === 'string' ? response : response?.cardId;
      const player = state.players.find((p) => p.userId === playerId);
      if (!player || !cardId) return;

      const cardIndex = player.hand.findIndex((card) => card.id === cardId);
      if (cardIndex === -1) return;

      const [card] = player.hand.splice(cardIndex, 1);
      delete card.marked;
      state.deck.push(card);
      collected += 1;
    });

    if (collected > 0) {
      state.deck = shuffleDeck(state.deck);
    }

    return { status: 'SUCCESS' };
  }
}

module.exports = CollectGraveRobberResponsesEffect;
