import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import type { Size, Tone } from '../../primitives/types';

export type TextSize = Extract<Size, 'sm' | 'md'> | 'xs' | 'lg';
export type TextTone =
  | Extract<Tone, 'good' | 'warn' | 'crit'>
  | 'default'
  | 'muted'
  | 'faint';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'label' | 'code';
  variant?: 'body' | 'caption' | 'meta' | 'code' | 'label';
  size?: TextSize;
  tone?: TextTone;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  font?: 'sans' | 'mono' | 'display';
  truncate?: boolean;
  className?: string;
  children: ReactNode;
}

const fontClasses = {
  sans: 'font-sans',
  mono: 'font-mono',
  display: 'font-display',
} as const;

const variantClasses = {
  body: 'text-body',
  caption: 'text-caption',
  meta: 'text-control text-ink-2',
  code: 'font-mono text-control bg-surface-2 px-s1 rounded-tag',
  label: 'text-label font-medium',
} as const;

const sizeClasses = {
  xs: 'text-badge',
  sm: 'text-caption',
  md: 'text-body',
  lg: 'text-title',
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
  font,
  truncate = false,
  className,
  children,
  ...rest
}: TextProps) {
  const Tag = as as ElementType;

  return (
    <Tag
      className={cx(
        font && fontClasses[font],
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
