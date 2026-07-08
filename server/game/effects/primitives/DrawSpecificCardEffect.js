const BaseEffect = require('./BaseEffect');
const { drawCard } = require('../../gameLogic');

class DrawSpecificCardEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const player = state.players.find(p => p.userId === payload.userId);
    if (!player) return { status: 'FAILED' };

    const position = this.params.position || 'bottom'; // 'bottom' or 'top' or index

    if (position === 'bottom' || position === 'top') {
      drawCard(state, payload.userId, position === 'bottom', payload.onDefuseCallback);
      return { status: 'SUCCESS' };
    }
    
    if (state.deck.length === 0) {
      return { status: 'NO_EFFECT' };
    }

    let card;
    if (position === 'bottom') {
      card = state.deck.shift();
    } else if (position === 'top') {
      card = state.deck.pop();
    } else {
      const idx = Math.max(0, Math.min(position, state.deck.length - 1));
      card = state.deck.splice(idx, 1)[0];
    }

    // Since this is technically a "draw", we need to run explosion logic if it's a bomb
    if (card.type === 'exploding_kitten' || card.type === 'imploding_kitten' || card.type === 'devilcat') {
      const ExplosionEngine = require('../ExplosionEngine');
      const engine = new ExplosionEngine(null);
      engine.resolve({
        gameState: state,
        playerId: player.userId,
        drawnCard: card,
        onDefuseCallback: payload.onDefuseCallback
      });
      // End turn automatically handled by Kill/WaitInsert effects if applicable
      return { status: 'SUCCESS' };
    }

    player.hand.push(card);
    player.blinded = false; // Lifting curse on successful draw
    return { status: 'SUCCESS' };
  }
}

module.exports = DrawSpecificCardEffect;
