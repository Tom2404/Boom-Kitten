import { VFXFactory } from '../VFXFactory';

export function DefuseEffect({ event, vfxManager }) {
  return VFXFactory.createDefuse(vfxManager, event.metadata);
}
