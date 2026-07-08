import { VFXFactory } from '../VFXFactory';

export function SkipArrowEffect({ event, vfxManager }) {
  const type = event.animKey === 'CARD_SUPER_SKIP' ? 'SUPER_SKIP' : 'SKIP';
  return VFXFactory.createAnimation(vfxManager, { type }, event.metadata);
}
