import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';

export interface GridProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section';
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 's1' | 's2' | 's3' | 's4' | 's6' | 's8';
  className?: string;
  children?: ReactNode;
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  12: 'grid-cols-12',
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

export function Grid({
  as = 'div',
  columns = 1,
  gap = 's4',
  className,
  children,
  ...rest
}: GridProps) {
  const Tag = as as ElementType;

  return (
    <Tag
      className={cx('grid', columnClasses[columns], gapClasses[gap], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
