import { useEffect, useRef, useState } from 'react';
import { useAnimationSocketEvents } from './useAnimationSocketEvents.js';
import { useGameLogEvents } from './useGameLogEvents.js';

export function useRoomSync({
  socket,
  t,
  setStatusMessage,
  clearResolvedInteractions,
  setNowCardToast,
}) {
  const [roomState, setRoomState] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [privateHand, setPrivateHand] = useState([]);
  const [gameEnded, setGameEnded] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [actionLog, setActionLog] = useState([]);

  const roomStateRef = useRef(roomState);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useAnimationSocketEvents(socket);
  useGameLogEvents({
    socket,
    t,
    setStatusMessage,
    setActionLog,
    setNowCardToast,
    roomStateRef,
    gameStateRef,
  });

  useEffect(() => {
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = `guest-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('guestId', guestId);
    }

    const token = localStorage.getItem('accessToken') ?? '';
    const currentToken = socket.auth?.token;
    const currentGuestId = socket.auth?.guestId;

    socket.auth = {
      token,
      guestId,
    };

    if (token !== currentToken || guestId !== currentGuestId || !socket.connected) {
      socket.disconnect();
      socket.connect();
    }

    const getUsername = (pId) => {
      const player = roomStateRef.current?.players?.find(p => p.userId === pId) || gameStateRef.current?.players?.find(p => p.userId === pId);
      return player ? player.username : pId;
    };

    const onRoomUpdated = ({ room }) => {
      if (room && room.status === 'playing' && roomStateRef.current?.status !== 'playing') {
        setActionLog([{ id: 'start', text: t('log_game_started'), timestamp: new Date().toLocaleTimeString() }]);
      }
      setRoomState(room);
      if (room) {
        setGameState(room.gameState);
        if (room.status === 'waiting') {
          setGameEnded(null);
        }
      } else {
        setGameState(null);
      }
    };

    const onStateUpdate = ({ publicGameState }) => {
      setGameState(publicGameState);
      clearResolvedInteractions(publicGameState);
    };

    const onPrivateHand = ({ cards }) => {
      setPrivateHand(cards);
    };

    const onGameEnded = ({ winnerId, rankings, eloChanges, pinkCoinChanges }) => {
      setGameEnded({ winnerId, rankings, eloChanges, pinkCoinChanges });
      setStatusMessage(t('log_game_ended', { winner: getUsername(winnerId) }));

      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'waiting',
          players: prev.players.map(p => ({ ...p, isReady: p.userId === prev.host })),
        };
      });
    };

    const onRoomKicked = ({ message }) => {
      alert(message);
      setRoomState(null);
      setGameState(null);
      setPrivateHand([]);
    };

    const onChatMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const onError = ({ message }) => {
      setStatusMessage(t('log_error', { message }));
    };

    socket.on('room:updated', onRoomUpdated);
    socket.on('game:stateUpdate', onStateUpdate);
    socket.on('game:privateHand', onPrivateHand);
    socket.on('chat:message', onChatMessage);
    socket.on('error', onError);
    socket.on('room:kicked', onRoomKicked);
    socket.on('game:ended', onGameEnded);

    return () => {
      socket.off('room:updated', onRoomUpdated);
      socket.off('game:stateUpdate', onStateUpdate);
      socket.off('game:privateHand', onPrivateHand);
      socket.off('game:ended', onGameEnded);
      socket.off('chat:message', onChatMessage);
      socket.off('error', onError);
      socket.off('room:kicked', onRoomKicked);
    };
  }, [socket]);

  return {
    roomState,
    setRoomState,
    gameState,
    setGameState,
    privateHand,
    setPrivateHand,
    gameEnded,
    setGameEnded,
    chatMessages,
    actionLog,
    setActionLog,
  };
}
