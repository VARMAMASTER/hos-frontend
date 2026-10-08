import type { ReactNode } from 'react';
import { Grid } from '../grid/grid';
import { cx } from '../../primitives/cx';

export interface TabKPIStripProps {
  columns?: 2 | 3 | 4 | 6;
  className?: string;
  children: ReactNode;
}

export function TabKPIStrip({
  columns = 4,
  className,
  children,
}: TabKPIStripProps) {
  return (
    <Grid columns={columns} gap="s4" className={cx('min-w-0', className)}>
      {children}
    </Grid>
  );
}
