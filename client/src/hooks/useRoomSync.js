import { useEffect, useRef, useState } from 'react';
import { useAnimationSocketEvents } from './useAnimationSocketEvents.js';
import { useGameLogEvents } from './useGameLogEvents.js';
import { createGameResultState } from '../pages/Game/gameMotion.js';

export function useRoomSync({
  socket,
  initialRoom = null,
  t,
  setStatusMessage,
  clearResolvedInteractions,
  setNowCardToast,
}) {
  const [roomState, setRoomState] = useState(initialRoom);
  const [gameState, setGameState] = useState(initialRoom?.gameState ?? null);
  const [privateHand, setPrivateHand] = useState([]);
  const [privateHandSourceEventId, setPrivateHandSourceEventId] = useState(null);
  const [gameEnded, setGameEnded] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [actionLog, setActionLog] = useState([]);
  const [connectionState, setConnectionState] = useState(socket.connected ? 'connected' : 'connecting');
  const [localReconnectDeadline, setLocalReconnectDeadline] = useState(null);

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
        if (room.status === 'playing') {
          setGameEnded(null);
        }
      } else {
        setGameState(null);
        setGameEnded(null);
        setPrivateHandSourceEventId(null);
      }
    };

    const onStateUpdate = ({ publicGameState }) => {
      setGameState(publicGameState);
      clearResolvedInteractions(publicGameState);
    };

    const onPrivateHand = ({ cards, sourceEventId = null }) => {
      setPrivateHand(cards);
      setPrivateHandSourceEventId(sourceEventId);
    };

    const onGameEnded = ({ winnerId, rankings, wager }) => {
      setPrivateHandSourceEventId(null);
      setGameEnded(createGameResultState({
        winnerId,
        rankings,
        wager,
        snapshot: gameStateRef.current,
      }));
      setStatusMessage(t('log_game_ended', { winner: getUsername(winnerId) }));
      socket.emit('room:playAgain');
    };

    const onRoomKicked = ({ message }) => {
      alert(message);
      setRoomState(null);
      setGameState(null);
      setGameEnded(null);
      setPrivateHand([]);
      setPrivateHandSourceEventId(null);
    };

    const onChatMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const onError = ({ message }) => {
      setStatusMessage(t('log_error', { message }));
    };

    const onConnect = () => {
      setConnectionState('connected');
      setLocalReconnectDeadline(null);
    };
    const onDisconnect = () => {
      setConnectionState('reconnecting');
      setLocalReconnectDeadline(
        Date.now() + (roomStateRef.current?.reconnectGraceMs ?? 60_000),
      );
    };
    const onConnectError = () => setConnectionState('error');

    socket.on('room:updated', onRoomUpdated);
    socket.on('game:stateUpdate', onStateUpdate);
    socket.on('game:privateHand', onPrivateHand);
    socket.on('chat:message', onChatMessage);
    socket.on('error', onError);
    socket.on('room:kicked', onRoomKicked);
    socket.on('game:ended', onGameEnded);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    if (initialRoom?.status === 'playing' && socket.connected) {
      socket.emit('room:join', { roomCode: initialRoom.code });
    }

    return () => {
      socket.off('room:updated', onRoomUpdated);
      socket.off('game:stateUpdate', onStateUpdate);
      socket.off('game:privateHand', onPrivateHand);
      socket.off('game:ended', onGameEnded);
      socket.off('chat:message', onChatMessage);
      socket.off('error', onError);
      socket.off('room:kicked', onRoomKicked);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, [socket]);

  return {
    roomState,
    setRoomState,
    gameState,
    setGameState,
    privateHand,
    privateHandSourceEventId,
    setPrivateHand,
    gameEnded,
    setGameEnded,
    chatMessages,
    actionLog,
    setActionLog,
    connectionState,
    localReconnectDeadline,
  };
}
