import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';

// `secondary` is the old name of `outline`, kept so no caller breaks.
// @deprecated value 'secondary': use 'outline'.
export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'ai'
  | 'secondary';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // A spinner replaces the label (the label keeps the width), the button is aria-busy, and a press
  // does nothing, so a slow save cannot be submitted twice. It stays focusable.
  loading?: boolean;
  // Stretch to the container's width.
  fullWidth?: boolean;
}

type DrawnVariant = Exclude<ButtonVariant, 'secondary'>;

// The prototype's .btn (os/public/assets/hos.css): a 13px semibold label, 8px by 16px of padding, an
// 8px radius (the prototype's own 9px is off its --r-* scale) and a 1px border, transparent unless the
// variant draws one, so a row of mixed variants shares one height. It lifts to shadow-md on hover and
// presses down 1px to shadow-sm, only when motion is welcome.
const base = cx(
  'relative inline-flex items-center justify-center rounded-sm border font-semibold',
  'transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out motion-reduce:transition-none',
  'hover:shadow-md motion-safe:active:translate-y-px active:shadow-sm aria-disabled:active:translate-y-0 aria-busy:active:translate-y-0',
  focusRing,
  'disabled:pointer-events-none disabled:opacity-50',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
);

// primary is .btn-primary, ai .btn-ai, ghost .btn-ghost and danger .btn-danger-ghost. outline is the
// prototype's outlined primary (the row action): its 1px primary border is its only boundary, and
// material.spec.ts proves the primary at 3:1 on every light surface and on the bare canvas, for every
// hospital brand. Its fill is the surface (the white of the prototype's row), so its primary-strong
// text holds 4.5:1 wherever it is placed, the dark chrome included; white on its hover is gated.
const variants: Record<DrawnVariant, string> = {
  primary:
    'border-transparent bg-primary text-on-primary hover:bg-primary-hover',
  outline:
    'border-primary bg-surface text-primary-strong hover:bg-primary hover:text-on-primary',
  ghost: 'border-border-strong bg-surface text-ink hover:bg-surface-2',
  danger: 'border-border-strong bg-surface text-crit-deep hover:bg-surface-2',
  ai: 'border-transparent bg-ai text-on-primary hover:bg-ai-hover',
};

// variant="ai" is the plain, solid .btn-ai of the prototype (a table row action, the Approve button of
// an approval bar). The animated, playful AI button is AiButton (components/ai-button).
const AI_SPARK = "before:content-['✦'_/_'']";

// md is .btn, sm is .btn-sm (6px by 10px, 12px type; its 7px radius is off-scale too).
const sizes: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-[12px]',
  md: 'px-4 py-2 text-[13px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      type = 'button',
      loading = false,
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
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
        onClick={unavailable ? (event) => event.preventDefault() : onClick}
      >
        {/* The label stays in the layout and in the accessible name while loading, only invisible,
            so the button keeps its width; the spinner sits over it. */}
        <span
          className={cx(
            'inline-flex items-center justify-center gap-2',
            // The AI spark is decoration: generated content with empty alternative text, so it is
            // neither in the accessible name nor in the button's text.
            drawn === 'ai' && AI_SPARK,
            loading && 'opacity-0',
          )}
        >
          {children}
        </span>
        {loading ? <Spinner /> : null}
      </button>
    );
  },
);

function Spinner() {
  return (
    <span
      data-spinner=""
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        focusable="false"
        className="size-[1.1em] animate-spin motion-reduce:animate-none"
      >
        <circle cx="10" cy="10" r="7.5" opacity="0.3" />
        <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" />
      </svg>
    </span>
  );
}
