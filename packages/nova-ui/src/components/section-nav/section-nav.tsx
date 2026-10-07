import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { VisuallyHidden } from '../../primitives/visually-hidden';

interface SectionNavItemBase {
  id: string;
  label: ReactNode;
  // Decorative: the label names the item, so the icon is hidden from assistive technology.
  icon?: ReactNode;
  active?: boolean;
  // With an href the item is a link; without one it is a button.
  href?: string;
  disabled?: boolean;
}

// A badge always says what it counts. Without that a screen reader hears a bare "12".
export type SectionNavItem = SectionNavItemBase &
  (
    | { badge?: undefined; badgeLabel?: undefined }
    | {
        badge: ReactNode;
        // What the badge counts, read out after it: badge 12 + badgeLabel "pending" is "12 pending".
        badgeLabel: string;
      }
  );

export interface SectionNavProps
  extends Omit<
    HTMLAttributes<HTMLElement>,
    'onSelect' | 'children' | 'aria-label'
  > {
  items: SectionNavItem[];
  onSelect?: (id: string) => void;
  // Names the navigation landmark ("Ward sections"). Required: a page can hold several navs.
  ariaLabel: string;
}

// The prototype's .sec-item, built for the dark chrome: 13.5px at 500 (text-input), the nav row's
// 8px by 10px and 10px between a bare 18px glyph (size-nav-glyph) and the label (its 9px radius is
// off the --r-* scale, so the control corner). Secondary text
// comes from the custom property the chrome sets; hover lifts the row with a faint white.
const itemBase =
  'relative flex w-full items-center gap-nav-item rounded-control px-nav-item py-nav-item text-left text-input font-medium transition-colors';

const itemIdle =
  'text-(color:--nova-chrome-ink-2) hover:bg-chrome-ink/5 hover:text-on-primary';

// Active is semibold on the accent tint and gets the prototype's rail on its left edge (2.5px by
// 17px of chrome accent, the nav-mark tokens, 6px outside the row), so it is not marked by colour
// alone.
const itemActive =
  'bg-chrome-accent/14 font-semibold text-on-primary [&_[data-icon]]:text-chrome-accent ' +
  'before:absolute before:top-1/2 before:-left-s2 before:h-nav-mark before:w-nav-mark ' +
  'before:-translate-y-1/2 before:rounded-full before:bg-chrome-accent';

const itemDisabled = 'cursor-not-allowed opacity-50';

function ItemContent({ item }: { item: SectionNavItem }) {
  const hasBadge =
    item.badge !== undefined && item.badge !== null && item.badge !== false;
  return (
    <>
      {item.icon ? (
        <span
          aria-hidden="true"
          data-icon=""
          className="grid size-nav-glyph shrink-0 place-items-center [&>svg]:size-nav-glyph-icon"
        >
          {item.icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {hasBadge ? (
        <>
          {' '}
          <span className="shrink-0 rounded-full bg-chrome-ink/15 px-badge py-badge text-badge font-bold text-chrome-ink">
            {item.badge}
            {/* The space is its own text node: name computation trims the text inside a span. */}{' '}
            <VisuallyHidden>{item.badgeLabel}</VisuallyHidden>
          </span>
        </>
      ) : null}
    </>
  );
}

export function SectionNav({
  items,
  onSelect,
  ariaLabel,
  className,
  ...rest
}: SectionNavProps) {
  return (
    <nav {...rest} aria-label={ariaLabel} className={className}>
      <ul className="flex flex-col gap-px px-s2">
        {items.map((item) => {
          const disabled = item.disabled === true;
          const current = item.active && !disabled ? 'page' : undefined;
          const classes = cx(
            itemBase,
            focusRing,
            current ? itemActive : itemIdle,
            disabled && itemDisabled,
          );

          let control: ReactNode;
          if (item.href !== undefined && !disabled) {
            control = (
              <a
                href={item.href}
                aria-current={current}
                className={classes}
                onClick={() => onSelect?.(item.id)}
              >
                <ItemContent item={item} />
              </a>
            );
          } else if (item.href !== undefined) {
            // A link that cannot be followed: no href, so it is neither focusable nor navigable,
            // but still announced as a link, and as disabled.
            control = (
              <span role="link" aria-disabled="true" className={classes}>
                <ItemContent item={item} />
              </span>
            );
          } else {
            control = (
              <button
                type="button"
                disabled={disabled}
                aria-current={current}
                className={classes}
                onClick={() => onSelect?.(item.id)}
              >
                <ItemContent item={item} />
              </button>
            );
          }
          return <li key={item.id}>{control}</li>;
        })}
      </ul>
    </nav>
  );
}
