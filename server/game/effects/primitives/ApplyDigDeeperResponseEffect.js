const BaseEffect = require('./BaseEffect');
const { resolveDigDeeper } = require('../../gameLogic');

class ApplyDigDeeperResponseEffect extends BaseEffect {
  execute(context, payload = {}) {
    const ownerId = payload.owner;
    const response = payload.responses?.[ownerId];
    const decision = typeof response === 'string' ? response : response?.decision;

    if (!decision) {
      return { status: 'FAILED', error: 'Missing dig deeper decision' };
    }

    resolveDigDeeper(context.state, decision);
    return { status: 'SUCCESS' };
  }
}

module.exports = ApplyDigDeeperResponseEffect;
