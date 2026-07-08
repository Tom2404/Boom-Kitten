const BaseEffect = require('./BaseEffect');

class CollectFavorResponseEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const ownerId = payload.owner;
    const targetPlayerId = payload.metadata?.targetPlayerId;
    const response = targetPlayerId ? payload.responses?.[targetPlayerId] : null;
    const cardId = typeof response === 'string' ? response : response?.cardId;

    if (!ownerId || !targetPlayerId || !cardId) {
      return { status: 'FAILED', error: 'Missing favor response data' };
    }

    const owner = state.players.find((player) => player.userId === ownerId);
    const target = state.players.find((player) => player.userId === targetPlayerId);
    if (!owner || !target) {
      return { status: 'FAILED', error: 'Favor player not found' };
    }

    const cardIndex = target.hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) {
      return { status: 'FAILED', error: 'Favor card not found' };
    }

    const [card] = target.hand.splice(cardIndex, 1);
    delete card.marked;
    owner.hand.push(card);

    return { status: 'SUCCESS' };
  }
}

module.exports = CollectFavorResponseEffect;
