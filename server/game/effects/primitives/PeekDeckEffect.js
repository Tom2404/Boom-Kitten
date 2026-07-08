const BaseEffect = require('./BaseEffect');

class PeekDeckEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const count = this.params.count || 3;
    
    // Peek at the top 'count' cards
    // Deck is pushed from bottom, so top is at the end.
    // wait, in this game deck is pushed from bottom?
    // In `gameLogic.js` `drawFromDeck`: `return deck.pop()`.
    // So top of deck is the last element.
    const peekedCards = state.deck.slice(-count).reverse(); // Reverse so index 0 is the very top

    return { 
      status: 'SUCCESS', 
      data: { peekedCards } 
    };
  }
}

module.exports = PeekDeckEffect;
