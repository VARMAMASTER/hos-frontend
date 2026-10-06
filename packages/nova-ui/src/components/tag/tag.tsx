import type { HTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { HighlightMark } from '../chip/highlight-mark';

export type TagVariant = 'solid' | 'outline';
export type TagTone = 'neutral' | 'primary' | 'ai' | 'highlight';

// A Tag labels or categorises ("Offline", "Beta"). It carries no status: a Chip does that.
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  tone?: TagTone;
}

// The prototype's .tag-offline: IBM Plex Mono at 10.5px, padded 2px by 8px (its 6px radius is off the
// --r-* scale, so sm).
const base =
  'inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 ' +
  'font-mono text-[10.5px] font-semibold';

// Every pairing below puts the text token on the fill (or on the surface behind an outline) that
// the theme engine already gates at 4.5:1, so a tag stays legible in every hospital theme.
const styles: Record<TagVariant, Record<TagTone, string>> = {
  solid: {
    neutral: 'bg-chrome-1 text-chrome-ink',
    primary: 'bg-primary text-on-primary',
    ai: 'bg-ai text-on-primary',
    // The highlight never carries white text (it is a mark), so its "solid" tag is the wash.
    highlight: 'nova-highlight-wash gap-1 text-highlight-deep',
  },
  outline: {
    neutral: 'border border-border-strong text-ink-2',
    primary: 'border border-primary text-primary-strong',
    ai: 'border border-ai text-ai-deep',
    highlight: 'gap-1 border border-highlight text-highlight-deep',
  },
};

// A highlight tag leads with the star marker, so it is never told apart by colour alone.
export function Tag({
  variant = 'solid',
  tone = 'neutral',
  className,
  children,
  ...rest
}: TagProps) {
  return (
    <span
      data-variant={variant}
      data-tone={tone}
      className={cx(base, styles[variant][tone], className)}
      {...rest}
    >
      {tone === 'highlight' ? <HighlightMark className="size-2.5" /> : null}
      {children}
    </span>
  );
}
