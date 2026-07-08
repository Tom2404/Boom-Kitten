const BaseEffect = require('./BaseEffect');
const { shuffleDeck } = require('../../deck');

class ShuffleDeckEffect extends BaseEffect {
  execute(context) {
    const state = context.state;
    state.deck = shuffleDeck(state.deck);
  }
}

module.exports = ShuffleDeckEffect;
