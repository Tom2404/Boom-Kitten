import { useEffect } from 'react';
import { animationManager } from '../vfx/AnimationManager.js';
import { fromGameSocketEvent, normalizeVFXEvent } from '../vfx/VFXEventAdapter.js';

export function useAnimationSocketEvents(socket) {
  useEffect(() => {
    const onAnimationTrigger = (payload) => {
      animationManager.enqueue(normalizeVFXEvent(payload));
    };

    const onAnimationBatch = (payloads) => {
      animationManager.enqueueBatch((Array.isArray(payloads) ? payloads : []).map(normalizeVFXEvent));
    };

    const onAnimationCancel = ({ animId }) => {
      animationManager.cancel(animId);
    };


    const onDisconnect = () => {
      animationManager.clear();
    };

    socket.on('animation_trigger', onAnimationTrigger);
    socket.on('animation_batch', onAnimationBatch);
    socket.on('animation_cancel', onAnimationCancel);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('animation_trigger', onAnimationTrigger);
      socket.off('animation_batch', onAnimationBatch);
      socket.off('animation_cancel', onAnimationCancel);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);
}
