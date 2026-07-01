const BaseEffect = require('./BaseEffect');

class ExtractCardsEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const matchTypes = this.params.matchTypes || []; // e.g. ['exploding_kitten', 'imploding_kitten']

    const extracted = [];
    const remaining = [];

    state.deck.forEach((card) => {
      if (matchTypes.includes(card.type)) {
        extracted.push(card);
      } else {
        remaining.push(card);
      }
    });

    state.deck = remaining;
    
    // Pass extracted cards forward in payload so subsequent effects can use them
    payload.extractedCards = extracted;

    return { status: 'SUCCESS' };
  }
}

module.exports = ExtractCardsEffect;
