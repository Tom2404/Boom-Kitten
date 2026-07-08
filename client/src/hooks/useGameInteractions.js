import { useEffect, useState } from 'react';

export function useGameInteractions({ socket, t, setStatusMessage }) {
  const [nopeWindow, setNopeWindow] = useState(null);
  const [nopeResult, setNopeResult] = useState(null);
  const [nowCardToast, setNowCardToast] = useState(null);
  const [seeTheFutureCards, setSeeTheFutureCards] = useState(null);
  const [activeInteractionRequest, setActiveInteractionRequest] = useState(null);
  const [clairvoyanceReveal, setClairvoyanceReveal] = useState(null);

  const setTypedInteractionRequest = (type) => (valueOrUpdater) => {
    setActiveInteractionRequest((prev) => {
      const nextValue = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(prev?.type === type ? prev : null)
        : valueOrUpdater;

      if (!nextValue) {
        return prev?.type === type ? null : prev;
      }

      const previousSameType = prev?.type === type ? prev : {};
      return {
        ...previousSameType,
        ...nextValue,
        type,
        active: nextValue.active ?? true,
      };
    });
  };

  const setAlterFutureRequest = setTypedInteractionRequest('alter_the_future');
  const setFavorRequest = setTypedInteractionRequest('favor');
  const setBuryRequest = setTypedInteractionRequest('bury');
  const setGarbageRequest = setTypedInteractionRequest('garbage_collection');
  const setPotLuckRequest = setTypedInteractionRequest('pot_luck');
  const setZombieRequest = setTypedInteractionRequest('zombie');
  const setDefuseRequest = setTypedInteractionRequest('defuse');
  const setSelectTargetRequest = setTypedInteractionRequest('target_select');
  const setFeedTheDeadRequest = setTypedInteractionRequest('feed_the_dead');
  const setGraveRobberRequest = setTypedInteractionRequest('grave_robber');
  const setDigDeeperRequest = setTypedInteractionRequest('dig_deeper');
  const setArmageddonRequest = setTypedInteractionRequest('armageddon');

  const requestForType = (type) => (
    activeInteractionRequest?.type === type ? activeInteractionRequest : null
  );

  const clearResolvedInteractions = (publicGameState) => {
    if (publicGameState && !publicGameState.pendingAction && !publicGameState.pendingNowOnlyWindow) {
      setNopeWindow(null);
      setStatusMessage(prev => {
        const message = String(prev || '');
        return message.includes('Nope') || message.includes('Now') ? '' : prev;
      });
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

  useEffect(() => {
    const onNopeWindow = ({ eventId, timeoutMs, cardType, actingPlayerId, targetPlayerId, nopeCount }) => {
      setNopeWindow({ eventId, timeoutMs, active: true, cardType, actingPlayerId, targetPlayerId, nopeCount: nopeCount ?? 0, isNowOnly: false });
      setStatusMessage(t('status_waiting_nope'));
      setTimeout(() => {
        setNopeWindow(prev => prev?.eventId === eventId ? { ...prev, active: false } : prev);
      }, timeoutMs);
    };

    const onNowOnlyWindow = ({ eventId, timeoutMs, resolvedCardType, actingPlayerId }) => {
      setNopeWindow({
        eventId,
        timeoutMs,
        active: true,
        cardType: resolvedCardType,
        actingPlayerId,
        targetPlayerId: null,
        nopeCount: 0,
        isNowOnly: true,
      });
      setStatusMessage('Đang chờ Now...');
      setTimeout(() => {
        setNopeWindow(prev => prev?.eventId === eventId ? { ...prev, active: false } : prev);
      }, timeoutMs);
    };

    const onNowOnlyWindowEnd = ({ eventId }) => {
      setNopeWindow(prev => prev?.eventId === eventId ? null : prev);
      setStatusMessage(prev => {
        const message = String(prev || '');
        return message.includes('Now') ? '' : prev;
      });
    };

    const onNopeResult = ({ canceled, cardType, actingPlayerId, nopeCount }) => {
      setNopeResult({ canceled, cardType, actingPlayerId, nopeCount, timestamp: Date.now() });
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

    const onArmageddonRequest = ({ timeoutMs, stage }) => {
      setArmageddonRequest({ timeoutMs, stage: stage || 'distribute', active: true });
    };

    const onInteractionRequest = (payload = {}) => {
      const request = {
        ...payload,
        active: true,
        timeoutMs: payload.timeoutMs,
        interactionId: payload.interactionId,
      };

      const handlersByType = {
        alter_the_future: () => setAlterFutureRequest({
          ...request,
          cards: payload.cards,
          count: payload.count || payload.metadata?.count || 3,
        }),
        favor: () => setFavorRequest({
          ...request,
          fromPlayerId: payload.fromPlayerId || payload.owner,
        }),
        bury: () => setBuryRequest(request),
        garbage_collection: () => setGarbageRequest(request),
        pot_luck: () => setPotLuckRequest(request),
        zombie: () => setZombieRequest(request),
        defuse: () => setDefuseRequest(request),
        target_select: () => setSelectTargetRequest(request),
        feed_the_dead: () => setFeedTheDeadRequest({
          ...request,
          targetPlayerId: payload.targetPlayerId || payload.metadata?.targetPlayerId,
        }),
        grave_robber: () => setGraveRobberRequest(request),
        dig_deeper: () => setDigDeeperRequest({
          ...request,
          firstCard: payload.firstCard || payload.metadata?.firstCard,
        }),
        armageddon: () => setArmageddonRequest({
          ...request,
          stage: payload.stage || 'distribute',
        }),
      };

      handlersByType[payload.type]?.();
    };

    const onClairvoyanceReveal = ({ cards, targetPlayerId }) => {
      setClairvoyanceReveal({ cards, targetPlayerId });
      setTimeout(() => setClairvoyanceReveal(null), 5000);
    };

    socket.on('game:nopeWindow', onNopeWindow);
    socket.on('game:nowOnlyWindow', onNowOnlyWindow);
    socket.on('game:nowOnlyWindow:end', onNowOnlyWindowEnd);
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
    socket.on('game:armageddon:request', onArmageddonRequest);
    socket.on('interaction:request', onInteractionRequest);
    socket.on('interaction_request:feed_the_dead', onFeedTheDeadRequest);
    socket.on('interaction_request:grave_robber', onGraveRobberRequest);
    socket.on('interaction_request:dig_deeper', onDigDeeperRequest);
    socket.on('interaction_request:armageddon', onArmageddonRequest);
    socket.on('clairvoyance:reveal', onClairvoyanceReveal);

    return () => {
      socket.off('game:nopeWindow', onNopeWindow);
      socket.off('game:nowOnlyWindow', onNowOnlyWindow);
      socket.off('game:nowOnlyWindow:end', onNowOnlyWindowEnd);
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
      socket.off('game:armageddon:request', onArmageddonRequest);
      socket.off('interaction:request', onInteractionRequest);
      socket.off('interaction_request:feed_the_dead', onFeedTheDeadRequest);
      socket.off('interaction_request:grave_robber', onGraveRobberRequest);
      socket.off('interaction_request:dig_deeper', onDigDeeperRequest);
      socket.off('interaction_request:armageddon', onArmageddonRequest);
      socket.off('clairvoyance:reveal', onClairvoyanceReveal);
    };
  }, [socket, t, setStatusMessage]);

  return {
    nopeWindow,
    setNopeWindow,
    nopeResult,
    nowCardToast,
    setNowCardToast,
    seeTheFutureCards,
    setSeeTheFutureCards,
    activeInteractionRequest,
    setActiveInteractionRequest,
    alterFutureRequest: requestForType('alter_the_future'),
    setAlterFutureRequest,
    favorRequest: requestForType('favor'),
    setFavorRequest,
    buryRequest: requestForType('bury'),
    setBuryRequest,
    garbageRequest: requestForType('garbage_collection'),
    setGarbageRequest,
    potLuckRequest: requestForType('pot_luck'),
    setPotLuckRequest,
    zombieRequest: requestForType('zombie'),
    setZombieRequest,
    defuseRequest: requestForType('defuse'),
    setDefuseRequest,
    selectTargetRequest: requestForType('target_select'),
    setSelectTargetRequest,
    feedTheDeadRequest: requestForType('feed_the_dead'),
    setFeedTheDeadRequest,
    graveRobberRequest: requestForType('grave_robber'),
    setGraveRobberRequest,
    digDeeperRequest: requestForType('dig_deeper'),
    setDigDeeperRequest,
    armageddonRequest: requestForType('armageddon'),
    setArmageddonRequest,
    clairvoyanceReveal,
    clearResolvedInteractions,
  };
}
