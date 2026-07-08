const BaseEffect = require('./BaseEffect');

class ApplyStatusEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const statusId = this.params.statusId;
    const target = this.params.target || 'targetPlayer'; // can be 'self', 'targetPlayer'
    const duration = this.params.duration || 'until_next_draw';
    
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

    if (!player.statuses) {
      player.statuses = [];
    }

    // Remove existing status of same ID if any (to reset duration)
    player.statuses = player.statuses.filter(s => s.id !== statusId);
    player.statuses.push({ id: statusId, duration, appliedAt: Date.now() });

    // Legacy support: map specific statuses to the legacy flags until UI is fully migrated
    if (statusId === 'blinded') {
      player.blinded = true;
    }

    return { status: 'SUCCESS' };
  }
}

module.exports = ApplyStatusEffect;
