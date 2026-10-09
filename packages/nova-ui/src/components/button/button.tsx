import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Spinner } from '../../primitives/spinner';
import { ariaDisabled, disabledControl } from '../../primitives/states';
import type { Size } from '../../primitives/types';

// `secondary` is the old name of `outline`, kept so no caller breaks.
// @deprecated value 'secondary': use 'outline'.
export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'ai'
  | 'secondary';
export type ButtonSize = Size;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // A spinner replaces the label (the label keeps the width), the button is aria-busy, and a press
  // does nothing, so a slow save cannot be submitted twice. It stays focusable.
  loading?: boolean;
  // Optional text displayed alongside the spinner when loading (e.g. "Saving…").
  loadingText?: string;
  // Stretch to the container's width.
  fullWidth?: boolean;
}

type DrawnVariant = Exclude<ButtonVariant, 'secondary'>;

// The prototype's .btn (os/public/assets/hos.css), in tokens only: the control type role
// (text-control, 13px) semibold, the control padding (px-control-md by py-control-md, 16px by 8px),
// the control corner (rounded-control: the prototype's own 9px is off its --r-* scale, so --r-sm)
// and the hairline border, transparent unless the variant draws one. min-h-control-md is the height
// every md control shares (TextField, Select, a Tabs trigger), so a row of mixed controls lines up.
// It lifts to shadow-md on hover and presses down 1px to shadow-sm, only when motion is welcome, on
// the motion roles.
const base = cx(
  'relative inline-flex items-center justify-center border font-semibold',
  'transition-[color,background-color,border-color,box-shadow,transform] duration-fast ease-standard motion-reduce:transition-none',
  'hover:shadow-md motion-safe:active:translate-y-px active:shadow-sm aria-disabled:active:translate-y-0 aria-busy:active:translate-y-0',
  focusRing,
  disabledControl,
  ariaDisabled,
);

// primary is .btn-primary, ai is the elevated neon pill action, ghost .btn-ghost and danger .btn-danger-ghost.
// outline is the prototype's outlined primary (the row action).
const variants: Record<DrawnVariant, string> = {
  primary:
    'rounded-control border-transparent bg-primary text-on-primary hover:bg-primary-hover',
  outline:
    'rounded-control border-primary bg-surface text-primary-strong hover:bg-primary hover:text-on-primary',
  ghost: 'rounded-control border-border-strong bg-surface text-ink hover:bg-surface-2',
  danger: 'rounded-control border-border-strong bg-surface text-crit-deep hover:bg-surface-2',
  ai: 'rounded-full border-transparent nova-ai-hero-fill text-on-primary hover:bg-ai-hover hover:nova-ai-glow focus-visible:nova-ai-glow motion-safe:active:scale-95',
};

// variant="ai" is the plain, solid .btn-ai of the prototype (a table row action, the Approve button of
// an approval bar). The animated, playful AI button is AiButton (components/ai-button).
const AI_SPARK = "before:content-['✦'_/_'']";

// md is .btn, sm is .btn-sm (10px by 6px, the label type role; its 7px radius is off-scale too).
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-control-sm px-control-sm py-control-sm text-label',
  md: 'min-h-control-md px-control-md py-control-md text-control',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      type = 'button',
      loading = false,
      loadingText,
      fullWidth = false,
      className,
      onClick,
      children,
      ...rest
    },
    ref,
  ) {
    const drawn: DrawnVariant = variant === 'secondary' ? 'outline' : variant;
    // aria-disabled is the disabled state that keeps focus: a natively disabled button that holds
    // keyboard focus drops it to <body>. The button stays focusable and announced as unavailable,
    // and a press does nothing (not even submit a form). A loading button behaves the same way.
    const unavailable =
      loading ||
      rest['aria-disabled'] === true ||
      rest['aria-disabled'] === 'true';
    return (
      <button
        ref={ref}
        type={type}
        data-variant={drawn}
        data-size={size}
        aria-busy={loading || undefined}
        className={cx(
          base,
          variants[drawn],
          sizes[size],
          loading && 'cursor-progress',
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
        onClick={unavailable ? (event) => event.preventDefault() : onClick}
      >
        {drawn === 'ai' && !rest.disabled && !rest['aria-disabled'] ? (
          <>
            <span
              aria-hidden="true"
              data-layer="aura"
              className="pointer-events-none absolute -inset-s1 rounded-full nova-ai-hero-aura opacity-75 motion-safe:animate-ai-aura-pulse motion-reduce:hidden"
            />
            <span
              aria-hidden="true"
              data-layer="conic-border"
              className="nova-ai-conic-border motion-reduce:hidden"
            >
              <span
                className={cx(
                  'nova-ai-conic-sweep',
                  loading
                    ? 'motion-safe:animate-ai-conic-spin-fast'
                    : 'motion-safe:animate-ai-conic-spin',
                )}
              />
            </span>
          </>
        ) : null}
        {/* The label stays in the layout and in the accessible name while loading, only invisible,
            so the button keeps its width; the spinner sits over it. When loadingText is provided,
            the spinner is drawn inline with the label. */}
        {loadingText && loading ? (
          <span className="inline-flex items-center justify-center gap-s2">
            <Spinner inline size={size === 'sm' ? 'sm' : 'md'} />
            <span>{loadingText}</span>
          </span>
        ) : (
          <>
            <span
              className={cx(
                'inline-flex items-center justify-center gap-control',
                // The AI spark is decoration: generated content with empty alternative text, so it is
                // neither in the accessible name nor in the button's text.
                drawn === 'ai' && AI_SPARK,
                loading && 'opacity-0',
              )}
            >
              {children}
            </span>
            {loading ? <Spinner /> : null}
          </>
        )}
      </button>
    );
  },
);
