const BaseEffect = require('./BaseEffect');

class ConsumeDefuseEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const player = state.players.find(p => p.userId === payload.playerId);
    if (!player) return;

    // payload.defuseCard contains the matched defuse/zombie card from Condition.
    const usedCard = payload.defuseCard;
    if (!usedCard) return;

    const idx = player.hand.findIndex(c => c.id === usedCard.id);
    if (idx >= 0) {
      const [removedCard] = player.hand.splice(idx, 1);
      delete removedCard.marked;
      state.discardPile.push(removedCard);

      // Trigger legacy socket event if needed
      if (payload.onDefuseCallback) {
        payload.onDefuseCallback(payload.playerId, removedCard.type);
      }
    }
  }
}

module.exports = ConsumeDefuseEffect;
