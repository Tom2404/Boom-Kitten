const BaseEffect = require('./BaseEffect');

class WaitInsertBombEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const type = this.params.type; // 'defuse', 'zombie', or 'imploding_face_down'
    const playerId = payload.playerId;
    const card = payload.drawnCard;

    if (type === 'zombie') {
      state.pendingZombie = { playerId, card, startedAt: Date.now() };
    } else {
      // Default defuse or facedown imploding kitten both use pendingDefuse state
      state.pendingDefuse = { playerId, card, startedAt: Date.now() };
    }
  }
}

module.exports = WaitInsertBombEffect;
