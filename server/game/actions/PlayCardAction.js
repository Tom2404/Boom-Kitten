const BaseAction = require('./BaseAction');
const { hasBlockingInteraction } = require('../interactions/interactionGuards');

class PlayCardAction extends BaseAction {
  validate(context, payload) {
    const { userId, cardType, targetPlayerId } = payload;
    const state = context.state;

    // Clairvoyance can be played out of turn during defuse or zombie revive phase
    if (cardType === 'clairvoyance' || cardType === 'clairvoyance_now') {
      const targetPending = state.pendingZombie || state.pendingDefuse;
      if (!targetPending) {
        return { valid: false, error: 'Chỉ có thể chơi Thiên Nhãn khi có người đang gỡ mìn hoặc hồi sinh!' };
      }
      return { valid: true };
    }

    const isNowCard = cardType.endsWith('_now');

    if (state.pendingNowOnlyWindow) {
      if (!isNowCard) {
        return { valid: false, error: 'Chỉ có thể đánh các lá bài NOW vào lúc này!' };
      }
    } else {
      if (!isNowCard) {
        if (hasBlockingInteraction(state, { includePendingAction: true })) {
          return { valid: false, error: 'Không thể đánh bài vào lúc này!' };
        }

        const activePlayer = state.players[state.currentPlayerIndex];
        if (!activePlayer || activePlayer.userId !== userId) {
          return { valid: false, error: 'Không phải lượt của bạn!' };
        }
      } else {
        if (hasBlockingInteraction(state, { includePendingAction: false })) {
          return { valid: false, error: 'Không thể đánh bài vào lúc này!' };
        }
      }
    }

    const player = state.players.find((p) => p.userId === userId);
    const maxHandSize = state.maxHandSize ?? 10;
    if (player && player.hand.length > maxHandSize) {
      return { valid: false, error: `Bạn phải hủy bớt bài xuống ${maxHandSize} lá trước!` };
    }

    // Check Zombie edition card rules
    if (cardType === 'feed_the_dead' || cardType === 'grave_robber') {
      const deadCount = state.players.filter(p => !p.alive).length;
      if (deadCount === 0) {
        return { valid: false, error: 'Không thể đánh lá bài này khi chưa có Zombie (người chơi đã chết)!' };
      }
    }

    let finalTargetPlayerId = targetPlayerId;
    if (cardType === 'feed_the_dead' && !finalTargetPlayerId) {
      const deadPlayers = state.players.filter(p => !p.alive);
      if (deadPlayers.length === 1) {
        finalTargetPlayerId = deadPlayers[0].userId;
      }
    }

    if (finalTargetPlayerId) {
      const target = state.players.find(p => p.userId === finalTargetPlayerId);
      if (!target) {
        return { valid: false, error: 'Người chơi mục tiêu không tồn tại!' };
      }
      if (cardType === 'feed_the_dead') {
        if (target.alive) {
          return { valid: false, error: 'Mục tiêu của Feed the Dead phải là người chơi đã chết!' };
        }
      } else {
        if (!target.alive) {
          return { valid: false, error: 'Không thể nhắm vào người chơi đã chết!' };
        }
      }
    }

    let finalPayload = { ...payload, finalTargetPlayerId };

    if (cardType === 'attack_of_the_dead') {
      const deadCount = state.players.filter(p => !p.alive).length;
      finalPayload.countDelta = 3 * deadCount;
    }

    return { valid: true, payload: finalPayload };
  }

  getEffects(context, payload) {
    // Require here to avoid circular dependencies if any, though usually factory is fine
    const EffectFactory = require('../effects/EffectFactory');
    return EffectFactory.createEffects(payload.cardType, payload);
  }
}

module.exports = PlayCardAction;
