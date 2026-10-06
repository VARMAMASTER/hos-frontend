import type { HTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';

export type DividerOrientation = 'horizontal' | 'vertical';

interface DividerBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  orientation?: DividerOrientation;
}

// A label makes the rule meaningful, so a labelled divider can never be decorative.
export type DividerProps = DividerBaseProps &
  (
    | {
        // Text centred on the rule ("Yesterday", "or"). It becomes the separator's accessible name.
        label: string;
        decorative?: never;
      }
    | {
        label?: undefined;
        // Purely visual: hidden from assistive technology instead of announced as a separator.
        decorative?: boolean;
      }
  );

const rule = {
  horizontal: 'h-px w-full bg-border',
  vertical: 'w-px self-stretch bg-border',
} as const satisfies Record<DividerOrientation, string>;

const labelled = {
  horizontal: 'flex w-full items-center gap-3',
  vertical: 'flex flex-col items-center gap-3 self-stretch',
} as const satisfies Record<DividerOrientation, string>;

const half = {
  horizontal: 'h-px flex-1 bg-border',
  vertical: 'w-px flex-1 bg-border',
} as const satisfies Record<DividerOrientation, string>;

export function Divider({
  orientation = 'horizontal',
  label,
  decorative,
  className,
  ...rest
}: DividerProps) {
  const semantics = {
    role: 'separator',
    'aria-orientation': orientation,
    'data-orientation': orientation,
  } as const;

  if (label !== undefined) {
    // role="separator" makes its children presentational, so the text is exposed as the name; the
    // visible copy is the same words.
    return (
      <div
        {...rest}
        {...semantics}
        aria-label={label}
        className={cx(
          labelled[orientation],
          'text-caption font-semibold text-ink-3',
          className,
        )}
      >
        <span aria-hidden="true" className={half[orientation]} />
        <span>{label}</span>
        <span aria-hidden="true" className={half[orientation]} />
      </div>
    );
  }

  return (
    <div
      {...rest}
      {...semantics}
      aria-hidden={decorative ? true : undefined}
      className={cx(rule[orientation], className)}
    />
  );
}
