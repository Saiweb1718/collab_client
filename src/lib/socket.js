import { io } from 'socket.io-client';
import { SERVER_URL } from '../api/client.js';

// Single shared socket connection. Auth travels via the httpOnly cookie
// (withCredentials), so no token handling is needed on the client.
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SERVER_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
