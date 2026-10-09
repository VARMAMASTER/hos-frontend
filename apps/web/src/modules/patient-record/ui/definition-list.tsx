import type { ReactNode } from 'react';
import { Box, cx } from '@hos/nova-ui';

export interface DefinitionItem {
  id: string;
  term: string;
  description: ReactNode;
  // Spans the whole row (an address, an emergency contact).
  wide?: boolean;
}

export interface DefinitionListProps {
  items: DefinitionItem[];
  // "tiles" sets each pair in its own inset tile, for a row of readings.
  variant?: 'plain' | 'tiles';
  className?: string;
}

// Label and value pairs as a real description list (the prototype's .dl-grid and .vit-row), so the
// pairing is announced, not just laid out.
export function DefinitionList({
  items,
  variant = 'plain',
  className,
}: DefinitionListProps) {
  const tiles = variant === 'tiles';
  return (
    <dl
      className={cx(
        'grid gap-s4',
        tiles ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2',
        className,
      )}
    >
      {items.map((item) => (
        <Box
          key={item.id}
          surface={tiles ? 'inset' : 'transparent'}
          radius={tiles ? 'card' : undefined}
          padding={tiles ? 's3' : undefined}
          className={cx('min-w-0', item.wide && 'sm:col-span-2')}
        >
          <dt className="text-meta font-semibold uppercase tracking-caps text-ink-3">
            {item.term}
          </dt>
          <dd
            className={cx(
              'mt-s0 text-ink tabular-nums',
              tiles ? 'text-title font-semibold' : 'text-control font-medium',
            )}
          >
            {item.description}
          </dd>
        </Box>
      ))}
    </dl>
  );
}
