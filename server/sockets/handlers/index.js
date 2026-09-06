// Socket Handlers Registry Index
// Only handlers with events NOT already registered in gameSocket.js belong here.
// room:* and chat/emote events live in gameSocket.js; registering them here too
// made socket.on append a second listener, firing every room action twice.
const registerQuestHandlers = require('./questHandler');
const registerAdminSocketHandlers = require('./adminSocketHandler');

function attachSocketHandlers(io, socket, helpers) {
  registerQuestHandlers(io, socket, helpers);
  registerAdminSocketHandlers(io, socket, helpers);
}

module.exports = attachSocketHandlers;
