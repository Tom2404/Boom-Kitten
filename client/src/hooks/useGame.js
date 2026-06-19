import { useEffect, useState, useRef } from 'react';
import { useSocket } from './useSocket.js';
import { CARD_THEMES } from '../components/Card.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export function useGame() {
  const socket = useSocket();
  const { t } = useLanguage();
  const [roomState, setRoomState] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [privateHand, setPrivateHand] = useState([]);
  const [nopeWindow, setNopeWindow] = useState(null);
  const [nopeResult, setNopeResult] = useState(null);
  const [nowCardToast, setNowCardToast] = useState(null);
  const [seeTheFutureCards, setSeeTheFutureCards] = useState(null);
  const [alterFutureRequest, setAlterFutureRequest] = useState(null);
  const [favorRequest, setFavorRequest] = useState(null);
  const [buryRequest, setBuryRequest] = useState(null);
  const [garbageRequest, setGarbageRequest] = useState(null);
  const [potLuckRequest, setPotLuckRequest] = useState(null);
  const [zombieRequest, setZombieRequest] = useState(null);
  const [defuseRequest, setDefuseRequest] = useState(null);
  const [selectTargetRequest, setSelectTargetRequest] = useState(null);
  const [feedTheDeadRequest, setFeedTheDeadRequest] = useState(null);
  const [graveRobberRequest, setGraveRobberRequest] = useState(null);
  const [digDeeperRequest, setDigDeeperRequest] = useState(null);
  const [armageddonRequest, setArmageddonRequest] = useState(null);
  const [clairvoyanceReveal, setClairvoyanceReveal] = useState(null);
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
      if (publicGameState && !publicGameState.pendingDefuse) {
        setDefuseRequest(null);
      }
      if (publicGameState && !publicGameState.pendingTargetSelect) {
        setSelectTargetRequest(null);
      }
      if (publicGameState && !publicGameState.pendingFeedTheDead) {
        setFeedTheDeadRequest(null);
      }
      if (publicGameState && !publicGameState.pendingGraveRobber) {
        setGraveRobberRequest(null);
      }
      if (publicGameState && !publicGameState.pendingDigDeeper) {
        setDigDeeperRequest(null);
      }
      if (publicGameState && !publicGameState.pendingArmageddon) {
        setArmageddonRequest(null);
      }
    };

    const onPrivateHand = ({ cards }) => {
      setPrivateHand(cards);
    };

    const onNopeWindow = ({ eventId, timeoutMs, cardType, actingPlayerId, targetPlayerId, nopeCount }) => {
      setNopeWindow({ eventId, timeoutMs, active: true, cardType, actingPlayerId, targetPlayerId, nopeCount: nopeCount ?? 0 });
      setStatusMessage(t('status_waiting_nope'));
      setTimeout(() => {
        setNopeWindow(prev => prev?.eventId === eventId ? { ...prev, active: false } : prev);
      }, timeoutMs);
    };

    const onNopeResult = ({ canceled, cardType, actingPlayerId, nopeCount }) => {
      setNopeResult({ canceled, cardType, actingPlayerId, nopeCount, timestamp: Date.now() });
      // Auto-clear after 2.5s
      setTimeout(() => setNopeResult(null), 2500);
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

    const onDefuseRequest = ({ timeoutMs, cardType }) => {
      setDefuseRequest({ timeoutMs, cardType, active: true });
    };

    const onSelectTargetRequest = ({ cardType, timeoutMs }) => {
      setSelectTargetRequest({ cardType, timeoutMs, active: true });
    };

    const onFeedTheDeadRequest = ({ targetPlayerId, timeoutMs }) => {
      setFeedTheDeadRequest({ targetPlayerId, timeoutMs, active: true });
    };

    const onGraveRobberRequest = ({ timeoutMs }) => {
      setGraveRobberRequest({ timeoutMs, active: true });
    };

    const onDigDeeperRequest = ({ firstCard, timeoutMs }) => {
      setDigDeeperRequest({ firstCard, timeoutMs, active: true });
    };

    const onArmageddonDistributeRequest = ({ timeoutMs }) => {
      setArmageddonRequest({ stage: 'distribute', timeoutMs, active: true });
    };

    const onArmageddonDecisionRequest = ({ timeoutMs }) => {
      setArmageddonRequest({ stage: 'decision', timeoutMs, active: true });
    };

    const onClairvoyanceReveal = ({ position }) => {
      setClairvoyanceReveal({ position, active: true });
    };

    const getCardName = (type) => {
      const clean = type.startsWith('discard_') ? type.replace('discard_', '') : type;
      const key = `card_${clean}_name`;
      const translated = t(key);
      if (translated !== key) return translated;
      return CARD_THEMES[clean]?.name || clean;
    };

    const onGameEnded = ({ winnerId, rankings, eloChanges, pinkCoinChanges }) => {
      setGameEnded({ winnerId, rankings, eloChanges, pinkCoinChanges });
      setStatusMessage(t('log_game_ended', { winner: getUsername(winnerId) }));
    };

    const getUsername = (pId) => {
      const player = roomStateRef.current?.players?.find(p => p.userId === pId) || gameStateRef.current?.players?.find(p => p.userId === pId);
      return player ? player.username : pId;
    };

    const onExploded = ({ playerId }) => {
      const pName = getUsername(playerId);
      setStatusMessage(t('log_exploded', { name: pName }));
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: t('log_exploded', { name: pName }), timestamp: new Date().toLocaleTimeString() }]);
    };

    const onCardPlayed = ({ playerId, cardType, targetPlayerId, nopedCardType }) => {
      const pName = getUsername(playerId);
      const tName = targetPlayerId ? getUsername(targetPlayerId) : null;

      // Detect Now cards and set toast
      if (cardType && cardType.endsWith('_now') && cardType !== 'clairvoyance_now') {
        setNowCardToast({ playerName: pName, cardType, timestamp: Date.now() });
        setTimeout(() => setNowCardToast(null), 3000);
      }

      let msg = '';
      if (cardType === 'nope' && nopedCardType) {
        const nopedCardName = getCardName(nopedCardType);
        msg = t('log_noped', { name: pName, card: nopedCardName, target: tName });
      } else if (cardType.startsWith('discard_')) {
        const cardName = getCardName(cardType);
        msg = t('log_discarded', { name: pName, card: cardName });
      } else {
        const cardName = getCardName(cardType);
        if (tName) {
          msg = t('log_played_target', { name: pName, card: cardName, target: tName });
        } else {
          msg = t('log_played', { name: pName, card: cardName });
        }
      }
      setStatusMessage(msg);
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: msg, timestamp: new Date().toLocaleTimeString() }]);
    };

    const onDrewKitten = ({ playerId, cardType }) => {
      const pName = getUsername(playerId);
      const cardName = getCardName(cardType);
      const msg = t('log_drew_kitten', { name: pName, card: cardName });
      setStatusMessage(msg);
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: msg, timestamp: new Date().toLocaleTimeString() }]);
    };

    const onCardDrawn = ({ playerId }) => {
      const pName = getUsername(playerId);
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: t('log_drew_card', { name: pName }), timestamp: new Date().toLocaleTimeString() }]);
      setStatusMessage('');
    };

    const onTurnChanged = ({ currentPlayerId, drawsRequired }) => {
      const pName = getUsername(currentPlayerId);
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: t('log_turn_changed', { name: pName, draws: drawsRequired }), timestamp: new Date().toLocaleTimeString() }]);
      setStatusMessage('');
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
    socket.on('game:nopeWindow', onNopeWindow);
    socket.on('game:nopeResult', onNopeResult);
    socket.on('game:seeTheFuture', onSeeTheFuture);
    socket.on('game:alterFuture:request', onAlterFutureRequest);
    socket.on('game:favor:request', onFavorRequest);
    socket.on('game:bury:request', onBuryRequest);
    socket.on('game:garbage:request', onGarbageRequest);
    socket.on('game:potLuck:request', onPotLuckRequest);
    socket.on('game:zombie:request', onZombieRequest);
    socket.on('game:defuse:request', onDefuseRequest);
    socket.on('game:selectTarget:request', onSelectTargetRequest);
    socket.on('game:feedTheDead:request', onFeedTheDeadRequest);
    socket.on('game:graveRobber:request', onGraveRobberRequest);
    socket.on('game:digDeeper:request', onDigDeeperRequest);
    socket.on('game:armageddon:distributeRequest', onArmageddonDistributeRequest);
    socket.on('game:armageddon:decisionRequest', onArmageddonDecisionRequest);
    socket.on('game:clairvoyance:reveal', onClairvoyanceReveal);
    socket.on('game:ended', onGameEnded);
    socket.on('game:exploded', onExploded);
    socket.on('game:drewKitten', onDrewKitten);
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
    socket.off('game:nopeResult', onNopeResult);
      socket.off('game:seeTheFuture', onSeeTheFuture);
      socket.off('game:alterFuture:request', onAlterFutureRequest);
      socket.off('game:favor:request', onFavorRequest);
      socket.off('game:bury:request', onBuryRequest);
      socket.off('game:garbage:request', onGarbageRequest);
      socket.off('game:potLuck:request', onPotLuckRequest);
      socket.off('game:zombie:request', onZombieRequest);
      socket.off('game:defuse:request', onDefuseRequest);
      socket.off('game:selectTarget:request', onSelectTargetRequest);
      socket.off('game:feedTheDead:request', onFeedTheDeadRequest);
      socket.off('game:graveRobber:request', onGraveRobberRequest);
      socket.off('game:digDeeper:request', onDigDeeperRequest);
      socket.off('game:armageddon:distributeRequest', onArmageddonDistributeRequest);
      socket.off('game:armageddon:decisionRequest', onArmageddonDecisionRequest);
      socket.off('game:clairvoyance:reveal', onClairvoyanceReveal);
      socket.off('game:ended', onGameEnded);
      socket.off('game:exploded', onExploded);
      socket.off('game:drewKitten', onDrewKitten);
      socket.off('game:cardPlayed', onCardPlayed);
      socket.off('game:cardDrawn', onCardDrawn);
      socket.off('game:turnChanged', onTurnChanged);
      socket.off('chat:message', onChatMessage);
      socket.off('error', onError);
    };
  }, [socket]);

  const createRoom = (password = '', isPublic = true, edition = 'all', maxPlayers = 5) => {
    socket.emit('room:create', { password, isPublic, edition, maxPlayers });
  };

  const joinRoom = (roomCode, password = '') => {
    socket.emit('room:join', { roomCode, password });
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

  const respondDefuse = (insertPosition) => {
    socket.emit('game:defuse:respond', { insertPosition });
    setDefuseRequest(null);
  };

  const respondSelectTarget = (targetPlayerId) => {
    socket.emit('game:selectTarget:respond', { targetPlayerId });
    setSelectTargetRequest(null);
  };

  const respondFeedTheDead = (cardId) => {
    socket.emit('game:feedTheDead:respond', { cardId });
    setFeedTheDeadRequest(null);
  };

  const respondGraveRobber = (cardId) => {
    socket.emit('game:graveRobber:respond', { cardId });
    setGraveRobberRequest(null);
  };

  const respondDigDeeper = (decision) => {
    socket.emit('game:digDeeper:respond', { decision });
    setDigDeeperRequest(null);
  };

  const respondArmageddonDistribute = (choice) => {
    socket.emit('game:armageddon:distribute', { choice });
    setArmageddonRequest(null);
  };

  const respondArmageddonDecision = (decision) => {
    socket.emit('game:armageddon:decision', { decision });
    setArmageddonRequest(null);
  };

  const playCombo = (cards, targetPlayerId = null, stealCardType = null) => {
    const options = stealCardType ? { stealCardType } : undefined;
    socket.emit('game:combo', { cards, targetPlayerId, options });
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

  const playAgain = () => {
    socket.emit('room:playAgain');
  };

  return {
    socket,
    roomState,
    setRoomState,
    gameState,
    privateHand,
    nopeWindow,
    nopeResult,
    nowCardToast,
    seeTheFutureCards,
    setSeeTheFutureCards,
    alterFutureRequest,
    favorRequest,
    buryRequest,
    garbageRequest,
    potLuckRequest,
    zombieRequest,
    defuseRequest,
    selectTargetRequest,
    feedTheDeadRequest,
    graveRobberRequest,
    digDeeperRequest,
    armageddonRequest,
    clairvoyanceReveal,
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
    respondDefuse,
    respondSelectTarget,
    respondFeedTheDead,
    respondGraveRobber,
    respondDigDeeper,
    respondArmageddonDistribute,
    respondArmageddonDecision,
    playCombo,
    respondCombo5,
    sendChatMessage,
    sendEmote,
    playAgain,
  };
}
