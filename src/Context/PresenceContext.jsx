import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../lib/socket.js';
import { useAuth } from './AuthContext.jsx';

const PresenceContext = createContext({ online: new Set() });

export const usePresence = () => useContext(PresenceContext);

export function PresenceProvider({ children }) {
  const { user } = useAuth();
  const [online, setOnline] = useState(new Set());

  useEffect(() => {
    if (!user) {
      setOnline(new Set());
      return;
    }
    const socket = getSocket();

    const onList = ({ online: ids }) => setOnline(new Set(ids));
    const onUpdate = ({ userId, online: isOnline }) =>
      setOnline((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });

    socket.on('presence:list', onList);
    socket.on('presence:update', onUpdate);
    return () => {
      socket.off('presence:list', onList);
      socket.off('presence:update', onUpdate);
    };
  }, [user]);

  return <PresenceContext.Provider value={{ online }}>{children}</PresenceContext.Provider>;
}
