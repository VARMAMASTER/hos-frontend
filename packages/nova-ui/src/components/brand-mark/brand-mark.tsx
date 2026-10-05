import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';

export interface BrandMarkProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  // The product name. It is the lockup's accessible name.
  name: string;
  // A secondary line under the name ("Hospital OS"). Described, not folded into the name.
  sub?: string;
  // Replaces the initials tile. It is decorative: the name is right beside it as text.
  logo?: ReactNode;
  // With an href the lockup is a link to it; without one it is a heading.
  href?: string;
  // The heading level when there is no href. The default fits a sidebar under an h1 page title.
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

// Whole graphemes, not UTF-16 units, so a letter keeps its accent or vowel sign.
function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    });
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

// "Sri Venkateshwara Hospital" -> "SV"; "Apollo" -> "AP".
function initialsOf(name: string): string {
  const [first = '', second] = name.trim().split(/\s+/);
  const letters =
    second === undefined
      ? graphemes(first).slice(0, 2)
      : [graphemes(first)[0] ?? '', graphemes(second)[0] ?? ''];
  return letters.join('').toUpperCase();
}

const row = 'flex min-w-0 items-center gap-3';
const markBox = 'grid size-9 shrink-0 place-items-center rounded-md';
const nameClass =
  'block truncate text-base font-bold leading-tight text-on-primary';
const subClass =
  'block truncate text-xs leading-snug text-(color:--nova-chrome-ink-2)';

export function BrandMark({
  name,
  sub,
  logo,
  href,
  headingLevel = 2,
  className,
  ...rest
}: BrandMarkProps) {
  const nameId = useId();
  const subId = useId();

  const mark =
    logo === undefined ? (
      <span
        aria-hidden="true"
        className={`${markBox} bg-primary text-sm font-bold tracking-tight text-on-primary`}
      >
        {initialsOf(name)}
      </span>
    ) : (
      <span
        aria-hidden="true"
        className={`${markBox} overflow-hidden [&>img]:size-full [&>svg]:size-full`}
      >
        {logo}
      </span>
    );

  if (href !== undefined) {
    return (
      <a
        {...rest}
        href={href}
        aria-labelledby={nameId}
        aria-describedby={sub ? subId : undefined}
        className={cx(row, 'rounded-md', focusRing, className)}
      >
        {mark}
        <span className="min-w-0">
          <span id={nameId} className={nameClass}>
            {name}
          </span>
          {sub ? (
            <span id={subId} className={subClass}>
              {sub}
            </span>
          ) : null}
        </span>
      </a>
    );
  }

  const Heading = `h${headingLevel}` as const;
  return (
    <div {...rest} className={cx(row, className)}>
      {mark}
      <div className="min-w-0">
        <Heading className={nameClass}>{name}</Heading>
        {sub ? <p className={subClass}>{sub}</p> : null}
      </div>
    </div>
  );
}
