import { useEffect, useRef } from 'react';
import { cx } from '../../primitives/cx';
import { motionAllowed } from '../../primitives/motion';

// The prototype's .ai-cursor (sim.css): a ▍ in the AI colour after text that is still arriving,
// blinking once a second. It is decoration: hidden from assistive technology, and not shown at all
// unless motion is welcome (hidden, then motion-safe:inline), so reduced motion sees the text alone.
// The blink is played with the Web Animations API, so the library needs no keyframes of its own.
export function StreamCaret({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof element.animate !== 'function') return;
    if (!motionAllowed()) return;
    const blink = element.animate(
      [
        { opacity: 1 },
        { opacity: 1, offset: 0.5 },
        { opacity: 0, offset: 0.5 },
        { opacity: 0 },
      ],
      { duration: 1000, iterations: Infinity },
    );
    return () => blink.cancel();
  }, []);
  return (
    <span
      ref={ref}
      data-slot="caret"
      aria-hidden="true"
      className={cx(
        'ml-px hidden font-normal not-italic text-ai motion-safe:inline',
        className,
      )}
    >
      ▍
    </span>
  );
}
