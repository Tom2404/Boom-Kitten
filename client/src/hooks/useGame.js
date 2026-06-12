import { useEffect, useState } from 'react';
import { useSocket } from './useSocket.js';

export function useGame() {
  const socket = useSocket();
  const [roomState, setRoomState] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [privateHand, setPrivateHand] = useState([]);
  const [nopeWindow, setNopeWindow] = useState(null);
  const [seeTheFutureCards, setSeeTheFutureCards] = useState(null);
  const [alterFutureRequest, setAlterFutureRequest] = useState(null);
  const [favorRequest, setFavorRequest] = useState(null);
  const [buryRequest, setBuryRequest] = useState(null);
  const [garbageRequest, setGarbageRequest] = useState(null);
  const [potLuckRequest, setPotLuckRequest] = useState(null);
  const [zombieRequest, setZombieRequest] = useState(null);
  const [gameEnded, setGameEnded] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Sync access token and force reconnect on mount to apply authentication
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = `guest-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('guestId', guestId);
    }
    socket.auth = { 
      token: localStorage.getItem('accessToken') ?? '',
      guestId: guestId
    };
    socket.disconnect();
    socket.connect();

    const onRoomUpdated = ({ room }) => {
      setRoomState(room);
      if (room) {
        setGameState(room.gameState);
      } else {
        setGameState(null);
      }
    };

    const onStateUpdate = ({ publicGameState }) => {
      setGameState(publicGameState);
      // Clean up local modal states if their triggers are no longer in server state
      if (publicGameState && !publicGameState.pendingFavor) {
        setFavorRequest(null);
      }
      if (publicGameState && !publicGameState.pendingAlter) {
        setAlterFutureRequest(null);
      }
      if (publicGameState && !publicGameState.pendingBury) {
        setBuryRequest(null);
      }
      if (publicGameState && !publicGameState.pendingGarbage) {
        setGarbageRequest(null);
      }
      if (publicGameState && !publicGameState.pendingPotLuck) {
        setPotLuckRequest(null);
      }
      if (publicGameState && !publicGameState.pendingZombie) {
        setZombieRequest(null);
      }
    };

    const onPrivateHand = ({ cards }) => {
      setPrivateHand(cards);
    };

    const onNopeWindow = ({ eventId, timeoutMs }) => {
      setNopeWindow({ eventId, timeoutMs, active: true });
      setStatusMessage('Đang chờ Nope...');
      setTimeout(() => {
        setNopeWindow(prev => prev?.eventId === eventId ? { ...prev, active: false } : prev);
      }, timeoutMs);
    };

    const onSeeTheFuture = ({ cards }) => {
      setSeeTheFutureCards(cards);
    };

    const onAlterFutureRequest = ({ cards, count, timeoutMs }) => {
      setAlterFutureRequest({ cards, count: count || 3, timeoutMs, active: true });
    };

    const onFavorRequest = ({ fromPlayerId, timeoutMs }) => {
      setFavorRequest({ fromPlayerId, timeoutMs, active: true });
    };

    const onBuryRequest = ({ timeoutMs }) => {
      setBuryRequest({ timeoutMs, active: true });
    };

    const onGarbageRequest = ({ timeoutMs }) => {
      setGarbageRequest({ timeoutMs, active: true });
    };

    const onPotLuckRequest = ({ timeoutMs }) => {
      setPotLuckRequest({ timeoutMs, active: true });
    };

    const onZombieRequest = ({ timeoutMs }) => {
      setZombieRequest({ timeoutMs, active: true });
    };

    const onGameEnded = ({ winnerId, rankings }) => {
      setGameEnded({ winnerId, rankings });
      setStatusMessage(`Trận đấu kết thúc! Người thắng: ${winnerId}`);
    };

    const onExploded = ({ playerId }) => {
      setStatusMessage(`Người chơi ${playerId} đã BÙM! 💣`);
    };

    const onCardPlayed = ({ playerId, cardType, targetPlayerId }) => {
      setStatusMessage(`Người chơi ${playerId} đã đánh lá ${cardType}${targetPlayerId ? ` nhắm vào ${targetPlayerId}` : ''}`);
    };

    const onChatMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const onError = ({ message }) => {
      setStatusMessage(`Lỗi: ${message}`);
    };

    socket.on('room:updated', onRoomUpdated);
    socket.on('game:stateUpdate', onStateUpdate);
    socket.on('game:privateHand', onPrivateHand);
    socket.on('game:nopeWindow', onNopeWindow);
    socket.on('game:seeTheFuture', onSeeTheFuture);
    socket.on('game:alterFuture:request', onAlterFutureRequest);
    socket.on('game:favor:request', onFavorRequest);
    socket.on('game:bury:request', onBuryRequest);
    socket.on('game:garbage:request', onGarbageRequest);
    socket.on('game:potLuck:request', onPotLuckRequest);
    socket.on('game:zombie:request', onZombieRequest);
    socket.on('game:ended', onGameEnded);
    socket.on('game:exploded', onExploded);
    socket.on('game:cardPlayed', onCardPlayed);
    socket.on('chat:message', onChatMessage);
    socket.on('error', onError);

    return () => {
      socket.off('room:updated', onRoomUpdated);
      socket.off('game:stateUpdate', onStateUpdate);
      socket.off('game:privateHand', onPrivateHand);
      socket.off('game:nopeWindow', onNopeWindow);
      socket.off('game:seeTheFuture', onSeeTheFuture);
      socket.off('game:alterFuture:request', onAlterFutureRequest);
      socket.off('game:favor:request', onFavorRequest);
      socket.off('game:bury:request', onBuryRequest);
      socket.off('game:garbage:request', onGarbageRequest);
      socket.off('game:potLuck:request', onPotLuckRequest);
      socket.off('game:zombie:request', onZombieRequest);
      socket.off('game:ended', onGameEnded);
      socket.off('game:exploded', onExploded);
      socket.off('game:cardPlayed', onCardPlayed);
      socket.off('chat:message', onChatMessage);
      socket.off('error', onError);
    };
  }, [socket]);

  // Actions
  const createRoom = (maxPlayers = 5, isPublic = true) => {
    socket.emit('room:create', { maxPlayers, isPublic });
  };

  const joinRoom = (roomCode) => {
    socket.emit('room:join', { roomCode });
  };

  const leaveRoom = () => {
    socket.emit('room:leave');
    setRoomState(null);
    setGameState(null);
    setPrivateHand([]);
    setGameEnded(null);
  };

  const startGame = () => {
    socket.emit('game:start');
  };

  const drawCard = () => {
    socket.emit('game:drawCard');
  };

  const playCard = (cardType, targetPlayerId = null, options = null) => {
    socket.emit('game:playCard', { cardType, targetPlayerId, options });
  };

  const playNope = (originalEventId) => {
    socket.emit('game:nope', { originalEventId });
    setNopeWindow(prev => prev?.eventId === originalEventId ? { ...prev, active: false } : prev);
  };

  const respondFavor = (cardId) => {
    socket.emit('game:favor:respond', { cardId });
    setFavorRequest(null);
  };

  const respondAlterFuture = (rearrangedCards) => {
    socket.emit('game:alterFuture:respond', { rearrangedCards });
    setAlterFutureRequest(null);
  };

  const respondBury = (cardId, insertPosition) => {
    socket.emit('game:bury:respond', { cardId, insertPosition });
    setBuryRequest(null);
  };

  const respondGarbage = (cardId) => {
    socket.emit('game:garbage:respond', { cardId });
    setGarbageRequest(null);
  };

  const respondPotLuck = (cardId) => {
    socket.emit('game:potLuck:respond', { cardId });
    setPotLuckRequest(null);
  };

  const respondZombie = (targetPlayerId) => {
    socket.emit('game:zombie:respond', { targetPlayerId });
    setZombieRequest(null);
  };

  const playCombo = (cards, targetPlayerId = null) => {
    socket.emit('game:combo', { cards, targetPlayerId });
  };

  const respondCombo5 = (cardId) => {
    socket.emit('game:combo5:respond', { cardId });
  };

  const sendChatMessage = (text) => {
    socket.emit('chat:message', { text });
  };

  const sendEmote = (emoteId) => {
    socket.emit('game:emote', { emoteId });
  };

  return {
    socket,
    roomState,
    setRoomState,
    gameState,
    privateHand,
    nopeWindow,
    seeTheFutureCards,
    setSeeTheFutureCards,
    alterFutureRequest,
    favorRequest,
    buryRequest,
    garbageRequest,
    potLuckRequest,
    zombieRequest,
    gameEnded,
    setGameEnded,
    chatMessages,
    statusMessage,
    setStatusMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    drawCard,
    playCard,
    playNope,
    respondFavor,
    respondAlterFuture,
    respondBury,
    respondGarbage,
    respondPotLuck,
    respondZombie,
    playCombo,
    respondCombo5,
    sendChatMessage,
    sendEmote,
  };
}
