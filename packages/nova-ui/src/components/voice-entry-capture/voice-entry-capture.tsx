import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import {
  AiDraftBlock,
  type AiDraftBlockProps,
  type AiDraftStatus,
} from '../ai-draft-block/ai-draft-block';
import {
  AiSourceLine,
  type AiConfidence,
} from '../ai-source-line/ai-source-line';
import { StreamCaret } from '../ambient-scribe-recorder/stream-caret';
import { Button } from '../button/button';
import { TextField } from '../text-field/text-field';

// The nurse speaks a set of vitals; HOS shows what it heard, then what it will chart.
// - listening: the words arrive; nothing is charted.
// - parsed: the values, pre-filled and editable; Approve or Say it again.
// - approved: charted, with who and when.
export type VoiceEntryStatus = 'listening' | 'parsed' | 'approved';

export const VOICE_ENTRY_STATUSES: readonly VoiceEntryStatus[] = [
  'listening',
  'parsed',
  'approved',
];

export interface VoiceField {
  key: string;
  label: string;
  // Shown beside the input ("°F", "mmHg"), and read out after the label; unitLabel is the spoken
  // form when the symbol reads badly ("per cent").
  unit?: string;
  unitLabel?: string;
  inputMode?: 'decimal' | 'numeric' | 'text';
  // The usual range. A value outside it is flagged with an icon and words, never only a colour.
  range?: { min?: number; max?: number };
}

// The prototype's eight bedside vitals (14-nursing.html, the vitals pad), with the usual adult
// ranges. A ward with its own ranges (paediatrics, obstetrics) passes its own fields.
export const VOICE_VITAL_FIELDS: readonly VoiceField[] = [
  {
    key: 'temp',
    label: 'Temp',
    unit: '°F',
    inputMode: 'decimal',
    range: { min: 97, max: 99.5 },
  },
  {
    key: 'pulse',
    label: 'Pulse',
    unit: '/min',
    unitLabel: 'per minute',
    inputMode: 'numeric',
    range: { min: 60, max: 100 },
  },
  {
    key: 'sys',
    label: 'BP systolic',
    unit: 'mmHg',
    inputMode: 'numeric',
    range: { min: 90, max: 140 },
  },
  {
    key: 'dia',
    label: 'BP diastolic',
    unit: 'mmHg',
    inputMode: 'numeric',
    range: { min: 60, max: 90 },
  },
  {
    key: 'rr',
    label: 'Resp. rate',
    unit: '/min',
    unitLabel: 'per minute',
    inputMode: 'numeric',
    range: { min: 12, max: 20 },
  },
  {
    key: 'spo2',
    label: 'SpO₂',
    unit: '%',
    unitLabel: 'per cent',
    inputMode: 'numeric',
    range: { min: 95, max: 100 },
  },
  {
    key: 'pain',
    label: 'Pain',
    unit: '/10',
    unitLabel: 'out of 10',
    inputMode: 'numeric',
    range: { min: 0, max: 10 },
  },
  {
    key: 'grbs',
    label: 'GRBS',
    unit: 'mg/dL',
    inputMode: 'numeric',
    range: { min: 70, max: 140 },
  },
];

export interface VoiceParsedValue {
  value: string;
  // How sure the transcription is of this value; low and medium are marked on the field.
  confidence?: AiConfidence;
  // The words it was taken from ("nooru point four"), shown with the confidence mark.
  heard?: string;
}

// Only the fields that were spoken. A field that is not here stays empty.
export type VoiceParsed = Readonly<Record<string, VoiceParsedValue>>;

export type VoiceValues = Record<string, string>;

export interface VoiceEntryApproval {
  // The filled values only, by field key.
  values: VoiceValues;
  approver: string;
  at: Date;
}

export interface VoiceEntryCaptureLabels {
  title: string;
  said: string;
  willChart: string;
  listening: string;
  approve: (count: number) => string;
  approved: string;
  sayAgain: string;
  nothingToChart: string;
  heard: string;
  last: (value: string) => string;
  above: (field: VoiceField) => string;
  below: (field: VoiceField) => string;
}

function rangeText(field: VoiceField): string {
  const { min, max } = field.range ?? {};
  if (min !== undefined && max !== undefined) return ` (${min}–${max})`;
  return '';
}

export const VOICE_ENTRY_CAPTURE_LABELS: Readonly<VoiceEntryCaptureLabels> = {
  title: 'Voice entry',
  said: 'What you said',
  willChart: 'What HOS will chart',
  listening: 'Listening…',
  approve: (count) =>
    count === 0
      ? 'Approve & chart'
      : `Approve & chart ${count} ${count === 1 ? 'vital' : 'vitals'}`,
  approved: 'Charted',
  sayAgain: 'Say it again',
  nothingToChart:
    'Nothing to chart yet: no value was heard. Say it again, or type the values.',
  heard: 'Heard',
  last: (value) => `last ${value}`,
  above: (field) => `Above the usual range${rangeText(field)}`,
  below: (field) => `Below the usual range${rangeText(field)}`,
};

