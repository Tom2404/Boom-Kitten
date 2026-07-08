import { VFXFactory } from '../VFXFactory';

export function ReverseEffect({ event, vfxManager }) {
  return VFXFactory.createAnimation(vfxManager, {
    type: 'REVERSE',
  }, event.metadata);
}
