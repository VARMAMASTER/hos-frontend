import { useId, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import {
  AiProgressSteps,
  type AiProgressStep,
} from '../ai-progress-steps/ai-progress-steps';
import { Button } from '../button/button';
import { Chip, type ChipTone } from '../chip/chip';
import {
  ReasonDialog,
  type ReasonDialogLabels,
} from '../fleet-kill-switch/reason-dialog';

export type ChangeGateStatus = 'pass' | 'fail' | 'running' | 'not-run';

export interface ChangeGateCheck {
  id: string;
  // The suite: "Negation handling · 120 synthetic cases".
  name: string;
  // The measured figure, once run: "94%".
  result?: string;
  // The bar it is held to: "≥ 90%".
  threshold: string;
  status: ChangeGateStatus;
  // On a failing check, what failed.
  failure?: ReactNode;
}

// The promotion and the person behind it.
export interface ChangeGatePromotion {
  by: string;
  at: string;
  reason: string;
}

export interface AlgorithmChangeGateLabels {
  checks: string;
  pass: string;
  fail: string;
  running: string;
  notRun: string;
  passed: (passed: number, total: number) => string;
  notPassed: (passed: number, total: number) => string;
  locked: (counts: {
    failed: number;
    notRun: number;
    running: number;
  }) => string;
  run: string;
  progress: string;
  promotionTitle: (promoteLabel: string, title: string) => string;
  formatRecord: (promotion: ChangeGatePromotion) => string;
  reasonPrefix: string;
  dialog?: Partial<ReasonDialogLabels>;
}

export const ALGORITHM_CHANGE_GATE_LABELS: Readonly<AlgorithmChangeGateLabels> =
  {
    checks: 'Checks',
    pass: 'Pass',
    fail: 'Fail',
    running: 'Running',
    notRun: 'Not run',
    passed: (passed, total) => `Gate passed · ${passed} of ${total}`,
    notPassed: (passed, total) => `Gate not passed · ${passed} of ${total}`,
    locked: ({ failed, notRun, running }) => {
      const parts = [
        failed > 0 ? `${failed} failed` : '',
        notRun > 0 ? `${notRun} not run` : '',
        running > 0 ? `${running} running` : '',
      ].filter((part) => part !== '');
      return `Locked until every check passes: ${parts.join(', ')}.`;
    },
    run: 'Run evaluation suite',
    progress: 'Evaluation progress',
    promotionTitle: (promoteLabel, title) => `${promoteLabel}: ${title}`,
    formatRecord: (promotion) =>
      `Promoted by ${promotion.by} · ${promotion.at}`,
    reasonPrefix: 'Reason:',
  };

export interface AlgorithmChangeGateProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  // The change: "AI Scribe v4.2 → v4.3". A string, as it also titles the promotion dialog.
  title: string;
  description?: ReactNode;
  checks: readonly ChangeGateCheck[];
  // While a check runs: the harness's steps, shown with AiProgressSteps.
  progressSteps?: ReadonlyArray<string | AiProgressStep>;
  progressIndex?: number;
  onRun?: () => void;
  promoteLabel?: string;
  // Called with the reason once a passing gate is promoted.
  onPromote?: (reason: string) => void;
  promotion?: ChangeGatePromotion | null;
  defaultPromotion?: ChangeGatePromotion | null;
  onPromotionChange?: (promotion: ChangeGatePromotion) => void;
  // The person promoting, recorded with it.
  actor: string;
  now?: () => Date;
  formatTime?: (date: Date) => string;
  minReasonLength?: number;
  headingLevel?: 2 | 3;
  labels?: Partial<AlgorithmChangeGateLabels>;
}

const checkTones: Record<ChangeGateStatus, ChipTone> = {
  pass: 'good',
  fail: 'crit',
  running: 'info',
  'not-run': 'neutral',
};

const glyph = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

// A shape per result: a tick, a cross, a turning arc (still under reduced motion), an empty ring.
function CheckIcon({ status }: { status: ChangeGateStatus }) {
  if (status === 'pass') {
    return (
      <svg {...glyph}>
        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
      </svg>
    );
  }
  if (status === 'fail') {
    return (
      <svg {...glyph}>
        <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
      </svg>
    );
  }
  if (status === 'running') {
    return (
      <svg {...glyph} className="motion-safe:animate-spin">
        <path d="M16 10a6 6 0 1 1-2-4.47" />
      </svg>
    );
  }
  return (
    <svg {...glyph}>
      <circle cx="10" cy="10" r="6" />
    </svg>
  );
}

