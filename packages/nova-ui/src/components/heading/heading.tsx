import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import type { Tone } from '../../primitives/types';

export type HeadingTone =
  | Extract<Tone, 'good' | 'warn' | 'crit'>
  | 'default'
  | 'muted'
  | 'accent';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'display' | 'title' | 'headline' | 'subhead' | 'caption';
  tone?: HeadingTone;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  font?: 'display' | 'sans' | 'mono';
  truncate?: boolean;
  className?: string;
  children: ReactNode;
}

const fontClasses = {
  display: 'font-display',
  sans: 'font-sans',
  mono: 'font-mono',
} as const;

const levelDefaults = {
  h1: 'text-display font-bold tracking-h1',
  h2: 'text-title font-semibold tracking-h2',
  h3: 'text-headline font-semibold tracking-h3',
  h4: 'text-subtitle font-medium',
  h5: 'text-body font-medium',
  h6: 'text-control font-medium',
} as const;

const sizeClasses = {
  display: 'text-display',
  title: 'text-title',
  headline: 'text-headline',
  subhead: 'text-subtitle',
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
  font,
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
        font && fontClasses[font],
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
