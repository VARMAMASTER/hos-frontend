import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { SparkleCluster } from '../../primitives/ai-sparkle';
import { focusRing } from '../../primitives/focus-ring';
import { ariaDisabled, disabledControl } from '../../primitives/states';
import type { Size } from '../../primitives/types';
import { VisuallyHidden } from '../../primitives/visually-hidden';

export type AiButtonSize = Size;
export type AiButtonState = 'idle' | 'thinking' | 'done';
export type AiButtonVariant = 'default' | 'glow' | 'hero';

export interface AiButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: AiButtonVariant;
  badge?: ReactNode;
  size?: AiButtonSize;
  // The label while idle ("Draft summary"): the caller's words, in the caller's language (set `lang`).
  children: ReactNode;
  // Which state the button shows. The caller owns it: AiButton never starts or ends the work. When
  // it is not given, `loading` decides between idle and thinking.
  state?: AiButtonState;
  // Shorthand for state="thinking".
  loading?: boolean;
  // The fixed words of the other two states, so they can be translated.
  thinkingLabel?: string;
  doneLabel?: string;
  // A slow breathing glow while idle. Off by default: a clinical screen should not be restless.
  idle?: boolean;
  // Stretch to the container's width.
  fullWidth?: boolean;
}

// The upgraded AI action: glowing neon pill with GPU-accelerated rotating conic border,
// ambient aura backlight, 3-star sparkle cluster, and deep space navy glass gradient fill.
// Every moving part is motion-safe (keyframes in theme.css), so under prefers-reduced-motion
// it falls back to a crisp static border and calm steady glow.
const base = cx(
  'group/ai relative inline-flex items-center justify-center rounded-full border border-transparent font-medium text-on-primary',
  'nova-ai-hero-fill',
  focusRing,
  disabledControl,
  ariaDisabled,
);

const sizes: Record<AiButtonSize, string> = {
  sm: 'min-h-control-sm px-s5 py-s2 text-label gap-s2',
  md: 'min-h-touch px-s8 py-s3 text-body gap-s3',
};

// The press squashes and springs back (ease-spring overshoots on release); the edge picks up the
// AI glow on hover and keyboard focus (a shadow, so it stays under reduced motion).
const interactive = cx(
  'hover:bg-ai-hover hover:nova-ai-glow focus-visible:nova-ai-glow',
  'motion-safe:transition-[transform,box-shadow,background-color] motion-safe:duration-base motion-safe:ease-spring motion-safe:active:scale-95',
);

// The slow breathing, over a still halo; hover and focus hand over to the steady glow.
const breathing = cx(
  'nova-ai-halo motion-safe:animate-ai-breathe',
  'motion-safe:hover:animate-none motion-safe:focus-visible:animate-none',
);

// The six particles of the done burst, at even angles around the mark.
const BURST_ANGLES = [0, 60, 120, 180, 240, 300] as const;

export const AiButton = forwardRef<HTMLButtonElement, AiButtonProps>(
  function AiButton(
    {
      variant = 'default',
      badge,
      size = 'md',
      type = 'button',
      state: stateProp,
      loading = false,
      thinkingLabel = 'Thinking…',
      doneLabel = 'Done',
      idle = false,
      fullWidth = false,
      className,
      onClick,
      children,
      ...rest
    },
    ref,
  ) {
    const state: AiButtonState = stateProp ?? (loading ? 'thinking' : 'idle');
    const thinking = state === 'thinking';
    const ariaDisabled =
      rest['aria-disabled'] === true || rest['aria-disabled'] === 'true';
    // A thinking button is focusable but does nothing, so a slow draft cannot be requested twice.
    const unavailable = thinking || ariaDisabled;
    // Hover, focus and press motion belongs to a button that can be pressed.
    const available = !unavailable && !rest.disabled;
    // A disabled button (natively or aria-disabled) is off: it plays no loop, burst or conic animation.
    const playing = !rest.disabled && !ariaDisabled;
    const announced =
      state === 'thinking' ? thinkingLabel : state === 'done' ? doneLabel : '';

    return (
      <>
        <button
          ref={ref}
          type={type}
          data-state={state}
          data-size={size}
          data-variant={variant !== 'default' ? variant : undefined}
          data-idle={idle || undefined}
          aria-busy={thinking || undefined}
          className={cx(
            base,
            sizes[size],
            thinking && 'cursor-progress',
            available && interactive,
            available && idle && breathing,
            fullWidth && 'w-full',
            className,
          )}
          {...rest}
          onClick={unavailable ? (event) => event.preventDefault() : onClick}
        >
          {badge ? (
            <span
              data-badge="true"
              className="pointer-events-none absolute -top-s2 -right-s1 z-10 flex items-center justify-center rounded-full nova-ai-badge px-s2 py-0 text-badge font-bold uppercase tracking-normal"
            >
              {badge}
            </span>
          ) : null}

          {playing ? (
            <span
              aria-hidden="true"
              data-layer="aura"
              className="pointer-events-none absolute -inset-s1 rounded-full nova-ai-hero-aura opacity-75 motion-safe:animate-ai-aura-pulse motion-reduce:hidden"
            />
          ) : null}

          {playing ? (
            <span
              aria-hidden="true"
              data-layer="conic-border"
              className="nova-ai-conic-border motion-reduce:hidden"
            >
              <span
                className={cx(
                  'nova-ai-conic-sweep',
                  thinking
                    ? 'motion-safe:animate-ai-conic-spin-fast'
                    : 'motion-safe:animate-ai-conic-spin',
                )}
              />
            </span>
          ) : null}

          <span
            aria-hidden="true"
            className="nova-ai-static-border hidden motion-reduce:block"
          />

          {/* Light passes over the fill: once on hover or focus, and on a loop while thinking. It is
              clipped to the button's own corners. */}
          <span
            aria-hidden="true"
            data-layer="clip"
            className="nova-radius-inherit pointer-events-none absolute inset-0 overflow-hidden"
          >
            {thinking && playing ? (
              <span
                data-layer="shimmer"
                className="nova-ai-sheen motion-safe:animate-ai-shimmer motion-reduce:hidden"
              />
            ) : available ? (
              <span
                data-layer="sheen"
                className="nova-ai-sheen motion-safe:group-hover/ai:animate-ai-sheen motion-safe:group-focus-visible/ai:animate-ai-sheen"
              />
            ) : null}
          </span>
          {thinking && playing ? <Orbit /> : null}
          {/* Every label carries its own mark, so the mark and the words sit together whichever label is
              the widest. All three labels share one grid cell: the widest sets the width, so the
              button never changes size between states. Only the live one is visible and in the
              accessible name. */}
          <span className="relative grid justify-items-center">
            <Label
              name="idle"
              live={state === 'idle'}
              twinkle={available}
            >
              {children}
            </Label>
            <Label
              name="thinking"
              live={thinking}
              twinkle={false}
            >
              {thinkingLabel}
            </Label>
            <Label
              name="done"
              live={state === 'done'}
              twinkle={available}
              burst={playing}
            >
              <span className="inline-flex items-center gap-s2">
                {state === 'done' ? (
                  <Check animate={playing} />
                ) : (
                  <span className={checkSlot} />
                )}
                {doneLabel}
              </span>
            </Label>
          </span>
        </button>
        {/* Polite, and only when the state changes: a sentence, never a character at a time. */}
        <VisuallyHidden
          role="status"
          aria-live="polite"
          aria-atomic="true"
          lang={rest.lang}
        >
          {announced}
        </VisuallyHidden>
      </>
    );
  },
);

