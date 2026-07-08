import { CardPlayEffect } from './effects/CardPlayEffect.js';
import { SkipArrowEffect } from './effects/SkipArrowEffect.js';
import { ExplosionEffect } from './effects/ExplosionEffect.js';
import { DefuseEffect } from './effects/DefuseEffect.js';
import { NopeEffect } from './effects/NopeEffect.js';
import { AttackEffect } from './effects/AttackEffect.js';
import { ShuffleEffect } from './effects/ShuffleEffect.js';
import { TurnChangeEffect } from './effects/TurnChangeEffect.js';
import { ReverseEffect } from './effects/ReverseEffect.js';
import {
  REQUIRED_VFX_KEYS,
  VFX_ATTACK_KEYS,
  VFX_CARD_TYPES,
} from './config/vfxRegistryKeys.js';

export { REQUIRED_VFX_KEYS, VFX_ATTACK_KEYS, VFX_CARD_TYPES };

export function registerCoreVFX(registry) {
  VFX_CARD_TYPES.forEach((cardType) => {
    registry.register(`CARD_${cardType}`, (event, vfxManager) => CardPlayEffect({ event, vfxManager }));
  });

  registry.register('CARD_SKIP', (event, vfxManager) => SkipArrowEffect({ event, vfxManager }));
  registry.register('CARD_SUPER_SKIP', (event, vfxManager) => SkipArrowEffect({ event, vfxManager }));
  registry.register('CARD_REVERSE', (event, vfxManager) => ReverseEffect({ event, vfxManager }));
  registry.register('CARD_NOPE', (event, vfxManager) => NopeEffect({ event, vfxManager }));
  registry.register('CARD_SHUFFLE', (event, vfxManager) => ShuffleEffect({ event, vfxManager }));
  registry.register('CARD_SHUFFLE_NOW', (event, vfxManager) => ShuffleEffect({ event, vfxManager }));
  registry.register('CARD_EXPLODING_KITTEN', (event, vfxManager) => ExplosionEffect({ event, vfxManager }));
  registry.register('EXPLOSION', (event, vfxManager) => ExplosionEffect({ event, vfxManager }));
  registry.register('CARD_DEFUSE', (event, vfxManager) => DefuseEffect({ event, vfxManager }));
  registry.register('ENV_TURN_HIGHLIGHT', (event, vfxManager) => TurnChangeEffect({ event, vfxManager }));

  VFX_ATTACK_KEYS.forEach((animKey) => {
    registry.register(animKey, (event, vfxManager) => AttackEffect({ event, vfxManager }));
  });
}
