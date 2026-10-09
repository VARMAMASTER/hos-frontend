import type { HTMLAttributes, ReactNode, SVGProps } from 'react';
import { cx } from './cx';
import type { ExtendedSize } from './types';

// The Care spark: the one AI mark of Nova and of every app built on it (owner decision, 2026-10-10).
// A four-point spark with a small medical cross cut out of its heart (the evenodd hole), and one small
// twinkle at the lower right. At 12px the cross drops away and it reads as an AI spark; from about
// 22px up the care cross shows. viewBox 0 0 24 24, filled with currentColor.
export const CARE_SPARK_PATHS = [
  {
    fillRule: 'evenodd',
    d: 'M11 0.8Q12.9 9.1 21.2 11Q12.9 12.9 11 21.2Q9.1 12.9 0.8 11Q9.1 9.1 11 0.8ZM10.15 8.4h1.7v1.75h1.75v1.7h-1.75v1.75h-1.7v-1.75H8.4v-1.7h1.75Z',
  },
  {
    fillRule: undefined,
    d: 'M19.4 14.6q.55 2.85 3.4 3.4-2.85.55-3.4 3.4-.55-2.85-3.4-3.4 2.85-.55 3.4-3.4Z',
  },
] as const;

const sizes: Record<ExtendedSize, string> = {
  xs: 'size-icon-xs',
  sm: 'size-icon-sm',
  md: 'size-icon-md',
  lg: 'size-icon-lg',
};

export interface AiMarkProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  // The shared size vocabulary (xs 12px, sm 14px, md 16px, lg 20px). Bare marks only: the tile owns
  // the size of the glyph inside it.
  size?: ExtendedSize;
  // The same glyph, white, inside the AI tile (the prototype's .ai-spark): in the HOS AI gradient,
  // which follows the hospital's theme, and settling to green inside an approved AI block.
  tile?: boolean;
  // Tile only: a meaning of its own in place of the glyph (the approved check, the ₹ of a money
  // gate). Hidden from assistive technology like the glyph.
  symbol?: ReactNode;
}

// The AI mark is decoration (aria-hidden): every use sits beside a text label, so AI is never told
// by colour or by an icon alone. Bare, it takes the colour of its text; give the tile no label of its
// own, the words beside it are the label.
export function AiMark({
  size = 'sm',
  tile = false,
  symbol,
  className,
  ...rest
}: AiMarkProps) {
  const glyph = (
    <svg
      data-ai-mark=""
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cx(
        'inline-block shrink-0',
        !tile && sizes[size],
        !tile && className,
      )}
      {...(tile ? {} : (rest as SVGProps<SVGSVGElement>))}
    >
      {CARE_SPARK_PATHS.map(({ d, fillRule }) => (
        <path key={d} fillRule={fillRule} d={d} />
      ))}
    </svg>
  );
  if (!tile) return glyph;
  return (
    <span
      aria-hidden="true"
      className={cx('nova-ai-spark', className)}
      {...rest}
    >
      {symbol ?? glyph}
    </span>
  );
}
