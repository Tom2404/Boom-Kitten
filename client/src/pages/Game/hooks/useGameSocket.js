import { useEffect, useCallback } from 'react';
import { useGame } from '../../../hooks/useGame.js';
import { SOCKET_EVENTS } from '../../../../shared/events.js';

export function useGameSocket({ roomCode, onStateUpdate, onPrivateHand, onError }) {
  const { socket } = useGame();

  const emitPlayCard = useCallback((cardId, targetPlayerId, options) => {
    if (!socket || !roomCode) return;
    return new Promise((resolve) => {
      socket.emit(SOCKET_EVENTS.PLAY_CARD, { roomCode, cardId, targetPlayerId, options }, (response) => {
        resolve(response);
      });
    });
  }, [socket, roomCode]);

  const emitDrawCard = useCallback(() => {
    if (!socket || !roomCode) return;
    return new Promise((resolve) => {
      socket.emit(SOCKET_EVENTS.DRAW_CARD, { roomCode }, (response) => {
        resolve(response);
      });
    });
  }, [socket, roomCode]);

  const emitInteractionResponse = useCallback((interactionId, actionType, payload) => {
    if (!socket || !roomCode) return;
    socket.emit(SOCKET_EVENTS.INTERACTION_RESPONSE, {
      roomCode,
      interactionId,
      actionType,
      payload,
    });
  }, [socket, roomCode]);

  const emitSendMessage = useCallback((text) => {
    if (!socket || !roomCode || !text.trim()) return;
    socket.emit(SOCKET_EVENTS.SEND_CHAT, { roomCode, text: text.trim() });
  }, [socket, roomCode]);

  const emitSendEmote = useCallback((emoteId) => {
    if (!socket || !roomCode || !emoteId) return;
    socket.emit(SOCKET_EVENTS.SEND_EMOTE, { roomCode, emoteId });
  }, [socket, roomCode]);

  useEffect(() => {
    if (!socket || !roomCode) return;

    const handleStateUpdate = (data) => {
      if (onStateUpdate) onStateUpdate(data.publicGameState);
    };

    const handlePrivateHand = (data) => {
      if (onPrivateHand) onPrivateHand(data.cards);
    };

    const handleError = (data) => {
      if (onError) onError(data.message || data.error);
    };

    socket.on(SOCKET_EVENTS.STATE_UPDATE, handleStateUpdate);
    socket.on(SOCKET_EVENTS.PRIVATE_HAND_UPDATE, handlePrivateHand);
    socket.on(SOCKET_EVENTS.ERROR, handleError);

    return () => {
      socket.off(SOCKET_EVENTS.STATE_UPDATE, handleStateUpdate);
      socket.off(SOCKET_EVENTS.PRIVATE_HAND_UPDATE, handlePrivateHand);
      socket.off(SOCKET_EVENTS.ERROR, handleError);
    };
  }, [socket, roomCode, onStateUpdate, onPrivateHand, onError]);

  return {
    socket,
    emitPlayCard,
    emitDrawCard,
    emitInteractionResponse,
    emitSendMessage,
    emitSendEmote,
  };
}
