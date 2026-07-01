const BaseEffect = require('./BaseEffect');
const gameLogic = require('../../gameLogic'); // Reusing existing passTurn logic

class EndTurnWithoutDrawEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    
    if (this.params.super) {
      state.drawsRequired = 1;
      gameLogic.passTurn(state);
    } else {
      if (state.drawsRequired && state.drawsRequired > 1) {
        state.drawsRequired -= 1;
      } else {
        state.drawsRequired = 1;
        gameLogic.passTurn(state);
      }
    }
  }
}

module.exports = EndTurnWithoutDrawEffect;
