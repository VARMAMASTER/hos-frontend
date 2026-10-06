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

// The pill CTA (docs/design-language/README.md): the shape carries the emphasis, so the label stays
// at 400, and there is never a shadow or a gradient. It presses to 0.95, only when motion is welcome.
const base = cx(
  // A true capsule opts out of the global squircle, which would flatten its ends into a rounded
  // rectangle. Every variant has a 1px border (transparent unless it is the outline's edge), so a row
  // of mixed variants shares one height.
  'relative inline-flex items-center justify-center rounded-full [corner-shape:round] border font-normal',
  'transition-[color,background-color,border-color,transform] duration-150 ease-out motion-reduce:transition-none',
  'motion-safe:active:scale-95 aria-disabled:active:scale-100 aria-busy:active:scale-100',
  focusRing,
  'disabled:pointer-events-none disabled:opacity-50',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
);

// The outline's 1px primary border is its only boundary: material.spec.ts proves the primary at 3:1
// on every light surface and on the bare canvas, for every hospital brand. Its own fill is the
// surface (Apple's canvas), so its primary-strong text holds 4.5:1 anywhere it is placed, the dark
// chrome included; the theme gate also holds that text on primary-soft (hover) and the canvas
// (ghost).
const variants: Record<DrawnVariant, string> = {
  primary:
    'border-transparent bg-primary text-on-primary hover:bg-primary-strong',
  outline:
    'border-primary bg-surface text-primary-strong hover:bg-primary-soft',
  ghost: 'border-transparent text-primary-strong hover:bg-primary-soft',
  danger: 'border-transparent bg-crit text-on-primary hover:bg-crit-deep',
  ai: 'border-transparent bg-ai text-on-primary hover:bg-ai-deep',
};

const AI_SPARK = "before:content-['✦'_/_'']";

const sizes: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-callout',
  md: 'px-6 py-3 text-body',
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
