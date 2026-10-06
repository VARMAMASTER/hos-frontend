import { useEffect, useState, type RefObject } from 'react';
import { motionAllowed } from '../../primitives/motion';

// The AI conversation's motion: the streaming caret, the thinking dots and the copilot orb's
// breathing halo and orbit ring. They loop, so they are played with the Web Animations API (the
// library ships no keyframes of its own, as primitives/motion.ts explains) and only while the person
// has not asked for less motion. The preference is followed live: switching it on stops every loop
// at once and leaves the still, fully visible state. Internal: not exported from the package.

const REDUCE = '(prefers-reduced-motion: reduce)';

export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(motionAllowed);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia(REDUCE);
    const update = () => setAllowed(!query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return allowed;
}

// Loops `keyframes` on the element for as long as it is active and motion is welcome. Pass stable
// (module-level) keyframes and options, or the loop restarts on every render.
export function useLoopMotion(
  ref: RefObject<Element | null>,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  active = true,
): void {
  const allowed = useMotionAllowed();
  useEffect(() => {
    const element = ref.current;
    if (!active || !allowed || !element) return;
    if (typeof element.animate !== 'function') return;
    const animation = element.animate(keyframes, {
      iterations: Infinity,
      ...options,
    });
    return () => animation.cancel();
  }, [ref, keyframes, options, active, allowed]);
}