const checkSlot = 'inline-block size-icon-sm shrink-0';

function Label({
  name,
  live,
  twinkle,
  burst = false,
  children,
}: {
  name: AiButtonState;
  live: boolean;
  // The mark twinkles on hover and keyboard focus, in the labels of a button that can be pressed.
  twinkle: boolean;
  // The done label bursts sparkles from its mark when it becomes the live one.
  burst?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      data-label={name}
      aria-hidden={live ? undefined : true}
      className={cx(
        'col-start-1 row-start-1 inline-flex items-center gap-control whitespace-nowrap',
        !live && 'invisible',
      )}
    >
      {/* The 3-star cluster is always drawn: AI is never marked by colour alone. It is decoration, so it is never
          in the accessible name. */}
      <span aria-hidden="true" className="relative inline-grid">
        <span
          data-mark=""
          aria-hidden="true"
          className={cx(
            'inline-block leading-none',
            live &&
              twinkle &&
              'motion-safe:group-hover/ai:animate-ai-twinkle motion-safe:group-focus-visible/ai:animate-ai-twinkle',
          )}
        >
          <SparkleCluster />
        </span>
        {live && burst ? <Burst /> : null}
      </span>
      {children}
    </span>
  );
}

// The check arrives after the burst and settles into the label, its stroke drawing in.
function Check({ animate }: { animate: boolean }) {
  return (
    <svg
      data-check=""
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      className={cx(checkSlot, animate && 'motion-safe:animate-ai-settle')}
    >
      <path
        d="M3 8.5l3.2 3.2L13 4.5"
        pathLength={1}
        className={cx(
          '[stroke-dasharray:1]',
          animate && 'motion-safe:animate-ai-draw',
        )}
      />
    </svg>
  );
}

// Six particles leave the mark once, then are gone.
function Burst() {
  return (
    <span
      aria-hidden="true"
      data-layer="burst"
      className="pointer-events-none absolute top-1/2 left-1/2 size-0 motion-reduce:hidden"
    >
      {BURST_ANGLES.map((angle, index) => (
        <span
          key={angle}
          style={{ '--nova-ai-angle': `${angle}deg` } as CSSProperties}
          className={cx(
            'absolute top-0 left-0 size-s1 rounded-full motion-safe:animate-ai-burst',
            index % 2 === 0 ? 'bg-on-primary' : 'bg-ai-bright',
          )}
        />
      ))}
    </span>
  );
}

// A sparkle circling inside the button's edge: x and y each swing edge to edge, a quarter of a lap
// apart, which traces an ellipse. Under reduced motion there is nothing to see, so it is hidden.
function Orbit() {
  return (
    <span
      aria-hidden="true"
      data-layer="orbit"
      className="pointer-events-none absolute inset-s1 motion-reduce:hidden"
    >
      <span className="absolute inset-y-0 left-0 motion-safe:animate-ai-orbit-x">
        <span className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-micro leading-none motion-safe:animate-ai-orbit-y">
          ✦
        </span>
      </span>
    </span>
  );
}
