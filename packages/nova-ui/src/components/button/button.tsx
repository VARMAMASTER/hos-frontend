import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ai';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base = cx(
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors',
  focusRing,
  'disabled:pointer-events-none disabled:opacity-50',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
);

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong',
  secondary:
    'border border-border-control bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-primary-strong hover:bg-primary-soft',
  ai: 'bg-ai text-on-primary hover:bg-ai-deep',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      type = 'button',
      className,
      onClick,
      ...rest
    },
    ref,
  ) {
    // aria-disabled is the disabled state that keeps focus: a natively disabled button that holds
    // keyboard focus drops it to <body>. The button stays focusable and announced as unavailable,
    // and a press does nothing (not even submit a form).
    const unavailable =
      rest['aria-disabled'] === true || rest['aria-disabled'] === 'true';
    return (
      <button
        ref={ref}
        type={type}
        data-variant={variant}
        data-size={size}
        className={cx(base, variants[variant], sizes[size], className)}
        {...rest}
        onClick={unavailable ? (event) => event.preventDefault() : onClick}
      />
    );
  },
);
