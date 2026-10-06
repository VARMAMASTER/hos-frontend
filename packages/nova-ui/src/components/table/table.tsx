import {
  createContext,
  useContext,
  useId,
  type HTMLAttributes,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Surface } from '../../primitives/surface';
import { VisuallyHidden } from '../../primitives/visually-hidden';

export type TableAlign = 'left' | 'center' | 'right';
export type TableDensity = 'comfortable' | 'compact';

// Cell padding follows the density, so a table sets it once. Comfortable is the prototype's
// (10px by 16px); compact trims the vertical padding to 6px.
const DensityContext = createContext<TableDensity>('comfortable');
const cellPadding: Record<TableDensity, string> = {
  comfortable: 'px-4 py-2.5',
  compact: 'px-4 py-1.5',
};

// Whether the head is pinned: its header cells read it, so each one carries its own sticky classes.
const StickyHeadContext = createContext(false);

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  // Names the table for assistive technology. Rendered as a real <caption>, visually hidden.
  caption: ReactNode;
  // Caps the height of the scroll area: the body scrolls under a sticky head (TableHead sticky) and
  // the table still scrolls sideways. A number is pixels.
  maxHeight?: string | number;
  density?: TableDensity;
}

// The frame is the data material: opaque under both materials, the card hairline with the prototype's
// gradient edge, radius md. The table inside is the prototype's: 13px, cells 10px by 16px.
// Glass behind a column of numbers costs legibility, so never swap it for a translucent surface.
// The hairline is the frame's border, so the frame itself must not scroll; the scroller sits inside it.
// className styles the frame (placement, spacing); every other attribute describes the <table>
// itself (id, aria-describedby, ...) and lands on it.
export function Table({
  caption,
  className,
  children,
  maxHeight,
  density = 'comfortable',
  ...rest
}: TableProps) {
  const captionId = useId();
  return (
    <Surface material="data" radius="md" className={className}>
      {/* A scroll container needs a tab stop, or keyboard users cannot scroll a wide table; naming
          it makes that stop announce as the table it scrolls. */}
      <div
        role="region"
        aria-labelledby={captionId}
        tabIndex={0}
        style={maxHeight === undefined ? undefined : { maxHeight }}
        className={cx(
          maxHeight === undefined ? 'overflow-x-auto' : 'overflow-auto',
          'nova-radius-inherit',
          focusRing,
        )}
      >
        <table
          className="w-full border-collapse text-left text-[13px] text-ink"
          {...rest}
        >
          <caption id={captionId}>
            <VisuallyHidden>{caption}</VisuallyHidden>
          </caption>
          <DensityContext.Provider value={density}>
            {children}
          </DensityContext.Provider>
        </table>
      </div>
    </Surface>
  );
}

export interface TableHeadProps
  extends HTMLAttributes<HTMLTableSectionElement> {
  // Keeps the header cells at the top of the scroll area while the body scrolls under them. It
  // needs a Table with a maxHeight (or a scrolling ancestor) to stick to.
  sticky?: boolean;
}

export function TableHead({
  sticky = false,
  className,
  ...rest
}: TableHeadProps) {
  return (
    <StickyHeadContext.Provider value={sticky}>
      <thead
        className={cx(
          'border-b border-border bg-surface-2 text-ink-2',
          className,
        )}
        {...rest}
      />
    </StickyHeadContext.Provider>
  );
}

export function TableBody({
  className,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cx('divide-y divide-border', className)} {...rest} />
  );
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  // The row is chosen: it is tinted and announced with aria-selected. Say so in the row's content
  // too (a checked box), so selection never rests on the tint alone.
  selected?: boolean;
}

// `group` lets a pinned cell, which paints its own opaque fill, follow the row's hover and selection.
export function TableRow({
  selected = false,
  className,
  ...rest
}: TableRowProps) {
  return (
    <tr
      aria-selected={selected || undefined}
      className={cx(
        'group',
        selected ? 'bg-primary-soft' : 'hover:bg-primary-ghost',
        className,
      )}
      {...rest}
    />
  );
}

const alignments: Record<TableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// Digits only line up when they share a width and an edge, so a numeric column gets the prototype's
// tabular, slashed-zero numerals and a right edge.
// An explicit align still wins over the numeric default.
function columnClasses(
  align: TableAlign | undefined,
  numeric: boolean,
  mono = false,
) {
  return cx(
    alignments[align ?? (numeric ? 'right' : 'left')],
    numeric && 'tabular-nums slashed-zero',
    mono && 'font-mono',
  );
}

// A cell pinned to the start edge while the table scrolls sideways. It paints an opaque fill (a
// pinned cell with none would show the cells scrolling under it) that follows the row's hover and
// selection, and a hairline on its end edge drawn by a pseudo-element, since a border on a pinned
// cell stays behind in a collapsed table. The caller sets the offset (left-0, left-11) with className.
const pinnedBody =
  'sticky z-10 bg-surface group-hover:bg-primary-ghost group-aria-selected:bg-primary-soft after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border';
const pinnedHead =
  'sticky z-30 bg-surface-2 after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border';
// A header cell of a sticky head: the hairline under it is a pseudo-element for the same reason.
const stickyHeadCell =
  'sticky top-0 z-20 bg-surface-2 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border';

export interface TableHeaderCellProps
  extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  // Defaults to right for a numeric column, left otherwise.
  align?: TableAlign;
  // A numeric column: monospaced digits, right-aligned, so figures can be scanned down it.
  numeric?: boolean;
  // Pinned to the start edge while the table scrolls sideways. Set its offset with className.
  stickyStart?: boolean;
}

// scope defaults to "col"; pass scope="row" for a header that labels the cells beside it.
export function TableHeaderCell({
  align,
  numeric = false,
  stickyStart = false,
  scope = 'col',
  className,
  ...rest
}: TableHeaderCellProps) {
  const density = useContext(DensityContext);
  const stickyHead = useContext(StickyHeadContext);
  const isColumn = scope !== 'row';
  return (
    <th
      scope={scope}
      className={cx(
        cellPadding[density],
        // A row header is body text that labels its row; a column header is the prototype's thead
        // th: 11px semibold capitals, tracked .06em.
        isColumn
          ? 'text-[11px] font-semibold uppercase tracking-[.06em]'
          : 'font-semibold',
        columnClasses(align, numeric),
        // A pinned header corner sits above both the sticky head and the pinned body cells.
        stickyStart && (isColumn ? pinnedHead : pinnedBody),
        isColumn && stickyHead && (stickyStart ? 'top-0' : stickyHeadCell),
        className,
      )}
      {...rest}
    />
  );
}

export interface TableCellProps
  extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  // Defaults to right for a numeric column, left otherwise.
  align?: TableAlign;
  // A numeric column: monospaced digits, right-aligned, so figures can be scanned down it.
  numeric?: boolean;
  // IBM Plex Mono, for identifiers (MRNs, order numbers).
  mono?: boolean;
  // Pinned to the start edge while the table scrolls sideways. Set its offset with className.
  stickyStart?: boolean;
}

export function TableCell({
  align,
  numeric = false,
  mono = false,
  stickyStart = false,
  className,
  ...rest
}: TableCellProps) {
  const density = useContext(DensityContext);
  return (
    <td
      className={cx(
        cellPadding[density],
        columnClasses(align, numeric, mono),
        stickyStart && pinnedBody,
        className,
      )}
      {...rest}
    />
  );
}
