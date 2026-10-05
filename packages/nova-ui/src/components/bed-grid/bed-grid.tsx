import type { HTMLAttributes } from 'react';

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
// blocked bed is neutral and dashed (not red) because red is kept for clinical urgency.
const statusStyles: Record<BedStatus, { cell: string; word: string }> = {
  free: { cell: 'border-good/40 bg-good-soft', word: 'text-good-deep' },
  occupied: { cell: 'border-info/40 bg-info-soft', word: 'text-info-deep' },
  cleaning: { cell: 'border-warn/40 bg-warn-soft', word: 'text-warn-deep' },
  blocked: {
    cell: 'border-dashed border-border-strong bg-surface-2',
    word: 'text-ink-2',
  },
};

const cellBase = 'block min-h-16 w-full rounded-md border p-2.5 text-left';

const interactive =
  'cursor-pointer hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

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
  return [`Bed ${bed.label}`, bed.status, patientOf(bed), bed.ward]
    .filter(Boolean)
    .join(', ');
}

function BedContent({ bed }: { bed: Bed }) {
  const patient = patientOf(bed);
  return (
    <>
      <span aria-hidden="true" className="block">
        <span className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="font-mono text-xs font-medium text-ink">
            {bed.label}
          </span>
          {/* The status word is the cue; colour only backs it up. */}
          <span
            className={`text-[11px] font-bold tracking-wide uppercase ${statusStyles[bed.status].word}`}
          >
            {bed.status}
          </span>
        </span>
        {patient ? (
          <span className="mt-1 block truncate text-sm font-semibold text-ink">
            {patient}
          </span>
        ) : null}
        {bed.ward ? (
          <span className="block truncate text-xs text-ink-2">{bed.ward}</span>
        ) : null}
      </span>
      <span className="sr-only">{readout(bed)}</span>
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
      className={[
        'grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {beds.map((bed) => {
        const cell = `${cellBase} ${statusStyles[bed.status].cell}`;
        return onSelect ? (
          <li key={bed.id}>
            <button
              type="button"
              data-status={bed.status}
              className={`${cell} ${interactive}`}
              onClick={() => onSelect(bed.id)}
            >
              <BedContent bed={bed} />
            </button>
          </li>
        ) : (
          <li key={bed.id} data-status={bed.status} className={cell}>
            <BedContent bed={bed} />
          </li>
        );
      })}
    </ul>
  );
}
