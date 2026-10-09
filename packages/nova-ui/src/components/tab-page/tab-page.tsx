import type { ReactNode } from 'react';
import { Box } from '../box/box';
import { Stack } from '../stack/stack';
import { Banner } from '../banner/banner';
import { cx } from '../../primitives/cx';

export interface TabPageProps {
  patientId?: string;
  compactMode?: boolean;
  loading?: boolean;
  error?: Error | string | null;
  className?: string;
  children: ReactNode;
}

export function TabPage({
  patientId,
  compactMode = false,
  loading = false,
  error = null,
  className,
  children,
}: TabPageProps) {
  if (loading) {
    return (
      <Box
        surface="base"
        padding={compactMode ? 's3' : 's6'}
        className={cx('min-h-full flex-1', className)}
        data-patient-id={patientId}
        data-compact={compactMode ? 'true' : undefined}
        role="status"
        aria-live="polite"
        aria-busy={loading ? 'true' : undefined}
      >
        {/* Two placeholder blocks on the canvas colour, a step below the page's panel. */}
        <Stack gap="s6">
          <Box
            surface="sunken"
            padding="s6"
            radius="card"
            className="motion-safe:animate-pulse"
          />
          <Box
            surface="sunken"
            padding="s8"
            radius="card"
            className="motion-safe:animate-pulse"
          />
        </Stack>
      </Box>
    );
  }

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Box
      surface="base"
      padding={compactMode ? 's3' : 's6'}
      className={cx('min-h-full flex-1', className)}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
    >
      <Stack gap="s6">
        {errorMessage ? (
          <Banner tone="warn" title="Operation Alert">
            {errorMessage}
          </Banner>
        ) : null}
        {children}
      </Stack>
    </Box>
  );
}
