import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
}

const sizes = {
  sm: 'size-icon-xs',
  md: 'size-spinner',
  lg: 'size-icon-md',
};

// Canonical loading spinner primitive across all controls.
// Accessible (aria-hidden by default since parent control holds aria-busy),
// motion-safe (reduced-motion freezes animation), and scalable.
export function Spinner({
  size = 'md',
  inline = false,
  className,
  ...rest
}: SpinnerProps) {
  return (
    <span
      data-spinner=""
      aria-hidden="true"
      className={cx(
        inline
          ? 'inline-flex items-center justify-center'
          : 'absolute inset-0 flex items-center justify-center',
        className,
      )}
      {...rest}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        focusable="false"
        className={cx(
          'animate-spin motion-reduce:animate-none shrink-0',
          sizes[size],
        )}
      >
        <circle cx="10" cy="10" r="7.5" opacity="0.3" />
        <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" />
      </svg>
    </span>
  );
}
