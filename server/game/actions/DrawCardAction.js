const BaseAction = require('./BaseAction');
const { hasBlockingInteraction } = require('../interactions/interactionGuards');

class DrawCardAction extends BaseAction {
  validate(context, payload) {
    const { userId } = payload;
    const state = context.state;

    // Check if it's the player's turn
    const activePlayer = state.players[state.currentPlayerIndex];
    if (!activePlayer || activePlayer.userId !== userId) {
      return { valid: false, error: 'Không phải lượt của bạn!' };
    }

    // Check if drawing is allowed right now
    if (hasBlockingInteraction(state, { includePendingAction: true, includeNowWindow: true })) {
      return { valid: false, error: 'Không thể rút bài vào lúc này!' };
    }

    // Check if dead
    const player = state.players.find(p => p.userId === userId);
    if (!player || !player.alive) {
      return { valid: false, error: 'Người chơi đã chết không thể rút bài!' };
    }

    return { valid: true };
  }
}

module.exports = DrawCardAction;
