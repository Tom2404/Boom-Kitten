// Shared socket hook so every page/component uses one Socket.io client instance.
import { io } from 'socket.io-client';

let socket;

export function useSocket() {
  if (!socket) {
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = `guest-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('guestId', guestId);
    }
    socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:5000', {
      autoConnect: false,
      auth: { 
        token: localStorage.getItem('accessToken') ?? '',
        guestId: guestId,
      },
    });
  }
  return socket;
}
