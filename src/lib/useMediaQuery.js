import { useEffect, useState } from 'react';

// Reactive media query. `useMediaQuery('(min-width: 1024px)')` → boolean.
export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [query]);

  return matches;
}

// Tailwind's `lg` breakpoint — our desktop/mobile dividing line.
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
