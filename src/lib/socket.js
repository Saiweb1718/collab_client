import { io } from 'socket.io-client';
import { SERVER_URL, getToken } from '../api/client.js';

// Single shared socket connection. Auth travels via the bearer token (handshake
// `auth.token`), which works cross-domain; the cookie is still sent when
// same-origin. The `auth` function is evaluated on every (re)connect so the
// latest token is always used.
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SERVER_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: (cb) => cb({ token: getToken() }),
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
