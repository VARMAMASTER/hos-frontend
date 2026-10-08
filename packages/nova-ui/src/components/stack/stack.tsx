import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';

export interface StackProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'ul' | 'ol';
  direction?: 'vertical' | 'horizontal';
  gap?: 'none' | 's1' | 's2' | 's3' | 's4' | 's6' | 's8';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  className?: string;
  children?: ReactNode;
}

const directionClasses = {
  vertical: 'flex flex-col',
  horizontal: 'flex flex-row',
} as const;

const gapClasses = {
  none: 'gap-0',
  s1: 'gap-s1',
  s2: 'gap-s2',
  s3: 'gap-s3',
  s4: 'gap-s4',
  s6: 'gap-s6',
  s8: 'gap-s8',
} as const;

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
} as const;

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
} as const;

export function Stack({
  as = 'div',
  direction = 'vertical',
  gap = 's4',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  children,
  ...rest
}: StackProps) {
  const Tag = as as ElementType;

  return (
    <Tag
      className={cx(
        directionClasses[direction],
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
