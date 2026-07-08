const BaseEffect = require('./BaseEffect');

class TransferCardEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const { fromId, fromRegion, toId, toRegion, cardId } = this.params;
    
    // Defaulting missing regions to 'hand'
    const sourceRegion = fromRegion || 'hand';
    const destRegion = toRegion || 'hand';

    let cardToMove = null;
    let sourceContainer = null;
    
    // Resolve source
    if (sourceRegion === 'hand') {
      const fromPlayer = state.players.find(p => p.userId === fromId);
      if (!fromPlayer) return { status: 'NO_EFFECT' };
      sourceContainer = fromPlayer.hand;
    } else if (sourceRegion === 'discardPile') {
      sourceContainer = state.discardPile;
    } else if (sourceRegion === 'deck') {
      sourceContainer = state.deck;
    }

    if (!sourceContainer) return { status: 'NO_EFFECT' };

    // Find card in source
    const idx = sourceContainer.findIndex(c => c.id === cardId);
    if (idx === -1) return { status: 'NO_EFFECT' };

    // Remove card
    cardToMove = sourceContainer.splice(idx, 1)[0];
    delete cardToMove.marked; // Clean any state flags

    // Resolve destination
    let destContainer = null;
    if (destRegion === 'hand') {
      const toPlayer = state.players.find(p => p.userId === toId);
      if (!toPlayer) {
        // If destination player is dead/missing, just dump to discard
        state.discardPile.push(cardToMove);
        return { status: 'FAILED' };
      }
      destContainer = toPlayer.hand;
    } else if (destRegion === 'discardPile') {
      destContainer = state.discardPile;
    } else if (destRegion === 'deck') {
      destContainer = state.deck; // Appends to top (end of array)
    }

    if (destContainer) {
      destContainer.push(cardToMove);
    } else {
       state.discardPile.push(cardToMove); // Fallback
    }

    return { status: 'SUCCESS' };
  }
}

module.exports = TransferCardEffect;
