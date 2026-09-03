// Application UseCase: DrawCardUseCase
const { drawCard } = require('../../game/gameLogic');

class DrawCardUseCase {
  static execute({ gameState, userId, fromBottom = false, onDefuse }) {
    if (!gameState || !userId) {
      throw new Error('Game state and User ID are required');
    }
    return drawCard(gameState, userId, fromBottom, onDefuse);
  }
}

module.exports = DrawCardUseCase;
