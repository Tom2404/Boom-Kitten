const BaseEffect = require('./BaseEffect');

class RemoveStatusEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const statusId = this.params.statusId;
    const target = this.params.target || 'targetPlayer'; 
    
    // Resolve target userId
    let targetId;
    if (target === 'self') {
      targetId = payload.userId;
    } else if (target === 'targetPlayer') {
      targetId = payload.targetPlayerId;
    }

    if (!targetId) return { status: 'FAILED' };

    const player = state.players.find(p => p.userId === targetId);
    if (!player) return { status: 'FAILED' };

    if (player.statuses) {
      player.statuses = player.statuses.filter(s => s.id !== statusId);
    }

    if (statusId === 'blinded') {
      player.blinded = false;
    }

    return { status: 'SUCCESS' };
  }
}

module.exports = RemoveStatusEffect;
