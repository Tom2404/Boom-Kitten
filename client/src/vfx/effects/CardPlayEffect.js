import { VFXFactory } from '../VFXFactory';

export function CardPlayEffect({ event, vfxManager }) {
  const cardType = event.metadata?.cardType || event.animKey?.replace(/^CARD_/, '') || 'GENERIC';
  const normalizedType = String(cardType).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  return VFXFactory.createAnimation(vfxManager, { type: normalizedType }, event.metadata);
}
