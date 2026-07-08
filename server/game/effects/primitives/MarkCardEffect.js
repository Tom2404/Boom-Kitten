const BaseEffect = require('./BaseEffect');

class MarkCardEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const target = this.params.target || 'targetPlayer'; // can be 'self', 'targetPlayer'
    
    // Resolve target userId
    let targetId;
    if (target === 'self') {
      targetId = payload.userId;
    } else if (target === 'targetPlayer') {
      targetId = payload.targetPlayerId;
    }

    if (!targetId) return { status: 'FAILED' };

    const player = state.players.find(p => p.userId === targetId);
    if (!player || player.hand.length === 0) return { status: 'NO_EFFECT' };

    // Select a random unmarked card
    const unmarkedCards = player.hand.filter(c => !c.marked);
    if (unmarkedCards.length === 0) return { status: 'NO_EFFECT' }; // all cards already marked

    const randIdx = Math.floor(Math.random() * unmarkedCards.length);
    unmarkedCards[randIdx].marked = true;

    return { status: 'SUCCESS' };
  }
}

module.exports = MarkCardEffect;
