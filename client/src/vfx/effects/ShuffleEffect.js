import { VFXFactory } from '../VFXFactory';

export function ShuffleEffect({ event, vfxManager }) {
  const type = event.animKey === 'CARD_SHUFFLE_NOW' ? 'SHUFFLE_NOW' : 'SHUFFLE';
  return VFXFactory.createAnimation(vfxManager, { type }, event.metadata);
}
