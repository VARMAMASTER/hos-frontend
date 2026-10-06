import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { VisuallyHidden } from '../../primitives/visually-hidden';

export type IconTileTone = 'chrome' | 'ai';
export type IconTileSize = 'sm' | 'md';

export interface IconTileProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  // An svg glyph, or one or two letters as a monogram.
  children: ReactNode;
  tone?: IconTileTone;
  size?: IconTileSize;
  // Only for the rare tile that stands alone with no text beside it: the label is read out as
  // visually hidden text and the glyph or monogram is hidden, so nothing is announced twice. Beside
  // a text label leave it off and the whole tile stays hidden from assistive technology, so the icon
  // is not announced as noise.
  label?: string;
}

const base =
  'inline-grid shrink-0 place-items-center rounded-sm border font-semibold tracking-tight';

// The chrome tone is a faint brand-tinted tile (a translucent primary, never a translucent white,
// so white text keeps its contrast on the chrome for every brand). Its glyph takes the chrome's
// secondary ink from the custom property `nova-chrome` sets.
const tones: Record<IconTileTone, string> = {
  chrome:
    'border-primary-soft/25 bg-primary/25 text-(color:--nova-chrome-ink-2)',
  ai: 'border-ai/30 bg-ai-soft text-ai-deep',
};

const sizes: Record<IconTileSize, string> = {
  sm: 'size-6 text-micro [&_svg]:size-4',
  md: 'size-8 text-caption [&_svg]:size-5',
};

export function IconTile({
  tone = 'chrome',
  size = 'sm',
  label,
  className,
  children,
  'aria-hidden': ariaHidden,
  ...rest
}: IconTileProps) {
  const exposed = label !== undefined;
  // Hidden unless it has a label or the caller explicitly says aria-hidden={false}.
  const hidden = !exposed && ariaHidden !== false && ariaHidden !== 'false';
  return (
    <span
      {...rest}
      aria-hidden={hidden ? true : undefined}
      data-tone={tone}
      data-size={size}
      className={cx(base, tones[tone], sizes[size], className)}
    >
      {exposed ? (
        <>
          <span aria-hidden="true" className="grid place-items-center">
            {children}
          </span>
          <VisuallyHidden>{label}</VisuallyHidden>
        </>
      ) : (
        children
      )}
    </span>
  );
}
