import { useEffect } from 'react';
import { CARD_THEMES } from '../components/Card.jsx';

export function useGameLogEvents({
  socket,
  t,
  setStatusMessage,
  setActionLog,
  setNowCardToast,
  roomStateRef,
  gameStateRef,
}) {
  useEffect(() => {
    const getUsername = (pId) => {
      const player = roomStateRef.current?.players?.find(p => p.userId === pId) || gameStateRef.current?.players?.find(p => p.userId === pId);
      return player ? player.username : pId;
    };

    const getCardName = (type) => {
      const clean = type.startsWith('discard_') ? type.replace('discard_', '') : type;
      const key = `card_${clean}_name`;
      const translated = t(key);
      if (translated !== key) return translated;
      return CARD_THEMES[clean]?.name || clean;
    };

    const onExploded = ({ playerId }) => {
      const pName = getUsername(playerId);
      setStatusMessage(t('log_exploded', { name: pName }));
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: t('log_exploded', { name: pName }), timestamp: new Date().toLocaleTimeString() }]);
    };

    // game:cardPlayedPending — logs regular action card plays before resolve
    const onCardPlayedPending = ({ playerId, cardType, targetPlayerId, canBeNoped }) => {
      if (!cardType) return;
      const pName = getUsername(playerId);
      const tName = targetPlayerId ? getUsername(targetPlayerId) : null;
      const cardName = getCardName(cardType);

      if (cardType && cardType.endsWith('_now') && cardType !== 'clairvoyance_now') {
        setNowCardToast({ playerName: pName, cardType, timestamp: Date.now() });
        setTimeout(() => setNowCardToast(null), 3000);
      }

      let msg = '';
      if (tName) {
        msg = t('log_played_target', { name: pName, card: cardName, target: tName });
      } else {
        msg = t('log_played', { name: pName, card: cardName });
      }
      if (canBeNoped) {
        msg += '...';
      }
      setStatusMessage(msg);
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: msg, timestamp: new Date().toLocaleTimeString() }]);
    };

    // game:cardPlayed — only for nope cards and discard (animationOnly) actions
    const onCardPlayed = ({ playerId, cardType, targetPlayerId, nopedCardType, animationOnly }) => {
      // Only log nope cards and non-animationOnly discards via this event
      if (!cardType) return;
      const pName = getUsername(playerId);
      const tName = targetPlayerId ? getUsername(targetPlayerId) : null;

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
      } else if (!animationOnly) {
        // Fallback for other legacy events
        const cardName = getCardName(cardType);
        if (tName) {
          msg = t('log_played_target', { name: pName, card: cardName, target: tName });
        } else {
          msg = t('log_played', { name: pName, card: cardName });
        }
      }
      if (msg) {
        setStatusMessage(msg);
        setActionLog(prev => [...prev, { id: Math.random().toString(), text: msg, timestamp: new Date().toLocaleTimeString() }]);
      }
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

    const onBarkingKittenResolved = ({ attackerId, targetId, flow }) => {
      const pName = getUsername(attackerId);
      const tName = targetId ? getUsername(targetId) : null;
      let msg = '';
      if (flow === 1) {
        msg = t('log_bk_waiting', { name: pName });
      } else if (flow === 2) {
        msg = t('log_bk_found', { name: pName, target: tName });
      } else if (flow === 3) {
        msg = t('log_bk_double', { name: pName, target: tName });
      } else if (flow === 4) {
        msg = t('log_bk_barked_back', { name: pName, target: tName });
      }
      setStatusMessage(msg);
      setActionLog(prev => [...prev, { id: Math.random().toString(), text: msg, timestamp: new Date().toLocaleTimeString() }]);
    };

    socket.on('game:barkingKitten:resolved', onBarkingKittenResolved);
    socket.on('game:exploded', onExploded);
    socket.on('game:drewKitten', onDrewKitten);
    // Listen to both pending (action cards) and played (nope/discard) for logs
    socket.on('game:cardPlayedPending', onCardPlayedPending);
    socket.on('game:cardPlayed', onCardPlayed);
    socket.on('game:cardDrawn', onCardDrawn);
    socket.on('game:turnChanged', onTurnChanged);

    return () => {
      socket.off('game:barkingKitten:resolved', onBarkingKittenResolved);
      socket.off('game:exploded', onExploded);
      socket.off('game:drewKitten', onDrewKitten);
      socket.off('game:cardPlayedPending', onCardPlayedPending);
      socket.off('game:cardPlayed', onCardPlayed);
      socket.off('game:cardDrawn', onCardDrawn);
      socket.off('game:turnChanged', onTurnChanged);
    };
  }, [socket]);
}
