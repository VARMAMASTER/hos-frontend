import type { ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { CheckboxBox } from '../../primitives/checkbox-box';
import { Chip, type ChipTone } from '../chip/chip';
import { AiSourceLine } from '../ai-source-line/ai-source-line';
import { TableCell, TableHeaderCell, TableRow } from '../table/table';
import {
  extractedValueStatus,
  rangeText,
  type ExtractedValue,
  type ExtractedValueStatus,
  type ExtractedValuesReviewLabels,
} from './extracted-values-review-model';

// One row of ExtractedValuesReview's table, and the status marks and icons the review draws.

const svg = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

// A different shape per status, so the status survives greyscale and colour blindness: a tick, an
// arrow down, an arrow up, and a double arrow for a critical value.
const statusIcons: Record<ExtractedValueStatus, ReactNode> = {
  normal: (
    <svg {...svg}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  ),
  low: (
    <svg {...svg}>
      <path d="M10 4v12M5 11l5 5 5-5" />
    </svg>
  ),
  high: (
    <svg {...svg}>
      <path d="M10 16V4M5 9l5-5 5 5" />
    </svg>
  ),
  'critical-low': (
    <svg {...svg}>
      <path d="M5 4l5 5 5-5M5 11l5 5 5-5" />
    </svg>
  ),
  'critical-high': (
    <svg {...svg}>
      <path d="M5 16l5-5 5 5M5 9l5-5 5 5" />
    </svg>
  ),
};

const statusTones: Record<ExtractedValueStatus, ChipTone> = {
  normal: 'good',
  low: 'warn',
  high: 'warn',
  'critical-low': 'crit',
  'critical-high': 'crit',
};

export const icons = {
  // Spins only when motion is welcome; a still ring otherwise, with the words doing the work.
  working: (
    <svg {...svg} className="motion-safe:animate-spin">
      <circle cx="10" cy="10" r="7" opacity="0.35" />
      <path d="M17 10a7 7 0 0 0-7-7" />
    </svg>
  ),
  waiting: (
    <svg {...svg}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4.25l2.75 1.75" />
    </svg>
  ),
  failed: (
    <svg {...svg}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4.5M10 13.5h.01" />
    </svg>
  ),
  paper: (
    <svg {...svg}>
      <path d="M5.5 2.75h6l3.5 3.5v11h-9.5z" />
      <path d="M11.5 2.75v3.5H15M8 10.5h5M8 13.5h5" />
    </svg>
  ),
  edited: (
    <svg {...svg}>
      <path d="M13.5 3.5l3 3-9 9H4.5v-3z" />
    </svg>
  ),
  filed: (
    <svg {...svg}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  ),
  notFiled: (
    <svg {...svg}>
      <path d="M5.5 10h9" />
    </svg>
  ),
} as const;

export interface ExtractedRowProps {
  rowId: string;
  value: ExtractedValue;
  text: string;
  ticked: boolean;
  edited: boolean;
  locked: boolean;
  onTick: (on: boolean) => void;
  onText: (text: string) => void;
  onViewSource?: (value: ExtractedValue) => void;
  lang?: string;
  words: ExtractedValuesReviewLabels;
}

const sourceButton = cx(
  'inline-flex min-h-(--nova-touch-sm) cursor-pointer items-center rounded-control text-caption font-semibold text-ai-deep underline underline-offset-tight',
  focusRing,
);

// The prototype's .ext-val: a small mono input, 12px at 600, padded 4px by 8px.
const valueInput = cx(
  'nova-field w-(--nova-extracted-value-w) rounded-control px-s3 py-s1 font-mono text-label font-semibold text-ink tabular-nums',
  focusRing,
);

export function ExtractedRow({
  rowId,
  value,
  text,
  ticked,
  edited,
  locked,
  onTick,
  onText,
  onViewSource,
  lang,
  words,
}: ExtractedRowProps) {
  const nameId = `${rowId}-name`;
  const unitId = `${rowId}-unit`;
  const readId = `${rowId}-read`;
  const errorId = `${rowId}-error`;
  const viewId = `${rowId}-view`;
  const status = extractedValueStatus(text, value.range);
  const missing = ticked && !locked && text.trim() === '';
  const describedBy = cx(
    value.unit && unitId,
    edited && readId,
    missing && errorId,
  );

  return (
    <TableRow
      data-included={ticked ? 'true' : 'false'}
      data-confidence={value.confidence}
      className="align-top"
    >
      <TableCell stickyStart className="left-0 w-s10">
        {locked ? (
          <span
            className={cx(
              'inline-flex items-center gap-s1 whitespace-nowrap text-label font-semibold [&_svg]:size-icon-xs',
              ticked ? 'text-good-deep' : 'text-ink-2',
            )}
          >
            {ticked ? icons.filed : icons.notFiled}
            {ticked ? words.filedYes : words.filedNo}
          </span>
        ) : (
          // The whole cell is the tick's target, 44px square, so a gloved or hurried press lands.
          <label className="-mx-s3 -my-s2 flex min-h-touch min-w-touch cursor-pointer items-center justify-center">
            <CheckboxBox
              checked={ticked}
              aria-label={words.include(value.test)}
              onChange={(event) => onTick(event.target.checked)}
            />
          </label>
        )}
      </TableCell>
      <TableHeaderCell scope="row" className="align-top">
        <span id={nameId} lang={lang}>
          {value.test}
        </span>
        {value.filed ? (
          <span className="mt-s1 flex">
            <Chip tone="neutral">{words.filed(value.filedSource)}</Chip>
          </span>
        ) : null}
      </TableHeaderCell>
      <TableCell>
        {/* The unit wraps under the value when the table is squeezed, so the table's narrowest
            width is the input's, not the input's and a long unit's. */}
        <div className="flex flex-wrap items-center gap-x-s2 gap-y-s1">
          {locked ? (
            <span
              className="font-mono text-label font-semibold tabular-nums"
              lang={lang}
            >
              {text}
            </span>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              className={valueInput}
              value={text}
              lang={lang}
              aria-label={words.valueLabel(value.test)}
              aria-describedby={describedBy || undefined}
              aria-invalid={missing || undefined}
              data-invalid={missing ? 'true' : undefined}
              onChange={(event) => onText(event.target.value)}
            />
          )}
          {value.unit ? (
            <span id={unitId} className="font-mono text-label text-ink-2">
              {value.unit}
            </span>
          ) : null}
        </div>
        {edited ? (
          <div className="mt-s1 flex flex-wrap items-center gap-s2">
            <Chip tone="info" icon={icons.edited}>
              {words.edited}
            </Chip>
            <span
              id={readId}
              className="font-mono text-meta text-ink-2"
              lang={lang}
            >
              {words.aiRead(value.value)}
            </span>
          </div>
        ) : null}
        {missing ? (
          <p
            id={errorId}
            className="mt-s1 text-caption font-semibold text-crit-deep"
          >
            {words.valueRequired}
          </p>
        ) : null}
      </TableCell>
      <TableCell mono className="whitespace-nowrap text-label">
        {rangeText(value.range)}
      </TableCell>
      <TableCell>
        {status ? (
          <Chip tone={statusTones[status]} icon={statusIcons[status]}>
            {words.status[status]}
          </Chip>
        ) : (
          <span className="text-label text-ink-2">{words.notCompared}</span>
        )}
      </TableCell>
      <TableCell className="min-w-column">
        <AiSourceLine
          label={words.sourceLabel}
          confidence={value.confidence}
          contentLang={lang}
        >
          {value.source}
        </AiSourceLine>
        {onViewSource ? (
          <button
            type="button"
            id={viewId}
            aria-labelledby={`${viewId} ${nameId}`}
            className={sourceButton}
            onClick={() => onViewSource(value)}
          >
            {words.viewInReport}
          </button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
