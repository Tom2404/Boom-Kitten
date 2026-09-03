// Application UseCase: ReconnectUseCase
const { markPlayerConnected, findRoomByUser } = require('../../game/roomManager');

class ReconnectUseCase {
  static execute({ userId }) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const room = findRoomByUser(userId);
    if (!room) return null;

    const player = markPlayerConnected(room.code, userId);
    return { room, player };
  }
}

module.exports = ReconnectUseCase;
