import { useSyncExternalStore } from 'react';

// Whether a media query matches, kept live. Where the browser cannot answer (server rendering,
// jsdom), `fallback` is the answer.
export function useMediaQuery(query: string, fallback: boolean): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => undefined;
      }
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () =>
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia(query).matches
        : fallback,
    () => fallback,
  );
}
