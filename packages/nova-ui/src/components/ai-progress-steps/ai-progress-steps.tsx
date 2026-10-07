import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { VisuallyHidden } from '../../primitives/visually-hidden';

export type AiStepStatus = 'pending' | 'running' | 'done';

export interface AiProgressStep {
  // The step in words, in the caller's language: "Reading 12 nursing notes".
  label: string;
  // Overrides what currentIndex would make it.
  status?: AiStepStatus;
}

export type AiProgressDensity = 'compact' | 'comfortable';

export interface AiProgressStepsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  steps: ReadonlyArray<string | AiProgressStep>;
  // The running step: the ones before it are done and the ones after it pending. Past the last step,
  // every step is done. Left out, each step's own status decides (pending when it has none).
  currentIndex?: number;
  // compact is the prototype's .ai-progress-line; comfortable is a size up for a panel of its own.
  density?: AiProgressDensity;
  // Shown, and announced, once every step is done: "Done in 1.8 s".
  summary?: ReactNode;
  // The list's name, shown as a caption with the ✦ mark. Inside an AI block that already says it is
  // AI, showLabel={false} hides the caption and keeps the name.
  label?: string;
  showLabel?: boolean;
  // The fixed words, all translatable: the state of each step, and the live announcement.
  statusLabels?: Readonly<Record<AiStepStatus, string>>;
  formatProgress?: (step: number, total: number, label: string) => string;
  formatComplete?: (total: number) => string;
  lang?: string;
}

const STATUS_LABELS: Readonly<Record<AiStepStatus, string>> = {
  done: 'Done',
  running: 'In progress',
  pending: 'Waiting',
};

const progress = (step: number, total: number, label: string) =>
  `Step ${step} of ${total}: ${label}`;
const complete = (total: number) => `All ${total} steps done`;

const densities: Record<AiProgressDensity, string> = {
  // .ai-progress-line: 12.5px, 4px above and below, the icon 8px from its text.
  compact: 'gap-s3 py-s1 text-body-sm',
  comfortable: 'gap-s4 py-s2 text-input',
};

const svg = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

// Three shapes, so a state never rests on colour: a tick when done, a turning arc while running (it
// stands still under reduced motion and is still an open arc), and an empty ring while waiting.
function StepIcon({ status }: { status: AiStepStatus }) {
  if (status === 'done') {
    return (
      <svg
        {...svg}
        data-icon="check"
        strokeWidth="2.5"
        className="size-icon-xs shrink-0 text-good"
      >
        <path d="M3 8.5l3.2 3.2L13 4.5" />
      </svg>
    );
  }
  if (status === 'running') {
    return (
      <svg
        {...svg}
        data-icon="spinner"
        strokeWidth="2"
        className="size-icon-xs shrink-0 text-ai motion-safe:animate-spin"
      >
        <circle cx="8" cy="8" r="6" opacity="0.25" />
        <path d="M14 8a6 6 0 0 0-6-6" />
      </svg>
    );
  }
  return (
    <svg
      {...svg}
      data-icon="pending"
      strokeWidth="1.5"
      className="size-icon-xs shrink-0 text-ink-3"
    >
      <circle cx="8" cy="8" r="5" />
    </svg>
  );
}

function statusOf(
  step: string | AiProgressStep,
  index: number,
  currentIndex: number | undefined,
): AiStepStatus {
  if (typeof step !== 'string' && step.status) return step.status;
  if (currentIndex === undefined) return 'pending';
  if (index < currentIndex) return 'done';
  return index === currentIndex ? 'running' : 'pending';
}

// HOS AI's staged progress: the prototype's aiProgress lines ("Reading 12 nursing notes… ✓"), as an
// ordered list. The running step is aria-current="step"; each step says its state in words to a
// screen reader as well as by its icon; and a polite, visually hidden status keeps one line current
// ("Step 2 of 4: Reading the report"), then the summary once everything is done. The prototype
// shows a step only once it starts; Nova shows the waiting ones too, in the faint ink, so the whole
// plan is visible from the start.
export function AiProgressSteps({
  steps,
  currentIndex,
  density = 'compact',
  summary,
  label = 'HOS AI progress',
  showLabel = true,
  statusLabels = STATUS_LABELS,
  formatProgress = progress,
  formatComplete = complete,
  lang,
  className,
  ...rest
}: AiProgressStepsProps) {
  const labelId = useId();
  const resolved = steps.map((step, index) => ({
    label: typeof step === 'string' ? step : step.label,
    status: statusOf(step, index, currentIndex),
  }));
  const running = resolved.findIndex((step) => step.status === 'running');
  const allDone =
    resolved.length > 0 && resolved.every((step) => step.status === 'done');

  let announcement: ReactNode = '';
  if (allDone) announcement = summary ?? formatComplete(resolved.length);
  else if (running !== -1) {
    announcement = formatProgress(
      running + 1,
      resolved.length,
      resolved[running]?.label ?? '',
    );
  }

  const caption = (
    <p
      id={labelId}
      className="mb-s1 inline-flex items-center gap-s2 text-label font-semibold text-ai-deep"
    >
      <span aria-hidden="true" className="text-ai">
        ✦
      </span>
      {label}
    </p>
  );

  return (
    <div className={cx('flex flex-col', className)} {...rest}>
      {showLabel ? caption : <VisuallyHidden>{caption}</VisuallyHidden>}
      <ol aria-labelledby={labelId} lang={lang} data-density={density}>
        {resolved.map((step, index) => (
          <li
            key={index}
            data-status={step.status}
            aria-current={step.status === 'running' ? 'step' : undefined}
            className={cx(
              'flex items-center',
              densities[density],
              step.status === 'done' && 'text-ink',
              step.status === 'running' && 'text-ink-2',
              step.status === 'pending' && 'text-ink-3',
            )}
          >
            <StepIcon status={step.status} />
            <span>
              <VisuallyHidden>{`${statusLabels[step.status]}: `}</VisuallyHidden>
              {step.label}
            </span>
          </li>
        ))}
      </ol>
      {allDone && summary ? (
        <p className="mt-s1 text-label text-ink-2">{summary}</p>
      ) : null}
      <VisuallyHidden role="status" lang={lang}>
        {announcement}
      </VisuallyHidden>
    </div>
  );
}
