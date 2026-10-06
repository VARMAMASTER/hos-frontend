import {
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

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  // Names the table for assistive technology. Rendered as a real <caption>, visually hidden.
  caption: ReactNode;
}

// The frame is the data material: opaque under both materials, the card hairline with the prototype's
// gradient edge, radius md. The table inside is the prototype's: 13px, cells 10px by 16px.
// Glass behind a column of numbers costs legibility, so never swap it for a translucent surface.
// The hairline is the frame's border, so the frame itself must not scroll; the scroller sits inside it.
// className styles the frame (placement, spacing); every other attribute describes the <table>
// itself (id, aria-describedby, ...) and lands on it.
export function Table({ caption, className, children, ...rest }: TableProps) {
  const captionId = useId();
  return (
    <Surface material="data" radius="md" className={className}>
      {/* A scroll container needs a tab stop, or keyboard users cannot scroll a wide table; naming
          it makes that stop announce as the table it scrolls. */}
      <div
        role="region"
        aria-labelledby={captionId}
        tabIndex={0}
        className={cx('overflow-x-auto nova-radius-inherit', focusRing)}
      >
        <table
          className="w-full border-collapse text-left text-[13px] text-ink"
          {...rest}
        >
          <caption id={captionId}>
            <VisuallyHidden>{caption}</VisuallyHidden>
          </caption>
          {children}
        </table>
      </div>
    </Surface>
  );
}

export function TableHead({
  className,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cx(
        'border-b border-border bg-surface-2 text-ink-2',
        className,
      )}
      {...rest}
    />
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

export function TableRow({
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cx('hover:bg-primary-ghost', className)} {...rest} />;
}

const alignments: Record<TableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// Digits only line up when they share a width and an edge, so a numeric column gets the prototype's
// tabular, slashed-zero numerals and a right edge.
// An explicit align still wins over the numeric default.
function columnClasses(align: TableAlign | undefined, numeric: boolean) {
  return cx(
    alignments[align ?? (numeric ? 'right' : 'left')],
    numeric && 'tabular-nums slashed-zero',
  );
}

export interface TableHeaderCellProps
  extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  // Defaults to right for a numeric column, left otherwise.
  align?: TableAlign;
  // A numeric column: monospaced digits, right-aligned, so figures can be scanned down it.
  numeric?: boolean;
}

// scope defaults to "col"; pass scope="row" for a header that labels the cells beside it.
export function TableHeaderCell({
  align,
  numeric = false,
  scope = 'col',
  className,
  ...rest
}: TableHeaderCellProps) {
  return (
    <th
      scope={scope}
      className={cx(
        'px-4 py-2.5',
        // A row header is body text that labels its row; a column header is the prototype's thead
        // th: 11px semibold capitals, tracked .06em.
        scope === 'row'
          ? 'font-semibold'
          : 'text-[11px] font-semibold uppercase tracking-[.06em]',
        columnClasses(align, numeric),
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
}

export function TableCell({
  align,
  numeric = false,
  className,
  ...rest
}: TableCellProps) {
  return (
    <td
      className={cx('px-4 py-2.5', columnClasses(align, numeric), className)}
      {...rest}
    />
  );
}
