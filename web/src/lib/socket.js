import { io } from 'socket.io-client';

let socket = null;

/**
 * Connect to the Socket.io server with the given JWT token.
 * Idempotent — if already connected, returns the existing socket.
 */
export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
    auth: { token },
    transports: ['websocket'],
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function updateSocketToken(token) {
  if (socket) socket.auth = { token };
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
