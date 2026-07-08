const BaseEffect = require('./BaseEffect');

class HoldBombEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const player = state.players.find(p => p.userId === payload.playerId);
    if (!player) return;

    // Put the drawn bomb card directly into the player's hand silently.
    player.hand.push(payload.drawnCard);
  }
}

module.exports = HoldBombEffect;
