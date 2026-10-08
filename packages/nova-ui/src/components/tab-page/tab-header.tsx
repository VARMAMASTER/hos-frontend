import type { ReactNode } from 'react';
import { Stack } from '../stack/stack';
import { Heading } from '../heading/heading';
import { Text } from '../text/text';
import { cx } from '../../primitives/cx';

export interface TabHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
}

export function TabHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className,
}: TabHeaderProps) {
  return (
    <Stack
      direction="horizontal"
      justify="between"
      align="start"
      wrap
      gap="s4"
      className={cx('min-w-0 border-b border-border pb-s4', className)}
    >
      <Stack gap="s1" className="min-w-0">
        {breadcrumbs ? <div className="mb-s1">{breadcrumbs}</div> : null}
        <Stack direction="horizontal" align="center" gap="s3">
          <Heading level="h2" weight="semibold">
            {title}
          </Heading>
          {badge}
        </Stack>
        {description ? (
          <Text tone="muted" size="sm">
            {description}
          </Text>
        ) : null}
      </Stack>
      {actions ? (
        <Stack direction="horizontal" align="center" gap="s2" className="ml-auto shrink-0">
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
