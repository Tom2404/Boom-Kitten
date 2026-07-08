import { animationManager } from './AnimationManager';
import { VFXFactory } from './VFXFactory';
import { registerCoreVFX } from './VFXRegistry';

registerCoreVFX(animationManager);

animationManager.register('DRAW_CARD', (event, vfxManager) => {
  return VFXFactory.createDrawCard(vfxManager, event.metadata);
});
