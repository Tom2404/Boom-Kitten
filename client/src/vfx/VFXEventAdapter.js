import { cardTypeToAnimKey, gameEventToAnimKey } from './config/vfxEventMap';

export const VFX_PRIORITY = {
  LOW: 'LOW',
  HIGH: 'HIGH',
  INTERRUPT: 'INTERRUPT',
};

let localAnimSequence = 0;

const nextAnimId = () => {
  localAnimSequence += 1;
  return `vfx-${Date.now()}-${localAnimSequence}`;
};

export function normalizeVFXEvent(rawEvent = {}) {
  const metadata = rawEvent.metadata || {};
  const animKey = rawEvent.animKey || cardTypeToAnimKey(rawEvent.cardType || metadata.cardType);

  return {
    ...rawEvent,
    animId: rawEvent.animId || metadata.animId || nextAnimId(),
    animKey,
    priority: rawEvent.priority || VFX_PRIORITY.HIGH,
    sourceId: rawEvent.sourceId || metadata.sourceId,
    targetId: rawEvent.targetId || metadata.targetId,
    metadata: {
      ...metadata,
      sourceId: rawEvent.sourceId || metadata.sourceId,
      targetId: rawEvent.targetId || metadata.targetId,
      cardType: metadata.cardType || rawEvent.cardType,
    },
  };
}

export function fromGameSocketEvent(eventName, payload = {}, context = {}) {
  const animKey = gameEventToAnimKey(eventName, payload);
  const metadata = {
    ...payload,
    sourceId: payload.sourceId,
    targetId: payload.targetId,
    actorId: payload.playerId || payload.actorId,
    targetPlayerId: payload.targetPlayerId,
    isMyTurn: payload.playerId ? payload.playerId === context.myUserId : payload.isMyTurn,
  };

  if (eventName === 'game:cardPlayed') {
    metadata.sourceId = payload.playerId === context.myUserId
      ? 'player-hand-container'
      : `player-avatar-${payload.playerId}`;
    metadata.targetId = payload.targetId || 'discard-pile-element';
  }

  if (eventName === 'game:cardDrawn') {
    metadata.targetId = payload.playerId;
  }

  if (eventName === 'game:exploded') {
    metadata.targetId = payload.playerId === context.myUserId
      ? 'player-hand-container'
      : `player-avatar-${payload.playerId}`;
  }

  return normalizeVFXEvent({
    animKey,
    priority: animKey === 'EXPLOSION' || animKey === 'CARD_EXPLODING_KITTEN'
      ? VFX_PRIORITY.INTERRUPT
      : VFX_PRIORITY.HIGH,
    metadata,
  });
}
