import {
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
  type SVGProps,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { menuItem } from '../../primitives/menu-item';
import { Button } from '../button/button';
import type { Density, SortDirection } from './types';

// The small pieces a DataTable is built from. Internal: the package barrel exports DataTable only.

// One icon style for the table's controls: 20px grid, round caps, drawn with currentColor and never
// the only carrier of meaning (a label or an aria attribute always says the same).
function Icon({ children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function SearchIcon() {
  return (
    <Icon>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5L17 17" />
    </Icon>
  );
}

export function ColumnsIcon() {
  return (
    <Icon className="size-icon-md">
      <rect x="3" y="4" width="14" height="12" rx="2" />
      <path d="M8 4v12M13 4v12" />
    </Icon>
  );
}

export function MoreIcon() {
  return (
    <Icon className="size-icon-md" fill="currentColor" stroke="none">
      <circle cx="4.5" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="15.5" cy="10" r="1.5" />
    </Icon>
  );
}

// The sort indicator is an arrow, and each state has its own shape: up for ascending, down for
// descending, a faint pair of chevrons for sortable-but-idle. An active arrow is in the deep highlight
// ink (4.5:1 on the header), the sorted column's marker.
export function SortIcon({ direction }: { direction: SortDirection | null }) {
  if (direction === 'asc') {
    return (
      <Icon
        data-sort="asc"
        className="size-icon-sm shrink-0 text-highlight-deep"
      >
        <path d="M10 16V4M5 9l5-5 5 5" />
      </Icon>
    );
  }
  if (direction === 'desc') {
    return (
      <Icon
        data-sort="desc"
        className="size-icon-sm shrink-0 text-highlight-deep"
      >
        <path d="M10 4v12M5 11l5 5 5-5" />
      </Icon>
    );
  }
  return (
    <Icon data-sort="none" className="size-icon-sm shrink-0 opacity-60">
      <path d="M6 8l4-4 4 4M6 12l4 4 4-4" />
    </Icon>
  );
}

// The header button of a sortable column. It is a real button, so Enter and Space sort it and Tab
// reaches it; the sort state itself is on the th (aria-sort), where assistive technology looks.
// A button does not inherit text-transform, so the header's capitals are set here.
export function SortButton({
  direction,
  onClick,
  children,
}: {
  direction: SortDirection | null;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'relative -mx-s1 inline-flex items-center gap-s2 rounded-control px-s1 uppercase transition-colors hover:text-ink',
        direction ? 'text-ink' : 'text-ink-2',
        focusRing,
      )}
    >
      <span>{children}</span>
      <SortIcon direction={direction} />
      {/* The sorted column's marker: a highlight underline. aria-sort on the th and the arrow's
          shape carry the state. */}
      {direction ? (
        <span
          aria-hidden="true"
          data-slot="sort-marker"
          className="nova-highlight-grad pointer-events-none absolute inset-x-s1 -bottom-s0 h-s0 rounded-full"
        />
      ) : null}
    </button>
  );
}

// A table-row checkbox: a native input, so Space and the platform's own behaviour come for free.
// Nova's Checkbox is a 44px form control with a visible label and no mixed state, which a dense row
// cannot spend; this is the same box and tick drawn small, with the indeterminate dash the header
// needs, and a label that reaches the whole cell for a bigger target. The label text is for
// assistive technology only.
export function SelectBox({
  checked,
  indeterminate = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  // `indeterminate` is a DOM property only, with no attribute to render.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className="relative -m-s3 flex cursor-pointer items-center justify-center p-s3">
      <span className="relative flex size-check">
        <input
          ref={ref}
          type="checkbox"
          aria-label={label}
          checked={checked}
          onChange={onChange}
          className={cx(
            'nova-field peer size-check cursor-pointer appearance-none rounded-control',
            'checked:bg-primary indeterminate:bg-primary indeterminate:[--nova-field-edge:var(--nova-color-primary)]',
            focusRing,
          )}
        />
        {/* A tick for checked and a dash for some: the state is a shape, never colour alone. */}
        <Icon
          strokeWidth="2.25"
          className="pointer-events-none absolute inset-0 m-auto size-icon-sm text-on-primary opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-0"
        >
          <path d="M4.5 10.5l3.5 3.5 7.5-8" />
        </Icon>
        <Icon
          strokeWidth="2.25"
          className="pointer-events-none absolute inset-0 m-auto size-icon-sm text-on-primary opacity-0 peer-indeterminate:opacity-100"
        >
          <path d="M5 10h10" />
        </Icon>
      </span>
    </label>
  );
}

// A checkable item for the Columns menu. Menu's own items are action and radio items; a column is a
// checkbox, so this is a menuitemcheckbox, which Menu's keyboard handling already covers. Pressing it
// keeps the menu open, so several columns can be set in one visit.
export function ColumnToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={-1}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        onToggle();
      }}
      className={menuItem}
    >
      <span
        aria-hidden="true"
        className={cx(
          'flex size-icon-md shrink-0 items-center justify-center rounded-control border text-on-primary',
          checked ? 'border-primary bg-primary' : 'border-border-control',
        )}
      >
        {checked ? (
          <Icon strokeWidth="2.5" className="size-icon-xs">
            <path d="M4.5 10.5l3.5 3.5 7.5-8" />
          </Icon>
        ) : null}
      </span>
      {label}
    </button>
  );
}

// Comfortable or compact: a two-button group where the pressed one is announced (aria-pressed) and
// drawn filled.
export function DensityToggle({
  density,
  onChange,
}: {
  density: Density;
  onChange: (density: Density) => void;
}) {
  const options: Density[] = ['comfortable', 'compact'];
  return (
    <div role="group" aria-label="Row density" className="inline-flex gap-s1">
      {options.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={option === density ? 'primary' : 'ghost'}
          aria-pressed={option === density}
          onClick={() => onChange(option)}
        >
          {option === 'comfortable' ? 'Comfortable' : 'Compact'}
        </Button>
      ))}
    </div>
  );
}

// Bar widths vary by column so the placeholder rows read as text, not as a grid of stripes.
const BAR_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-1/3'];

// One placeholder bar. It pulses only where motion is welcome: motion-safe, so under reduced motion
// it is a still bar.
export function SkeletonBar({ index }: { index: number }) {
  return (
    <div
      data-skeleton=""
      className={cx(
        'h-s5 rounded-control bg-border motion-safe:animate-pulse',
        BAR_WIDTHS[index % BAR_WIDTHS.length],
      )}
    />
  );
}
