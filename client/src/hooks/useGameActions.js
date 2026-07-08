export function useGameActions({
  socket,
  roomState,
  activeInteractionRequest,
  setRoomState,
  setGameState,
  setPrivateHand,
  setGameEnded,
  setActionLog,
  setNopeWindow,
  setFavorRequest,
  setAlterFutureRequest,
  setBuryRequest,
  setGarbageRequest,
  setPotLuckRequest,
  setZombieRequest,
  setDefuseRequest,
  setSelectTargetRequest,
  setFeedTheDeadRequest,
  setGraveRobberRequest,
  setDigDeeperRequest,
  setArmageddonRequest,
}) {
  const getActiveInteractionId = (type) => (
    activeInteractionRequest?.type === type ? activeInteractionRequest.interactionId : undefined
  );

  const createRoom = (password = '', edition = 'all', maxPlayers = 5, betAmount = 50, customDefuses = undefined, customExplodingKittens = undefined) => {
    socket.emit('room:create', { password, edition, maxPlayers, betAmount, customDefuses, customExplodingKittens });
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

  const toggleReady = (isReady) => {
    if (roomState) {
      socket.emit('room:toggleReady', { roomCode: roomState.code, isReady });
    }
  };

  const updateRoomSettings = (settings) => {
    if (roomState) {
      socket.emit('room:updateSettings', { roomCode: roomState.code, settings });
    }
  };

  const kickPlayer = (targetUserId) => {
    if (roomState) {
      socket.emit('room:kickPlayer', { roomCode: roomState.code, targetUserId });
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

  const passNope = (originalEventId) => {
    socket.emit('game:nopeWindow:pass', { eventId: originalEventId });
    setNopeWindow(prev => prev?.eventId === originalEventId ? { ...prev, active: false } : prev);
  };

  const discardCard = (cardId) => {
    socket.emit('game:discard', { cardId });
  };

  const respondFavor = (cardId) => {
    socket.emit('game:favor:respond', { cardId, interactionId: getActiveInteractionId('favor') });
  };

  const respondAlterFuture = (rearrangedCards) => {
    socket.emit('game:alterFuture:respond', { rearrangedCards, interactionId: getActiveInteractionId('alter_the_future') });
  };

  const respondBury = (cardId, insertPosition) => {
    socket.emit('game:bury:respond', { cardId, insertPosition, interactionId: getActiveInteractionId('bury') });
  };

  const respondGarbage = (cardId) => {
    socket.emit('game:garbage:respond', { cardId, interactionId: getActiveInteractionId('garbage_collection') });
  };

  const respondPotLuck = (cardId) => {
    socket.emit('game:potLuck:respond', { cardId, interactionId: getActiveInteractionId('pot_luck') });
  };

  const respondZombie = (targetPlayerId, insertPosition) => {
    socket.emit('game:zombie:respond', { targetPlayerId, insertPosition, interactionId: getActiveInteractionId('zombie') });
  };

  const respondDefuse = (insertPosition) => {
    socket.emit('game:defuse:respond', { insertPosition, interactionId: getActiveInteractionId('defuse') });
  };

  const respondSelectTarget = (targetPlayerId) => {
    socket.emit('game:selectTarget:respond', { targetPlayerId, interactionId: getActiveInteractionId('target_select') });
  };

  const respondFeedTheDead = (cardId) => {
    socket.emit('game:feedTheDead:respond', { cardId, interactionId: getActiveInteractionId('feed_the_dead') });
  };

  const respondGraveRobber = (cardId) => {
    socket.emit('game:graveRobber:respond', { cardId, interactionId: getActiveInteractionId('grave_robber') });
  };

  const respondDigDeeper = (decision) => {
    socket.emit('game:digDeeper:respond', { decision, interactionId: getActiveInteractionId('dig_deeper') });
  };

  const respondArmageddonDistribute = (choice) => {
    socket.emit('game:armageddon:distribute', { choice, interactionId: getActiveInteractionId('armageddon') });
  };

  const respondArmageddonDecision = (decision) => {
    socket.emit('game:armageddon:decision', { decision, interactionId: getActiveInteractionId('armageddon') });
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
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    toggleReady,
    updateRoomSettings,
    kickPlayer,
    drawCard,
    playCard,
    playNope,
    passNope,
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
