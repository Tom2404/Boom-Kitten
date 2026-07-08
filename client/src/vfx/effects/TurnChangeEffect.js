import { VFXFactory } from '../VFXFactory';

export function TurnChangeEffect({ event, vfxManager }) {
  if (event.metadata?.targetId) {
    return VFXFactory.createAnimation(vfxManager, { type: 'GENERIC' }, event.metadata);
  }
  return null;
}
