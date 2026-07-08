const BaseEffect = require('./BaseEffect');

class ApplyBuryResponseEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const ownerId = payload.owner;
    const response = payload.responses?.[ownerId];
    const cardId = typeof response === 'string' ? response : response?.cardId;
    const insertPosition = typeof response === 'object' ? response?.insertPosition : 0;

    const player = state.players.find((p) => p.userId === ownerId);
    if (!player || !cardId) {
      return { status: 'FAILED', error: 'Missing bury response data' };
    }

    const cardIndex = player.hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) {
      return { status: 'FAILED', error: 'Bury card not found' };
    }

    const [card] = player.hand.splice(cardIndex, 1);
    delete card.marked;

    let pos = parseInt(insertPosition, 10);
    if (Number.isNaN(pos)) pos = 0;
    pos = Math.max(0, Math.min(pos, state.deck.length));
    state.deck.splice(pos, 0, card);

    return { status: 'SUCCESS' };
  }
}

module.exports = ApplyBuryResponseEffect;
