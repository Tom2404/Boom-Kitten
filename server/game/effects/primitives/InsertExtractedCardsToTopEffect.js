const BaseEffect = require('./BaseEffect');

class InsertExtractedCardsToTopEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const cards = payload.extractedCards;
    
    if (cards && cards.length > 0) {
      // Top of deck is the end of the array. We push them so they become the top.
      state.deck.push(...cards);
    }
    
    return { status: 'SUCCESS' };
  }
}

module.exports = InsertExtractedCardsToTopEffect;
