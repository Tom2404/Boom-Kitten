import React, { useEffect, useRef } from 'react';
import { vfxManager } from '../vfx/VFXManager';
import { animationManager } from '../vfx/AnimationManager';
import { VFX_PRIORITY } from '../vfx/VFXEventAdapter';
import '../vfx/CardAnimations';
import '../vfx/EnvironmentFX';

const createVFXApi = () => ({
  playAnimation: (animKey, options = {}) => {
    animationManager.enqueue({
      animId: options.animId,
      animKey,
      priority: options.priority || VFX_PRIORITY.HIGH,
      sourceId: options.sourceId,
      targetId: options.targetId,
      cardType: options.cardType,
      metadata: options.metadata || {},
    });
  },
  trigger: (event) => {
    animationManager.enqueue(event);
  },
  cancel: (animId) => {
    animationManager.cancel(animId);
  },
  clear: () => {
    animationManager.clear();
  },
  shake: (intensity = 10, duration = 0.3) => {
    animationManager.enqueue({
      animKey: 'ENV_SCREEN_SHAKE',
      priority: VFX_PRIORITY.LOW,
      metadata: { intensity, duration },
    });
  },
});

export const VFXOverlay = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const vfxApi = createVFXApi();
    window.vfxManager = vfxApi;

    if (canvasRef.current) {
      vfxManager.init(canvasRef.current);
    }

    return () => {
      animationManager.clear();
      vfxManager.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};
