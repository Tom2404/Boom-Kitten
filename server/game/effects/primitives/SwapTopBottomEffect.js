const BaseEffect = require('./BaseEffect');

class SwapTopBottomEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    if (state.deck.length >= 2) {
      const top = state.deck.pop();
      const bottom = state.deck.shift();
      state.deck.push(bottom);
      state.deck.unshift(top);
      return { status: 'SUCCESS' };
    }
    return { status: 'NO_EFFECT' };
  }
}

module.exports = SwapTopBottomEffect;