export interface VoiceEntryCaptureProps
  extends Omit<
    AiDraftBlockProps,
    | 'title'
    | 'children'
    | 'status'
    | 'defaultStatus'
    | 'onStatusChange'
    | 'onApprove'
    | 'verb'
    | 'approvedVerb'
    | 'blockedReason'
    | 'labels'
  > {
  title?: ReactNode;
  status?: VoiceEntryStatus;
  defaultStatus?: VoiceEntryStatus;
  onStatusChange?: (status: VoiceEntryStatus) => void;
  // What the nurse said, as the transcription streams it, and its language.
  transcript?: string;
  transcriptLang?: string;
  fields?: readonly VoiceField[];
  // What was understood, by field key. The fields start from it, and start again when it changes.
  parsed?: VoiceParsed;
  // The patient's last charted set, shown under each field as "last 98" (never as its value).
  lastValues?: Readonly<Record<string, string>>;
  // The values as they stand: controlled with values, or kept here, starting from parsed.
  values?: VoiceValues;
  onValuesChange?: (values: VoiceValues) => void;
  onApprove?: (approval: VoiceEntryApproval) => void;
  // Say it again: the app listens again; the fields are cleared.
  onSayAgain?: () => void;
  labels?: Partial<VoiceEntryCaptureLabels>;
  // The AiDraftBlock words (the approval record, Undo).
  draftLabels?: AiDraftBlockProps['labels'];
}

function fromParsed(parsed: VoiceParsed | undefined): VoiceValues {
  const values: VoiceValues = {};
  for (const [key, entry] of Object.entries(parsed ?? {})) {
    if (entry.value.trim()) values[key] = entry.value;
  }
  return values;
}

function filled(values: VoiceValues): VoiceValues {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value.trim() !== ''),
  );
}

