const BaseEffect = require('./BaseEffect');

class CollectCombo5ResponseEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const owner = state.players.find((player) => player.userId === payload.owner);
    const response = payload.responses?.[payload.owner];
    const cardId = typeof response === 'string' ? response : response?.cardId;
    if (!owner || !cardId) return { status: 'FAILED', error: 'Missing combo 5 response data' };

    const cardIndex = state.discardPile.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) return { status: 'FAILED', error: 'Discard card not found' };

    const [card] = state.discardPile.splice(cardIndex, 1);
    delete card.marked;
    owner.hand.push(card);
    return { status: 'SUCCESS' };
  }
}

module.exports = CollectCombo5ResponseEffect;
