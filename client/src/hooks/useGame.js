import { useEffect, useState, useRef } from 'react';
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
  const [actionLog, setActionLog] = useState([]);

  const roomStateRef = useRef(roomState);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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
      if (room && room.status === 'playing' && roomStateRef.current?.status !== 'playing') {
        setActionLog([{ id: 'start', text: '🎬 Ván đấu bắt đầu!', timestamp: new Date().toLocaleTimeString() }]);
      }
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
      if (publicGameState && !publicGameState.pendingAction) {
        setNopeWindow(null);
        setStatusMessage(prev => prev === 'Đang chờ Nope...' ? '' : prev);
      }
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

    const getUsername = (pId) => {
      const player = roomStateRef.current?.players?.find(p => p.userId === pId) || gameStateRef.current?.players?.find(p => p.userId === pId);
      return player ? player.username : pId;
    };

    const onExploded = ({ playerId }) => {
      const pName = getUsername(playerId);
      setStatusMessage(`Người chơi ${pName} đã BÙM! 💣`);
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: `💥 ${pName} đã bị nổ tung!`, timestamp: new Date().toLocaleTimeString() }]);
    };

    const onCardPlayed = ({ playerId, cardType, targetPlayerId }) => {
      const pName = getUsername(playerId);
      const tName = targetPlayerId ? getUsername(targetPlayerId) : null;
      setStatusMessage(`Người chơi ${pName} đã đánh lá ${cardType}${tName ? ` nhắm vào ${tName}` : ''}`);

      let msg = '';
      if (cardType.startsWith('discard_')) {
        const cleanType = cardType.replace('discard_', '');
        msg = `${pName} đã hủy bỏ lá bài ${cleanType}`;
      } else {
        msg = `${pName} đã đánh lá ${cardType}${tName ? ` nhắm vào ${tName}` : ''}`;
      }
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: msg, timestamp: new Date().toLocaleTimeString() }]);
    };

    const onCardDrawn = ({ playerId }) => {
      const pName = getUsername(playerId);
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: `${pName} đã bốc 1 lá bài`, timestamp: new Date().toLocaleTimeString() }]);
      setStatusMessage('');
    };

    const onTurnChanged = ({ currentPlayerId, drawsRequired }) => {
      const pName = getUsername(currentPlayerId);
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: `⏳ Đến lượt của ${pName} (Cần bốc: ${drawsRequired} lá)`, timestamp: new Date().toLocaleTimeString() }]);
      setStatusMessage('');
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
    socket.on('game:cardDrawn', onCardDrawn);
    socket.on('game:turnChanged', onTurnChanged);
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
      socket.off('game:cardDrawn', onCardDrawn);
      socket.off('game:turnChanged', onTurnChanged);
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
    setActionLog([]);
  };

  const startGame = () => {
    if (roomState) {
      socket.emit('game:start', { roomCode: roomState.code });
    }
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

  const discardCard = (cardId) => {
    socket.emit('game:discard', { cardId });
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

  const respondZombie = (targetPlayerId, insertPosition) => {
    socket.emit('game:zombie:respond', { targetPlayerId, insertPosition });
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
    actionLog,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    drawCard,
    playCard,
    playNope,
    discardCard,
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