function outOfRange(
  field: VoiceField,
  value: string,
): 'above' | 'below' | null {
  if (!field.range || !value.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (field.range.max !== undefined && number > field.range.max) return 'above';
  if (field.range.min !== undefined && number < field.range.min) return 'below';
  return null;
}

const warnIcon = (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className="mt-px size-icon-xs shrink-0"
  >
    <path d="M10 2.75 18 16.5H2z" />
    <path d="M10 8v3.5M10 14v.01" />
  </svg>
);

// The input as the prototype's vitals pad draws it (.vfield): a 48px field with the value centred in
// 16px mono semibold, under an 11px uppercase label; a value HOS filled in carries the AI edge on the
// AI wash until the nurse changes it.
const padField = cx(
  'min-w-0 flex-1',
  '[&_input]:min-h-s10 [&_input]:text-center [&_input]:font-mono [&_input]:text-subtitle [&_input]:font-semibold',
  '[&_label]:text-meta [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-label [&_label]:text-ink-3',
);
const aiFilled =
  '[--nova-field-edge:var(--nova-color-ai)] [--nova-field-fill:var(--nova-color-ai-ghost)]';

// The pane headings: the prototype's 12px bold uppercase in the AI ink.
const paneHeading =
  'mb-s1 font-display text-label font-bold uppercase tracking-label text-ai-deep';

// The prototype's voice entry (14-nursing.html, "Voice entry — GM-03"): an AI draft that shows what
// the nurse said, then what HOS will chart, pre-filled and editable, with Approve & chart and Say it
// again. Numbers come only from the words said: a field that was not spoken stays empty rather than
// being filled with the last value. Approving needs at least one value, and records who and when.
export function VoiceEntryCapture({
  title,
  status: statusProp,
  defaultStatus = 'listening',
  onStatusChange,
  transcript,
  transcriptLang,
  fields = VOICE_VITAL_FIELDS,
  parsed,
  lastValues,
  values: valuesProp,
  onValuesChange,
  onApprove,
  onSayAgain,
  labels: labelsProp,
  draftLabels,
  headingLevel = 3,
  actions,
  ...rest
}: VoiceEntryCaptureProps) {
  const words: VoiceEntryCaptureLabels = {
    ...VOICE_ENTRY_CAPTURE_LABELS,
    ...labelsProp,
  };
  const ids = useId();
  const [status, setStatus] = useControllableState({
    value: statusProp,
    defaultValue: defaultStatus,
    onChange: onStatusChange,
  });
  const [values, setValues] = useControllableState<VoiceValues>({
    value: valuesProp,
    defaultValue: fromParsed(parsed),
    onChange: onValuesChange,
  });

  // A new parse starts the fields again (uncontrolled; a controlled caller sets values itself).
  // Only a new parse resets the fields, so the rest is read through a ref.
  const firstParse = useRef(true);
  const reset = useRef(() => {
    if (valuesProp === undefined) setValues(fromParsed(parsed));
  });
  reset.current = () => {
    if (valuesProp === undefined) setValues(fromParsed(parsed));
  };
  useEffect(() => {
    if (firstParse.current) {
      firstParse.current = false;
      return;
    }
    reset.current();
  }, [parsed]);

  const chosen = filled(values);
  const count = Object.keys(chosen).length;
  const draftStatus: AiDraftStatus =
    status === 'listening'
      ? 'generating'
      : status === 'approved'
        ? 'approved'
        : count === 0
          ? 'blocked'
          : 'pending';
  const Heading = `h${Math.min(6, headingLevel + 1)}` as 'h4' | 'h5' | 'h6';

  function sayAgain() {
    if (valuesProp === undefined) setValues({});
    setStatus('listening');
    onSayAgain?.();
  }

  return (
    <AiDraftBlock
      title={title ?? words.title}
      headingLevel={headingLevel}
      status={draftStatus}
      onStatusChange={(next) => {
        if (next === 'approved') setStatus('approved');
        else if (next === 'undone' || next === 'pending') setStatus('parsed');
      }}
      onApprove={({ approver, at }) =>
        onApprove?.({ values: chosen, approver, at })
      }
      verb={words.approve(count)}
      approvedVerb={words.approved}
      blockedReason={words.nothingToChart}
      rejectable={false}
      labels={{ generating: words.listening, ...draftLabels }}
      actions={
        status === 'parsed' ? (
          <>
            <Button variant="ghost" size="sm" onClick={sayAgain}>
              {words.sayAgain}
            </Button>
            {actions}
          </>
        ) : (
          actions
        )
      }
      {...rest}
    >
      <div className="flex flex-col gap-s6">
        <div>
          <Heading className={paneHeading}>{words.said}</Heading>
          <p
            data-slot="transcript"
            lang={transcriptLang}
            className="text-control italic leading-relaxed text-ink"
          >
            {transcript}
            {status === 'listening' ? <StreamCaret /> : null}
          </p>
          {/* Always mounted; it reads out what was heard once, when it is parsed. */}
          <VisuallyHidden
            as="div"
            data-slot="heard-live"
            aria-live="polite"
            lang={transcriptLang}
          >
            {status === 'parsed' ? transcript : ''}
          </VisuallyHidden>
        </div>

        {status === 'listening' ? null : (
          <div className="motion-safe:animate-fade-in">
            <Heading className={paneHeading}>{words.willChart}</Heading>
            {/* .vpad: as many 132px columns as fit, 10px apart. */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(var(--nova-ai-stat-min-w),1fr))] gap-s4">
              {fields.map((field) => {
                const value = values[field.key] ?? '';
                const entry = parsed?.[field.key];
                const fromAi =
                  value !== '' && entry !== undefined && entry.value === value;
                const range = outOfRange(field, value);
                const confidence = fromAi ? entry?.confidence : undefined;
                const marked = confidence === 'low' || confidence === 'medium';
                const last = lastValues?.[field.key];
                const confidenceId = `${ids}-${field.key}-confidence`;
                const rangeId = `${ids}-${field.key}-range`;
                const lastId = `${ids}-${field.key}-last`;
                const describedBy =
                  cx(
                    marked && confidenceId,
                    range && rangeId,
                    last !== undefined && lastId,
                  ) || undefined;
                return (
                  <div
                    key={field.key}
                    data-field={field.key}
                    data-filled={fromAi ? 'ai' : undefined}
                    data-out-of-range={range ?? undefined}
                    className="flex flex-col gap-s1"
                  >
                    <div className="flex items-end gap-s2">
                      <TextField
                        className={cx(padField, fromAi && aiFilled)}
                        label={
                          <>
                            {field.label}
                            {/* The space sits outside the hidden span, which name computation
                                treats as a block of its own. */}
                            {field.unit ? (
                              <>
                                {' '}
                                <VisuallyHidden>
                                  {`(${field.unitLabel ?? field.unit})`}
                                </VisuallyHidden>
                              </>
                            ) : null}
                          </>
                        }
                        value={value}
                        inputMode={field.inputMode}
                        placeholder="—"
                        readOnly={status === 'approved'}
                        aria-describedby={describedBy}
                        onChange={(event) =>
                          setValues({
                            ...values,
                            [field.key]: event.target.value,
                          })
                        }
                      />
                      {field.unit ? (
                        <span
                          data-slot="unit"
                          aria-hidden="true"
                          className="flex h-s10 items-center font-mono text-label text-ink-2"
                        >
                          {field.unit}
                        </span>
                      ) : null}
                    </div>
                    {last !== undefined ? (
                      <p
                        id={lastId}
                        className="text-center font-mono text-overline text-ink-3"
                      >
                        {words.last(last)}
                      </p>
                    ) : null}
                    {range ? (
                      <p
                        id={rangeId}
                        data-slot="range"
                        className="flex items-start gap-s1 text-caption font-semibold text-warn-deep"
                      >
                        {warnIcon}
                        {range === 'above'
                          ? words.above(field)
                          : words.below(field)}
                      </p>
                    ) : null}
                    {marked ? (
                      <AiSourceLine
                        id={confidenceId}
                        label={words.heard}
                        confidence={confidence}
                        contentLang={transcriptLang}
                        className="[&_[data-confidence]]:whitespace-normal"
                      >
                        {entry?.heard ?? entry?.value}
                      </AiSourceLine>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AiDraftBlock>
  );
}
