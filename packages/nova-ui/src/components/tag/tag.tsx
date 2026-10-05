import type { HTMLAttributes } from 'react';

export type TagVariant = 'solid' | 'outline';
export type TagTone = 'neutral' | 'primary' | 'ai';

// A Tag labels or categorises ("Offline", "Beta"). It carries no status: a Chip does that.
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  tone?: TagTone;
}

const base =
  'inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 ' +
  'font-mono text-[11px] leading-4 font-medium';

// Every pairing below puts the text token on the fill (or on the surface behind an outline) that
// the theme engine already gates at 4.5:1, so a tag stays legible in every hospital theme.
const styles: Record<TagVariant, Record<TagTone, string>> = {
  solid: {
    neutral: 'border-transparent bg-ink-2 text-surface',
    primary: 'border-transparent bg-primary text-on-primary',
    ai: 'border-transparent bg-ai text-on-primary',
  },
  outline: {
    neutral: 'border-border-strong text-ink-2',
    primary: 'border-primary text-primary-strong',
    ai: 'border-ai text-ai-deep',
  },
};

export function Tag({
  variant = 'solid',
  tone = 'neutral',
  className,
  ...rest
}: TagProps) {
  return (
    <span
      data-variant={variant}
      data-tone={tone}
      className={[base, styles[variant][tone], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}
