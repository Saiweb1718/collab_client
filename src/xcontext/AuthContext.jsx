import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/index.js';
import { setToken, getToken } from '../api/client.js';
import { connectSocket, disconnectSocket } from '../lib/socket.js';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap session from a stored bearer token (skip the call if there's none).
  useEffect(() => {
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        setUser(res.data.user);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Keep the socket connected exactly while authenticated.
  useEffect(() => {
    if (user) connectSocket();
    else disconnectSocket();
    return () => {};
  }, [user]);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const signup = useCallback(async (body) => {
    const res = await authApi.signup(body);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setToken(null);
      disconnectSocket();
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((partial) => setUser((u) => ({ ...u, ...partial })), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
