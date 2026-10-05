import {
  useId,
  type HTMLAttributes,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';

export type TableAlign = 'left' | 'center' | 'right';

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  // Names the table for assistive technology. Rendered as a real <caption>, visually hidden.
  caption: ReactNode;
}

// The frame is `nova-data`: opaque under both materials, with its richness in a 1px edge. Glass
// behind a column of numbers costs legibility, so never swap it for a translucent surface.
// className styles the scroll container (placement, spacing); every other attribute describes the
// <table> itself (id, aria-describedby, ...) and lands on it.
export function Table({ caption, className, children, ...rest }: TableProps) {
  const captionId = useId();
  return (
    // A scroll container needs a tab stop, or keyboard users cannot scroll a wide table; naming it
    // makes that stop announce as the table it scrolls.
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      className={[
        'nova-data overflow-x-auto rounded-lg',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <table
        className="w-full border-collapse text-left text-sm text-ink"
        {...rest}
      >
        <caption id={captionId} className="sr-only">
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({
  className,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={[
        'border-b border-border-strong bg-surface-2 text-ink-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}

export function TableBody({
  className,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={['divide-y divide-border', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}

export function TableRow({
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={['hover:bg-surface-2', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

const alignments: Record<TableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// Digits only line up when they are monospaced and share an edge, so a numeric column gets both.
// An explicit align still wins over the numeric default.
function columnClasses(align: TableAlign | undefined, numeric: boolean) {
  return [
    alignments[align ?? (numeric ? 'right' : 'left')],
    numeric ? 'font-mono' : undefined,
  ];
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
      className={[
        'px-4 py-2.5',
        // A row header is body text that labels its row; a column header is a small caption.
        scope === 'row' ? 'font-medium' : 'text-xs font-semibold',
        ...columnClasses(align, numeric),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
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
      className={['px-4 py-2.5', ...columnClasses(align, numeric), className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}
