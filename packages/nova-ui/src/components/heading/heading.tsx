import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'display' | 'title' | 'headline' | 'subhead' | 'caption';
  tone?: 'default' | 'muted' | 'accent' | 'good' | 'warn' | 'crit';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  className?: string;
  children: ReactNode;
}

const levelDefaults = {
  h1: 'text-display font-bold tracking-tight',
  h2: 'text-title font-semibold tracking-tight',
  h3: 'text-headline font-semibold',
  h4: 'text-subhead font-medium',
  h5: 'text-body font-medium',
  h6: 'text-body font-medium',
} as const;

const sizeClasses = {
  display: 'text-display',
  title: 'text-title',
  headline: 'text-headline',
  subhead: 'text-subhead',
  caption: 'text-caption',
} as const;

const toneClasses = {
  default: 'text-ink',
  muted: 'text-ink-2',
  accent: 'text-chrome-accent',
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

export function Heading({
  level = 'h2',
  size,
  tone = 'default',
  weight,
  align = 'left',
  truncate = false,
  className,
  children,
  ...rest
}: HeadingProps) {
  const Tag = level as ElementType;

  return (
    <Tag
      className={cx(
        'min-w-0',
        levelDefaults[level],
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
