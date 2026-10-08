import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';

export interface BoxProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'header' | 'footer' | 'main';
  padding?: 'none' | 's1' | 's2' | 's3' | 's4' | 's6' | 's8';
  paddingX?: 'none' | 's1' | 's2' | 's3' | 's4' | 's6' | 's8';
  paddingY?: 'none' | 's1' | 's2' | 's3' | 's4' | 's6' | 's8';
  margin?: 'none' | 's1' | 's2' | 's3' | 's4' | 's6' | 's8';
  surface?: 'base' | 'elevated' | 'inset' | 'sunken' | 'transparent';
  border?: boolean | 'top' | 'bottom' | 'left' | 'right';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  children?: ReactNode;
}

const paddingClasses = {
  none: '',
  s1: 'p-s1',
  s2: 'p-s2',
  s3: 'p-s3',
  s4: 'p-s4',
  s6: 'p-s6',
  s8: 'p-s8',
} as const;

const paddingXClasses = {
  none: '',
  s1: 'px-s1',
  s2: 'px-s2',
  s3: 'px-s3',
  s4: 'px-s4',
  s6: 'px-s6',
  s8: 'px-s8',
} as const;

const paddingYClasses = {
  none: '',
  s1: 'py-s1',
  s2: 'py-s2',
  s3: 'py-s3',
  s4: 'py-s4',
  s6: 'py-s6',
  s8: 'py-s8',
} as const;

const marginClasses = {
  none: '',
  s1: 'm-s1',
  s2: 'm-s2',
  s3: 'm-s3',
  s4: 'm-s4',
  s6: 'm-s6',
  s8: 'm-s8',
} as const;

const surfaceClasses = {
  base: 'bg-surface text-ink',
  elevated: 'bg-surface shadow-sm text-ink',
  inset: 'bg-surface-inset text-ink',
  sunken: 'bg-surface-sunken text-ink',
  transparent: '',
} as const;

const borderClasses = {
  true: 'border border-border',
  top: 'border-t border-border',
  bottom: 'border-b border-border',
  left: 'border-l border-border',
  right: 'border-r border-border',
} as const;

const radiusClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

export function Box({
  as = 'div',
  padding,
  paddingX,
  paddingY,
  margin,
  surface = 'transparent',
  border,
  radius,
  className,
  children,
  ...rest
}: BoxProps) {
  const Tag = as as ElementType;

  return (
    <Tag
      className={cx(
        padding && paddingClasses[padding],
        paddingX && paddingXClasses[paddingX],
        paddingY && paddingYClasses[paddingY],
        margin && marginClasses[margin],
        surfaceClasses[surface],
        border === true && borderClasses['true'],
        typeof border === 'string' && borderClasses[border],
        radius && radiusClasses[radius],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
