import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';

export type SplitRatio = '1-1' | '2-1' | '3-2';

export interface SplitLayoutProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  primary: ReactNode;
  secondary: ReactNode;
  // Primary to secondary width at md and up. Below md the two stack in one column.
  ratio?: SplitRatio;
  // Puts the secondary region first, in reading order on every screen size, not just visually.
  secondaryFirst?: boolean;
}

// Each entry is [primary first, secondary first]. Written out in full so Tailwind can see the class
// names. With the order swapped the template flips too, so the wider track stays on the primary.
const columns: Record<SplitRatio, readonly [string, string]> = {
  '1-1': ['md:grid-cols-2', 'md:grid-cols-2'],
  '2-1': ['md:grid-cols-[2fr_1fr]', 'md:grid-cols-[1fr_2fr]'],
  '3-2': ['md:grid-cols-[3fr_2fr]', 'md:grid-cols-[2fr_3fr]'],
};

export function SplitLayout({
  primary,
  secondary,
  ratio = '1-1',
  secondaryFirst = false,
  className,
  ...rest
}: SplitLayoutProps) {
  const primaryRegion = (
    <div key="primary" data-region="primary" className="min-w-0">
      {primary}
    </div>
  );
  const secondaryRegion = (
    <div key="secondary" data-region="secondary" className="min-w-0">
      {secondary}
    </div>
  );
  return (
    <div
      {...rest}
      className={cx(
        'grid grid-cols-1 gap-5',
        columns[ratio][secondaryFirst ? 1 : 0],
        className,
      )}
    >
      {secondaryFirst
        ? [secondaryRegion, primaryRegion]
        : [primaryRegion, secondaryRegion]}
    </div>
  );
}
