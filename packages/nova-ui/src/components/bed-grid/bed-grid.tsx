import type { HTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Surface } from '../../primitives/surface';
import { VisuallyHidden } from '../../primitives/visually-hidden';

export type BedStatus = 'free' | 'occupied' | 'cleaning' | 'blocked';

export interface Bed {
  id: string;
  // The bed's own identifier ("12", "GM-01"). Read out as "Bed 12".
  label: string;
  status: BedStatus;
  // Shown, and read out, only while the bed is occupied: a free, cleaning or blocked bed never
  // shows a patient name, even if stale data supplies one.
  patient?: string;
  ward?: string;
}

export interface BedGridProps
  extends Omit<
    HTMLAttributes<HTMLUListElement>,
    'onSelect' | 'children' | 'aria-label'
  > {
  beds: Bed[];
  // With a handler each bed is a button; without one it is a plain list item.
  onSelect?: (id: string) => void;
  // Names the board ("Ward A beds"). Required: an unnamed grid of beds tells a screen reader nothing.
  ariaLabel: string;
}

// Status is always a word on the cell and in its accessible text; colour only backs it up. A
// blocked bed is neutral and dashed (not red) because red is kept for clinical urgency. The tint
// replaces the data surface's white fill, and the border marks the cell's edge: the status colour at
// --nova-status-edge-tint (18%).
const statusStyles: Record<BedStatus, { cell: string; word: string }> = {
  free: {
    cell: 'bg-good-soft [--nova-card-edge:color-mix(in_srgb,var(--nova-color-good)_var(--nova-status-edge-tint),transparent)]',
    word: 'text-good-deep',
  },
  occupied: {
    cell: 'bg-info-soft [--nova-card-edge:color-mix(in_srgb,var(--nova-color-info)_var(--nova-status-edge-tint),transparent)]',
    word: 'text-info-deep',
  },
  cleaning: {
    cell: 'bg-warn-soft [--nova-card-edge:color-mix(in_srgb,var(--nova-color-warn)_var(--nova-status-edge-tint),transparent)]',
    word: 'text-warn-deep',
  },
  blocked: {
    cell: 'border-dashed bg-surface-2 [--nova-card-edge:var(--nova-color-border-strong)]',
    word: 'text-ink-2',
  },
};

// Only an occupied bed has a patient. A bed that is free, being cleaned or blocked never shows or
// announces one, even if stale data supplies a name: two contradictory signals on one bed is how
// someone gets put in an occupied bed.
function patientOf(bed: Bed): string | undefined {
  return bed.status === 'occupied' ? bed.patient : undefined;
}

// What a screen reader hears for the cell: "Bed 12, occupied, Ramesh, Ward A". One string, so the
// accessible name is the same in every browser and on both the button and the plain list item (where
// an aria-label is patchily supported). The visual layer below repeats it and is aria-hidden.
function readout(bed: Bed): string {
  const parts = [`Bed ${bed.label}`, bed.status, patientOf(bed), bed.ward];
  return parts.filter((part): part is string => Boolean(part)).join(', ');
}

function BedContent({ bed }: { bed: Bed }) {
  const patient = patientOf(bed);
  return (
    <>
      <span aria-hidden="true" className="block">
        <span className="flex flex-wrap items-baseline justify-between gap-x-s3">
          <span className="font-mono text-badge text-ink-3">{bed.label}</span>
          {/* The status word is the cue; colour only backs it up. */}
          <span
            className={cx(
              'text-badge font-bold tracking-label uppercase',
              statusStyles[bed.status].word,
            )}
          >
            {bed.status}
          </span>
        </span>
        {patient ? (
          <span className="mt-s0 block truncate text-label font-semibold text-ink">
            {patient}
          </span>
        ) : null}
        {bed.ward ? (
          <span className="block truncate text-meta text-ink-2">
            {bed.ward}
          </span>
        ) : null}
      </span>
      <VisuallyHidden>{readout(bed)}</VisuallyHidden>
    </>
  );
}

export function BedGrid({
  beds,
  onSelect,
  ariaLabel,
  className,
  ...rest
}: BedGridProps) {
  return (
    <ul
      {...rest}
      aria-label={ariaLabel}
      className={cx(
        // The prototype's .bed-grid: cells at least --nova-bed-min-w (96px) wide, 8px apart.
        'grid grid-cols-[repeat(auto-fill,minmax(var(--nova-bed-min-w),1fr))] gap-s3',
        className,
      )}
    >
      {beds.map((bed) => (
        // Every cell is the prototype's .bed: an opaque tile (bed status is clinical, so it must stay
        // legible under glass) with no resting shadow, 11px type (text-meta), 8px of padding (p-s3), at
        // least --nova-bed-min-h (64px) tall (its 10px radius is off the --r-* scale, so the control
        // corner). A selectable bed lifts 2px (s0) to shadow-lg on hover.
        // The list item carries the surface and the status; a button, when there is one, fills it.
        <Surface
          key={bed.id}
          as="li"
          material="card"
          radius="control"
          data-status={bed.status}
          className={cx(
            'text-meta [--nova-surface-lift:none]',
            statusStyles[bed.status].cell,
            !onSelect && 'min-h-bed p-s3',
            onSelect &&
              'transition-[transform,box-shadow] duration-fast ease-standard motion-reduce:transition-none hover:[--nova-surface-lift:var(--nova-shadow-lg)] motion-safe:hover:-translate-y-s0',
          )}
        >
          {onSelect ? (
            <button
              type="button"
              className={cx(
                'block min-h-bed w-full nova-radius-inherit p-s3 text-left',
                focusRing,
              )}
              onClick={() => onSelect(bed.id)}
            >
              <BedContent bed={bed} />
            </button>
          ) : (
            <BedContent bed={bed} />
          )}
        </Surface>
      ))}
    </ul>
  );
}
