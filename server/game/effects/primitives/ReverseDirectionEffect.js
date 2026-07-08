const BaseEffect = require('./BaseEffect');

class ReverseDirectionEffect extends BaseEffect {
  execute(context) {
    const state = context.state;
    state.playDirection = -(state.playDirection ?? 1);
  }
}

module.exports = ReverseDirectionEffect;
