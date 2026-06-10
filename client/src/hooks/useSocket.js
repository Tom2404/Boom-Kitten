// Shared socket hook so every page/component uses one Socket.io client instance.
import { io } from 'socket.io-client';

let socket;

export function useSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:5000', {
      autoConnect: false,
      auth: { token: localStorage.getItem('accessToken') ?? '' },
    });
  }
  return socket;
}
