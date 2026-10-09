import { useRef, type HTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { SparkleCluster } from '../../primitives/ai-sparkle';
import { MOTION_EASINGS } from '../../tokens/scale';
import { useLoopMotion } from '../../primitives/use-motion';

export interface AiThinkingProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // What HOS AI is doing, in words: "Thinking…", "Checking live data". Translatable.
  label?: string;
}

// The prototype's .ai-thinking dot: 5px (size-dot-sm), AI-coloured, 2px from its neighbour (ml-s0),
// bobbing 3px (--nova-typing-hop, which the Web Animations API resolves in a keyframe) with the
// opacity rising from 0.25, 1.2s round, each 0.18s behind the last.
const BOB: Keyframe[] = [
  { opacity: 0.25, transform: 'translateY(0)' },
  { opacity: 1, transform: 'translateY(calc(var(--nova-typing-hop) * -1))' },
  { opacity: 0.25, transform: 'translateY(0)' },
];
const DOT_TIMING: readonly KeyframeAnimationOptions[] = [0, 180, 360].map(
  (delay) => ({ duration: 1200, delay, easing: MOTION_EASINGS.standard }),
);

function Dot({ timing }: { timing: KeyframeAnimationOptions }) {
  const ref = useRef<HTMLElement>(null);
  useLoopMotion(ref, BOB, timing);
  return (
    <i
      ref={ref}
      data-dot=""
      className="ml-s0 inline-block size-dot-sm rounded-full bg-ai"
    />
  );
}

// The row HOS AI shows while it works on an answer: the ✦ mark and a label in words, then three
// dots. Elevated with radiant 3-star sparkle cluster and glowing glass styling.
export function AiThinking({
  label = 'Thinking…',
  className,
  ...rest
}: AiThinkingProps) {
  return (
    <div
      data-ai-thinking=""
      className={cx(
        'inline-flex items-center gap-s2 rounded-full border border-ai-bright/20 bg-ai-soft/40 px-s3 py-s1 text-body-sm font-semibold text-ai-deep shadow-sm',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="relative inline-flex items-center text-ai-bright"
      >
        <SparkleCluster
          size="xs"
          className="text-ai-bright motion-safe:animate-pulse"
        />
      </span>
      {label}
      <span aria-hidden="true" className="inline-flex items-center">
        {DOT_TIMING.map((timing, index) => (
          <Dot key={index} timing={timing} />
        ))}
      </span>
    </div>
  );
}
