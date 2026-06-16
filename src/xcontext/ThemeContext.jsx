import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = 'collab-theme';
const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const resolveDark = (mode) => mode === 'dark' || (mode === 'system' && systemPrefersDark());

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'system');
  const isDark = resolveDark(mode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, isDark]);

  // React to OS theme changes while in "system" mode.
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => document.documentElement.classList.toggle('dark', mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [mode]);

  const toggle = useCallback(() => setMode(resolveDark(mode) ? 'light' : 'dark'), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle, isDark }}>{children}</ThemeContext.Provider>
  );
}
