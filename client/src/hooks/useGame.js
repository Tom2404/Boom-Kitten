// Lightweight game hook to store game state sent from the server.
import { useEffect, useState } from 'react';
import { useSocket } from './useSocket.js';

export function useGame() {
  const socket = useSocket();
  const [state, setState] = useState(null);

  useEffect(() => {
    const onUpdate = ({ publicGameState }) => setState(publicGameState);
    socket.on('game:stateUpdate', onUpdate);
    return () => socket.off('game:stateUpdate', onUpdate);
  }, [socket]);

  return { state, socket };
}
