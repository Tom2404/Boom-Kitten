import { VFXFactory } from '../VFXFactory';

export function NopeEffect({ event, vfxManager }) {
  return VFXFactory.createAnimation(vfxManager, { type: 'NOPE' }, event.metadata);
}
