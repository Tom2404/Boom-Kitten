// Socket Handlers Registry Index
const registerRoomHandlers = require('./roomHandler');
const registerSocialHandlers = require('./socialHandler');
const registerQuestHandlers = require('./questHandler');
const registerAdminSocketHandlers = require('./adminSocketHandler');

function attachSocketHandlers(io, socket, helpers) {
  registerRoomHandlers(io, socket, helpers);
  registerSocialHandlers(io, socket, helpers);
  registerQuestHandlers(io, socket, helpers);
  registerAdminSocketHandlers(io, socket, helpers);
}

module.exports = attachSocketHandlers;
