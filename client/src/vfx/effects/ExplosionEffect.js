import { VFXFactory } from '../VFXFactory';

export function ExplosionEffect({ event, vfxManager }) {
  return VFXFactory.createExplodingKitten(vfxManager, event.metadata);
}
