import { useEffect } from 'react';
import { animationManager } from '../vfx/AnimationManager.js';

export function useAnimationSocketEvents(socket) {
  useEffect(() => {
    const onDisconnect = () => {
      animationManager.clear();
    };

    socket.on('disconnect', onDisconnect);
    socket.on('game:ended', onDisconnect);
    socket.on('room:kicked', onDisconnect);

    return () => {
      socket.off('disconnect', onDisconnect);
      socket.off('game:ended', onDisconnect);
      socket.off('room:kicked', onDisconnect);
      animationManager.clear();
    };
  }, [socket]);
}
