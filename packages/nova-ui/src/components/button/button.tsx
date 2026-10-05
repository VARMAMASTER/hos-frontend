import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ai';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong',
  secondary:
    'border border-border-strong bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-primary-strong hover:bg-primary-soft',
  ai: 'bg-ai text-on-primary hover:bg-ai-deep',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', type = 'button', className, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        data-variant={variant}
        data-size={size}
        className={[base, variants[variant], sizes[size], className]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
    );
  },
);
