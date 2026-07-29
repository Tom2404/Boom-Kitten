const BaseEffect = require('./BaseEffect');
const { checkStreakingKittenEffect } = require('../../gameLogic');

class CollectCombo3ResponseEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const owner = state.players.find((player) => player.userId === payload.owner);
    const target = state.players.find((player) => player.userId === payload.metadata?.targetPlayerId);
    const response = payload.responses?.[payload.owner];
    const cardType = typeof response === 'string' ? response : response?.cardType;
    if (!owner || !target || !cardType) return { status: 'FAILED', error: 'Missing combo 3 response data' };

    const cardIndex = target.hand.findIndex((card) => card.type === cardType);
    if (cardIndex === -1) return { status: 'NO_EFFECT' };

    const [card] = target.hand.splice(cardIndex, 1);
    delete card.marked;
    owner.hand.push(card);
    checkStreakingKittenEffect(state, owner.userId);
    checkStreakingKittenEffect(state, target.userId);
    return { status: 'SUCCESS', data: { cardType } };
  }
}

module.exports = CollectCombo3ResponseEffect;
