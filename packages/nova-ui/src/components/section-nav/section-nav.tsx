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

// The prototype's .sec-item, built for the dark chrome: 13.5px at 500, 8px by 10px, 10px between a
// bare 18px glyph and the label (its 9px radius is off the --r-* scale, so sm). Secondary text
// comes from the custom property the chrome sets; hover lifts the row with a faint white.
const itemBase =
  'relative flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors';

const itemIdle =
  'text-(color:--nova-chrome-ink-2) hover:bg-chrome-ink/5 hover:text-on-primary';

// Active is semibold on the accent tint and gets the prototype's rail on its left edge (2.5px by
// 17px of chrome accent, 6px outside the row), so it is not marked by colour alone.
const itemActive =
  'bg-chrome-accent/14 font-semibold text-on-primary [&_[data-icon]]:text-chrome-accent ' +
  'before:absolute before:top-1/2 before:-left-1.5 before:h-[17px] before:w-[2.5px] ' +
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
          className="grid size-[18px] shrink-0 place-items-center [&>svg]:size-[17px]"
        >
          {item.icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {hasBadge ? (
        <>
          {' '}
          <span className="shrink-0 rounded-full bg-chrome-ink/15 px-1.5 py-px text-[10px] font-bold text-chrome-ink">
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
      <ul className="flex flex-col gap-px px-1.5">
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
