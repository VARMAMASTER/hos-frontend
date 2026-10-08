import type { ReactNode } from 'react';
import { Stack } from '../stack/stack';
import { Box } from '../box/box';
import { cx } from '../../primitives/cx';

export interface TabToolbarProps {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function TabToolbar({
  search,
  filters,
  actions,
  className,
  children,
}: TabToolbarProps) {
  return (
    <Box surface="inset" padding="s3" radius="md" className={cx('min-w-0', className)}>
      <Stack direction="horizontal" justify="between" align="center" wrap gap="s3">
        <Stack direction="horizontal" align="center" wrap gap="s3" className="flex-1 min-w-0">
          {search ? <div className="w-full max-w-xs">{search}</div> : null}
          {filters}
          {children}
        </Stack>
        {actions ? (
          <Stack direction="horizontal" align="center" gap="s2" className="ml-auto shrink-0">
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
