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

// Built for the dark chrome: secondary text from the custom property nova-chrome sets, full text in
// on-primary (white). Hover and active tint with the translucent brand colour, never with white,
// so white text keeps its contrast on the chrome for every brand.
const itemBase =
  'relative flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm font-medium';

// The standard focus ring is the brand colour, which is too dim on the dark chrome, so its colour
// (only) is swapped for the light tint. Same ring, one declaration of it.
const chromeFocusRing = cx(focusRing, 'outline-primary-soft!');

const itemIdle =
  'text-(color:--nova-chrome-ink-2) hover:bg-primary/20 hover:text-on-primary';

// Active is bold and gets a rail on its left edge as well as a tint, so it is not marked by colour.
const itemActive =
  'bg-primary/30 font-semibold text-on-primary ' +
  'before:absolute before:top-1/2 before:left-0.5 before:h-4 before:w-[3px] ' +
  'before:-translate-y-1/2 before:rounded-full before:bg-primary-soft';

const itemDisabled = 'cursor-not-allowed opacity-50';

function ItemContent({ item }: { item: SectionNavItem }) {
  const hasBadge =
    item.badge !== undefined && item.badge !== null && item.badge !== false;
  return (
    <>
      {item.icon ? (
        <span
          aria-hidden="true"
          className="grid size-[18px] shrink-0 place-items-center [&>svg]:size-[17px]"
        >
          {item.icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {hasBadge ? (
        <>
          {' '}
          <span className="shrink-0 rounded-full bg-primary/40 px-1.5 py-px text-[10px] font-bold text-on-primary">
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
      <ul className="flex flex-col gap-px">
        {items.map((item) => {
          const disabled = item.disabled === true;
          const current = item.active && !disabled ? 'page' : undefined;
          const classes = cx(
            itemBase,
            chromeFocusRing,
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
