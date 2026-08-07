// Application UseCase: JoinRoomUseCase
const { joinRoom } = require('../../game/roomManager');

class JoinRoomUseCase {
  static execute({ roomCode, userId, profile = 'Guest', password = '' }) {
    if (!roomCode || !userId) {
      throw new Error('Room code and User ID are required');
    }
    return joinRoom(roomCode, userId, profile, password);
  }
}

module.exports = JoinRoomUseCase;