const timeFormat = (date: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

// The Algorithm Change Protocol as a gate, not a note (12-superadmin.html): the synthetic-case
// checks with each result against its bar, a Pass / Fail / Running / Not run chip, and what failed;
// and a Promote button that stays locked (aria-disabled, with the reason it is locked) until every
// check passes. Promoting asks for a written reason, and the promotion is shown with who, when and
// why.
export function AlgorithmChangeGate({
  title,
  description,
  checks,
  progressSteps,
  progressIndex,
  onRun,
  promoteLabel = 'Promote',
  onPromote,
  promotion: promotionProp,
  defaultPromotion = null,
  onPromotionChange,
  actor,
  now = () => new Date(),
  formatTime = timeFormat,
  minReasonLength = 15,
  headingLevel = 2,
  labels,
  className,
  ...rest
}: AlgorithmChangeGateProps) {
  const words = { ...ALGORITHM_CHANGE_GATE_LABELS, ...labels };
  const ids = useId();
  const headingId = `${ids}-title`;
  const lockedId = `${ids}-locked`;
  const Heading = `h${headingLevel}` as const;
  const [asking, setAsking] = useState(false);
  const [promotion, setPromotion] =
    useControllableState<ChangeGatePromotion | null>({
      value: promotionProp,
      defaultValue: defaultPromotion,
      onChange: (next) => {
        if (next) onPromotionChange?.(next);
      },
    });

  const count = (status: ChangeGateStatus) =>
    checks.filter((check) => check.status === status).length;
  const passed = count('pass');
  const open = checks.length > 0 && passed === checks.length;
  const running = count('running');

  function confirm(reason: string) {
    setAsking(false);
    setPromotion({ by: actor, at: formatTime(now()), reason });
    onPromote?.(reason);
  }

  return (
    <section
      aria-labelledby={headingId}
      data-gate={open ? 'open' : 'locked'}
      className={cx('flex flex-col gap-3', className)}
      {...rest}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Heading
          id={headingId}
          className="font-display text-[13.5px] font-bold text-ink"
        >
          {title}
        </Heading>
        <Chip
          tone={open ? 'good' : count('fail') > 0 ? 'crit' : 'warn'}
          data-gate-summary=""
        >
          {open
            ? words.passed(passed, checks.length)
            : words.notPassed(passed, checks.length)}
        </Chip>
      </div>
      {description ? (
        <p className="text-[12px] text-ink-2">{description}</p>
      ) : null}
      {running > 0 && progressSteps && progressSteps.length > 0 ? (
        <AiProgressSteps
          steps={progressSteps}
          currentIndex={progressIndex}
          label={words.progress}
        />
      ) : null}
      <ul aria-label={words.checks}>
        {checks.map((check) => (
          <li
            key={check.id}
            data-status={check.status}
            // The prototype's .gate-row: 12.5px, 8px above and below, 10px apart, a hairline under.
            className="flex flex-wrap items-start gap-2.5 border-b border-border py-2 text-[12.5px] text-ink last:border-b-0"
          >
            <Chip
              tone={checkTones[check.status]}
              data-check-status=""
              icon={<CheckIcon status={check.status} />}
            >
              {check.status === 'pass'
                ? words.pass
                : check.status === 'fail'
                  ? words.fail
                  : check.status === 'running'
                    ? words.running
                    : words.notRun}
            </Chip>
            <div className="min-w-0 flex-1">
              <p>{check.name}</p>
              {check.status === 'fail' && check.failure ? (
                <p className="mt-0.5 text-[12px] text-crit-deep">
                  {check.failure}
                </p>
              ) : null}
            </div>
            <span className="font-mono text-[11.5px] whitespace-nowrap text-ink-2">
              {check.result
                ? `${check.result} (${check.threshold})`
                : `(${check.threshold})`}
            </span>
          </li>
        ))}
      </ul>
      {promotion ? (
        <div data-record="" className="text-[12px] text-ink-2">
          <p className="font-semibold text-ink">
            {words.formatRecord(promotion)}
          </p>
          <p>
            {`${words.reasonPrefix} `}
            <q>{promotion.reason}</q>
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {onRun ? (
            <Button
              variant="outline"
              size="sm"
              loading={running > 0}
              onClick={onRun}
            >
              {words.run}
            </Button>
          ) : null}
          <Button
            variant="ai"
            size="sm"
            aria-disabled={open ? undefined : true}
            aria-describedby={open ? undefined : lockedId}
            onClick={() => setAsking(true)}
          >
            {promoteLabel}
          </Button>
          {open ? null : (
            <p id={lockedId} className="text-[12px] text-ink-2">
              {words.locked({
                failed: count('fail'),
                notRun: count('not-run'),
                running,
              })}
            </p>
          )}
        </div>
      )}
      <ReasonDialog
        open={asking}
        onCancel={() => setAsking(false)}
        onConfirm={confirm}
        danger={false}
        title={words.promotionTitle(promoteLabel, title)}
        confirmLabel={promoteLabel}
        minLength={minReasonLength}
        labels={words.dialog}
      />
    </section>
  );
}
