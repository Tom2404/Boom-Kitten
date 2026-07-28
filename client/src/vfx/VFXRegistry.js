import { ExplosionEffect } from './effects/ExplosionEffect.js';
import {
  REQUIRED_VFX_KEYS,
  VFX_ATTACK_KEYS,
  VFX_CARD_TYPES,
} from './config/vfxRegistryKeys.js';

export { REQUIRED_VFX_KEYS, VFX_ATTACK_KEYS, VFX_CARD_TYPES };

export function registerCoreVFX(registry) {
  registry.register('CARD_EXPLODING_KITTEN', (event, vfxManager) => ExplosionEffect({ event, vfxManager }));
  registry.register('EXPLOSION', (event, vfxManager) => ExplosionEffect({ event, vfxManager }));
}
