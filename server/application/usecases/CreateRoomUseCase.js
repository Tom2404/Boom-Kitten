// Application UseCase: CreateRoomUseCase
const { createRoom } = require('../../game/roomManager');

class CreateRoomUseCase {
  static execute({ hostId, options = {}, profile = 'Guest' }) {
    if (!hostId) {
      throw new Error('Host ID is required');
    }
    return createRoom(hostId, options, profile);
  }
}

module.exports = CreateRoomUseCase;
