import type { ReactNode } from 'react';
import { Box } from '../box/box';
import { cx } from '../../primitives/cx';

export interface TabContentProps {
  padding?: 'none' | 's1' | 's2' | 's3' | 's4' | 's6' | 's8';
  className?: string;
  children?: ReactNode;
}

export function TabContent({
  padding = 'none',
  className,
  children,
}: TabContentProps) {
  return (
    <Box padding={padding} className={cx('min-w-0 flex-1', className)}>
      {children}
    </Box>
  );
}
