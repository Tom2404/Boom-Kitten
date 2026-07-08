import { VFXFactory } from '../VFXFactory';

export function AttackEffect({ event, vfxManager }) {
  const type = event.animKey?.replace(/^CARD_/, '') || 'ATTACK';
  return VFXFactory.createAnimation(vfxManager, { type }, event.metadata);
}
