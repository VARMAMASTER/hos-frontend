import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import type { Size, Tone } from '../../primitives/types';
import { VisuallyHidden } from '../../primitives/visually-hidden';

// chrome is not a status Tone: the dark chrome's tile (the prototype's .ic); ai is the shared tone.
export type IconTileTone = 'chrome' | Extract<Tone, 'ai'>;
export type IconTileSize = Size;

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

// The prototype's .ic: a 24px tile (its 7px radius is off the --r-* scale, so sm), a 10px bold
// monogram in the display face, a 15px glyph.
const base =
  'inline-grid shrink-0 place-items-center rounded-control border font-display font-bold tracking-initials';

// chrome is .ic on the dark chrome: a faint white lift and rim. Its glyph is the full chrome ink: the
// prototype's --chrome-ink-2 falls below 4.5:1 over the lift on the sidebar's lightest point. ai is
// .ic-ai.
const tones: Record<IconTileTone, string> = {
  chrome: 'border-chrome-ink/15 bg-chrome-ink/5 text-chrome-ink',
  ai: 'border-ai-line bg-ai-soft text-ai-deep',
};

const sizes: Record<IconTileSize, string> = {
  sm: 'size-tile text-badge [&_svg]:size-icon-tile',
  md: 'size-s9 text-label [&_svg]:size-icon-lg',
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
