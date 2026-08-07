// Application UseCase: PlayCardUseCase
const { playCard } = require('../../game/gameLogic');

class PlayCardUseCase {
  static execute({ gameState, userId, cardType, targetPlayerId, options = {} }) {
    if (!gameState || !userId || !cardType) {
      throw new Error('Game state, User ID, and Card type are required');
    }
    return playCard(gameState, userId, cardType, targetPlayerId, options);
  }
}

module.exports = PlayCardUseCase;
