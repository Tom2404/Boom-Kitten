const BaseEffect = require('./BaseEffect');
const gameLogic = require('../../gameLogic'); // Reusing passTurn logic

class KillPlayerEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const playerId = payload.playerId;
    const card = payload.drawnCard;

    const player = state.players.find(p => p.userId === playerId);
    if (!player) return;

    // Discard the bomb
    if (card) {
      delete card.marked;
      state.discardPile.push(card);
    }

    // Eliminate player
    player.alive = false;

    // Discard hand if not zombie mode
    if (state.edition !== 'zombie') {
      if (player.hand && player.hand.length > 0) {
        state.discardPile.push(...player.hand);
      }
      player.hand = [];
    }

    // Update active players
    state.activePlayerIds = state.players.filter((p) => p.alive).map((p) => p.userId);

    // EC-1 Barking Kitten Check
    if (state.barkingKittenState && state.barkingKittenState.waitingHolder === playerId) {
      state.barkingKittenState.waitingHolder = null;
      state.discardPile.push({ id: `bk-invalidated-${Date.now()}`, type: 'barking_kitten' });
      state.barkingKittenInvalidated = player.username;
    }

    // Pass turn if the dying player is the current player
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer && currentPlayer.userId === playerId) {
      state.drawsRequired = 1;
      gameLogic.passTurn(state);
    }
  }
}

module.exports = KillPlayerEffect;
