/**
 * Shared Socket Event Names between Client and Server
 * Single Source of Truth
 */
const SOCKET_EVENTS = Object.freeze({
  // Room Lifecycle
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  TOGGLE_READY: 'toggle_ready',
  KICK_PLAYER: 'kick_player',
  UPDATE_ROOM_SETTINGS: 'update_room_settings',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_UPDATED: 'room_updated',
  ROOM_LEFT: 'room_left',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  PLAYER_READY_CHANGED: 'player_ready_changed',
  KICKED_FROM_ROOM: 'kicked_from_room',

  // Game Gameplay
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  STATE_UPDATE: 'game_state_update',
  PRIVATE_HAND_UPDATE: 'private_hand_update',
  PLAY_CARD: 'PLAY_CARD',
  PLAY_CARD_INIT: 'PLAY_CARD_INIT',
  DRAW_CARD: 'drawCard',
  SUBMIT_INTERACTION: 'SUBMIT_INTERACTION',
  GAME_OVER: 'game_over',
  PLAYER_ELIMINATED: 'player_eliminated',

  // Interaction Responses (Consolidated Protocol)
  INTERACTION_RESPONSE: 'game:interaction:respond',
  INTERACTION_PROMPT: 'game:interaction:prompt',

  // Chat & Social
  SEND_CHAT: 'send_chat_message',
  CHAT_MESSAGE: 'chat_message',
  SEND_EMOTE: 'send_emote',
  EMOTE_RECEIVED: 'emote_received',

  // System & Connection
  RECONNECT: 'reconnect_game',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
  ERROR: 'error_message',
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SOCKET_EVENTS };
}

export { SOCKET_EVENTS };
export default SOCKET_EVENTS;
