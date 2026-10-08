import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'label' | 'code';
  variant?: 'body' | 'caption' | 'meta' | 'code' | 'label';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'default' | 'muted' | 'faint' | 'good' | 'warn' | 'crit';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  className?: string;
  children: ReactNode;
}

const variantClasses = {
  body: 'text-body',
  caption: 'text-caption',
  meta: 'text-control text-ink-2',
  code: 'font-mono text-control bg-surface-inset px-s1 rounded',
  label: 'text-label font-medium',
} as const;

const sizeClasses = {
  xs: 'text-badge',
  sm: 'text-caption',
  md: 'text-body',
  lg: 'text-subhead',
} as const;

const toneClasses = {
  default: 'text-ink',
  muted: 'text-ink-2',
  faint: 'text-ink-3',
  good: 'text-good',
  warn: 'text-warn',
  crit: 'text-crit',
} as const;

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

export function Text({
  as = 'p',
  variant = 'body',
  size,
  tone = 'default',
  weight,
  align = 'left',
  truncate = false,
  className,
  children,
  ...rest
}: TextProps) {
  const Tag = as as ElementType;

  return (
    <Tag
      className={cx(
        variantClasses[variant],
        size && sizeClasses[size],
        toneClasses[tone],
        weight && weightClasses[weight],
        alignClasses[align],
        truncate && 'truncate',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
