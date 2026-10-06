// Small entrance and attention animations, played with the Web Animations API so the library needs
// no keyframes of its own. Someone who asked their system for less motion gets none: where the
// preference cannot be read (server rendering, jsdom) or the browser has no element.animate, nothing
// plays either, and the finished state is what shows.
export function motionAllowed(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function playMotion(
  element: Element | null,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
): void {
  if (!element || typeof element.animate !== 'function') return;
  if (!motionAllowed()) return;
  element.animate(keyframes, options);
}
