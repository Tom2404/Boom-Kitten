const BaseEffect = require('./BaseEffect');
const gameLogic = require('../../gameLogic'); // Reusing passTurn logic

class AlterTurnCountEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    // Allow payload to override countDelta for dynamic cards like attack_of_the_dead
    const countDelta = payload.countDelta !== undefined ? payload.countDelta : (this.params.countDelta || 0);
    const { forceTarget = false, shouldPassTurn = true } = this.params;
    
    // Attack stacks! Adds X draws to next player (or target)
    state.drawsRequired = (state.drawsRequired ?? 1) > 1 
      ? state.drawsRequired + countDelta 
      : countDelta;

    if (forceTarget && payload.targetPlayerId) {
      const targetIdx = state.players.findIndex((p) => p.userId === payload.targetPlayerId);
      if (targetIdx >= 0 && state.players[targetIdx].alive) {
        state.currentPlayerIndex = targetIdx;
        return;
      }
    }

    // Default: pass the turn to the next player (if requested)
    if (shouldPassTurn) {
      gameLogic.passTurn(state);
    }
  }
}

module.exports = AlterTurnCountEffect;
