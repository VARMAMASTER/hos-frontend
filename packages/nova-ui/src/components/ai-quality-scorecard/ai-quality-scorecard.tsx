import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Banner } from '../banner/banner';
import { Button } from '../button/button';
import { Sparkline } from '../chart/sparkline';
import { Chip, type ChipTone } from '../chip/chip';
import { KpiTile } from '../kpi-tile/kpi-tile';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../table/table';

export type AiQualityStatus = 'healthy' | 'watch' | 'drift';
export type AiQualityMetric = 'approvedAsIs' | 'avgEdits' | 'rejected';

// One period's figures for a worker (or a whole fleet), measured against the human's final approved
// version. approvedAsIs and rejected are percentages (0–100); avgEdits is edits per draft.
export interface AiQualityMetrics {
  drafts: number;
  approvedAsIs: number;
  avgEdits: number;
  rejected: number;
}

// The caller's drift rule, per metric: the value at which a worker goes on Watch, and on Drift.
// approvedAsIs is worse when lower; avgEdits and rejected are worse when higher.
export interface AiQualityThreshold {
  metric: AiQualityMetric;
  watch: number;
  drift: number;
}

export interface AiQualityTripped {
  metric: AiQualityMetric;
  level: Exclude<AiQualityStatus, 'healthy'>;
  value: number;
  threshold: number;
  direction: 'below' | 'above';
}

const LOWER_IS_WORSE: Record<AiQualityMetric, boolean> = {
  approvedAsIs: true,
  avgEdits: false,
  rejected: false,
};

// The status the thresholds give: the worst level any metric reaches, and every metric that tripped.
export function aiQualityStatus(
  metrics: AiQualityMetrics,
  thresholds: readonly AiQualityThreshold[],
): { status: AiQualityStatus; tripped: AiQualityTripped[] } {
  const tripped: AiQualityTripped[] = [];
  for (const { metric, watch, drift } of thresholds) {
    const value = metrics[metric];
    const lower = LOWER_IS_WORSE[metric];
    const past = (line: number) => (lower ? value < line : value > line);
    const direction = lower ? 'below' : 'above';
    if (past(drift)) {
      tripped.push({
        metric,
        level: 'drift',
        value,
        threshold: drift,
        direction,
      });
    } else if (past(watch)) {
      tripped.push({
        metric,
        level: 'watch',
        value,
        threshold: watch,
        direction,
      });
    }
  }
  const status: AiQualityStatus = tripped.some((t) => t.level === 'drift')
    ? 'drift'
    : tripped.length > 0
      ? 'watch'
      : 'healthy';
  return { status, tripped };
}

const STATUS_WORDS: Readonly<Record<AiQualityStatus, string>> = {
  healthy: 'Healthy',
  watch: 'Watch',
  drift: 'Drift',
};

const statusTones: Record<AiQualityStatus, ChipTone> = {
  healthy: 'good',
  watch: 'warn',
  drift: 'crit',
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

// A shape per status: a tick in a circle, an eye, a falling arrow.
function StatusIcon({ status }: { status: AiQualityStatus }) {
  if (status === 'healthy') {
    return (
      <svg {...glyph}>
        <circle cx="10" cy="10" r="7.25" />
        <path d="M6.75 10.25l2.25 2.25 4.25-4.75" />
      </svg>
    );
  }
  if (status === 'watch') {
    return (
      <svg {...glyph}>
        <path d="M2.5 10s2.75-5 7.5-5 7.5 5 7.5 5-2.75 5-7.5 5-7.5-5-7.5-5z" />
        <circle cx="10" cy="10" r="2" />
      </svg>
    );
  }
  return (
    <svg {...glyph}>
      <path d="M3 5l5.5 5.5 3-3L17 13M17 8.5V13h-4.5" />
    </svg>
  );
}

export interface AiQualityStatusChipProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: AiQualityStatus;
  label?: string;
}

// Healthy, Watch or Drift: an icon and the word, in the status tone. For a scorecard, or a table of
// workers.
export function AiQualityStatusChip({
  status,
  label,
  ...rest
}: AiQualityStatusChipProps) {
  return (
    <Chip
      tone={statusTones[status]}
      data-status={status}
      icon={<StatusIcon status={status} />}
      {...rest}
    >
      {label ?? STATUS_WORDS[status]}
    </Chip>
  );
}

export interface AiCorrection {
  id: string;
  // The field or habit staff keep correcting. It also names the row's Open button.
  label: string;
  who?: ReactNode;
  count: number;
  timeLost?: ReactNode;
  // Shown instead of the Open action once it is dealt with: "Fixed 08 Jul".
  resolved?: ReactNode;
}

export interface AiRejectionReason {
  id: string;
  // The reason the human recorded.
  reason: ReactNode;
  count: number;
  worker?: ReactNode;
  // What was done about it, and by whom.
  outcome?: ReactNode;
}

export interface AiQualityTrendPoint {
  label: string;
  approvedAsIs: number;
}

export interface AiQualityScorecardLabels {
  metrics: Record<keyof AiQualityMetrics, string>;
  // The metric as the subject of a rule sentence, with its verb: "approved as-is is".
  ruleSubjects: Record<AiQualityMetric, string>;
  status: Record<AiQualityStatus, string>;
  formatRule: (
    thresholds: readonly AiQualityThreshold[],
    format: (metric: AiQualityMetric, value: number) => string,
  ) => string;
  driftTitle: (name: string) => string;
  formatTripped: (
    metric: string,
    value: string,
    direction: 'below' | 'above',
    level: string,
    threshold: string,
  ) => string;
  trend: (metric: string) => string;
  corrections: string;
  correction: string;
  who: string;
  times: string;
  timeLost: string;
  action: string;
  open: string;
  openName: (label: string) => string;
  rejections: string;
  reason: string;
  rejectionCount: string;
  worker: string;
  outcome: string;
  compare: string;
  here: (value: string) => string;
  fleet: (value: string) => string;
  atOrAbove: string;
  below: string;
}

const SUBJECTS: Record<AiQualityMetric, string> = {
  approvedAsIs: 'approved as-is is',
  avgEdits: 'average edits are',
  rejected: 'rejected is',
};

function defaultRule(
  thresholds: readonly AiQualityThreshold[],
  format: (metric: AiQualityMetric, value: number) => string,
  subjects: Record<AiQualityMetric, string> = SUBJECTS,
  status: Record<AiQualityStatus, string> = STATUS_WORDS,
): string {
  const level = (key: 'watch' | 'drift') =>
    `${status[key]} when ${thresholds
      .map(
        (t) =>
          `${subjects[t.metric]} ${LOWER_IS_WORSE[t.metric] ? 'below' : 'above'} ${format(t.metric, t[key])}`,
      )
      .join(' or ')}.`;
  return `Rule: ${level('watch')} ${level('drift')}`;
}

export const AI_QUALITY_SCORECARD_LABELS: Readonly<AiQualityScorecardLabels> = {
  metrics: {
    drafts: 'Drafts',
    approvedAsIs: 'Approved as-is',
    avgEdits: 'Average edits',
    rejected: 'Rejected',
  },
  ruleSubjects: SUBJECTS,
  status: STATUS_WORDS,
  formatRule: (thresholds, format) => defaultRule(thresholds, format),
  driftTitle: (name) => `Drift alert — ${name}`,
  formatTripped: (metric, value, direction, level, threshold) =>
    `${metric} ${value} is ${direction} the ${level.toLowerCase()} threshold of ${threshold}.`,
  trend: (metric) => `${metric}, trend`,
  corrections: 'What your staff keep correcting',
  correction: 'Correction',
  who: 'Who',
  times: 'Times',
  timeLost: 'Est. time lost',
  action: 'Action',
  open: 'Open',
  openName: (label) => `Open: ${label}`,
  rejections: 'Rejection reasons',
  reason: 'Reason the human recorded',
  rejectionCount: 'Rejections',
  worker: 'Worker',
  outcome: 'What was done',
  compare: 'Compared with the fleet',
  here: (value) => `${value} here`,
  fleet: (value) => `${value} fleet`,
  atOrAbove: 'At or above the fleet',
  below: 'Below the fleet',
};

export interface AiQualityScorecardProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  // The worker (or "All AI workers") the card scores.
  name: string;
  description?: ReactNode;
  metrics: AiQualityMetrics;
  // The caller's drift rule. The card applies it and says what it is.
  thresholds: readonly AiQualityThreshold[];
  // Approved as-is over time, drawn as a sparkline beside the figure.
  trend?: readonly AiQualityTrendPoint[];
  // The fleet's figure, for the compare-to-fleet bar.
  fleet?: { approvedAsIs: number };
  // How far below the fleet (in points) turns the bar from warn to crit.
  fleetGap?: number;
  // The caller's explanation and its action (re-ground, restrict), inside the drift alert.
  driftMessage?: ReactNode;
  driftAction?: ReactNode;
  corrections?: readonly AiCorrection[];
  onOpenCorrection?: (id: string) => void;
  rejections?: readonly AiRejectionReason[];
  // Number formatting (grouping), en-IN by default.
  locale?: string;
  headingLevel?: 2 | 3;
  labels?: Partial<
    Omit<AiQualityScorecardLabels, 'metrics' | 'status' | 'ruleSubjects'>
  > & {
    metrics?: Partial<AiQualityScorecardLabels['metrics']>;
    status?: Partial<AiQualityScorecardLabels['status']>;
    ruleSubjects?: Partial<AiQualityScorecardLabels['ruleSubjects']>;
  };
  // The language of the caller's text (te, hi, en).
  contentLang?: string;
}

const PERCENT: Record<AiQualityMetric, boolean> = {
  approvedAsIs: true,
  avgEdits: false,
  rejected: true,
};

const barTones = {
  good: 'bg-good',
  warn: 'bg-warn',
  crit: 'bg-crit',
} as const;

const clamp = (value: number) => Math.min(100, Math.max(0, value));

// How good a worker's drafts are, the way a hospital audits its AI (11-administration.html, AI
// Quality; 17-tenant.html, AI for this tenant). The four figures, measured against the human's final
// version; Healthy, Watch or Drift from the caller's rule, with the rule stated; a drift alert when
// it drifts; the fleet comparison; what staff keep correcting; and the reasons drafts were refused.
// Every table and figure is on the opaque data surface.
export function AiQualityScorecard({
  name,
  description,
  metrics,
  thresholds,
  trend,
  fleet,
  fleetGap = 6,
  driftMessage,
  driftAction,
  corrections,
  onOpenCorrection,
  rejections,
  locale = 'en-IN',
  headingLevel = 2,
  labels,
  contentLang,
  className,
  ...rest
}: AiQualityScorecardProps) {
  const ruleSubjects = {
    ...AI_QUALITY_SCORECARD_LABELS.ruleSubjects,
    ...labels?.ruleSubjects,
  };
  const status = { ...AI_QUALITY_SCORECARD_LABELS.status, ...labels?.status };
  const words: AiQualityScorecardLabels = {
    ...AI_QUALITY_SCORECARD_LABELS,
    formatRule: (list, format) =>
      defaultRule(list, format, ruleSubjects, status),
    ...labels,
    metrics: { ...AI_QUALITY_SCORECARD_LABELS.metrics, ...labels?.metrics },
    status,
    ruleSubjects,
  };
  const headingId = useId();
  const Heading = `h${headingLevel}` as const;
  const SubHeading = `h${headingLevel + 1}` as 'h3' | 'h4';

  const number = (value: number, digits: [number, number]) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits[0],
      maximumFractionDigits: digits[1],
    }).format(value);
  // A figure: one decimal place. A threshold: as written.
  const figure = (metric: AiQualityMetric, value: number) =>
    `${number(value, [1, 1])}${PERCENT[metric] ? '%' : ''}`;
  const line = (metric: AiQualityMetric, value: number) =>
    `${number(value, [0, 2])}${PERCENT[metric] ? '%' : ''}`;

  const { status: current, tripped } = aiQualityStatus(metrics, thresholds);
  const drifted = tripped.filter((t) => t.level === 'drift');

  const fleetTone: keyof typeof barTones | undefined = fleet
    ? metrics.approvedAsIs >= fleet.approvedAsIs
      ? 'good'
      : fleet.approvedAsIs - metrics.approvedAsIs > fleetGap
        ? 'crit'
        : 'warn'
    : undefined;

  return (
    <section
      aria-labelledby={headingId}
      data-status={current}
      className={cx('flex flex-col gap-s6', className)}
      {...rest}
    >
      <header className="flex flex-col gap-s1">
        <div className="flex flex-wrap items-center gap-s3">
          <Heading
            id={headingId}
            className="font-display text-subtitle font-semibold tracking-h3 text-ink"
          >
            {name}
          </Heading>
          <AiQualityStatusChip
            status={current}
            label={words.status[current]}
            data-status-chip=""
          />
        </div>
        {description ? (
          <p lang={contentLang} className="text-label text-ink-2">
            {description}
          </p>
        ) : null}
        <p data-rule="" className="text-caption text-ink-2">
          {words.formatRule(thresholds, line)}
        </p>
      </header>

      {current === 'drift' ? (
        <Banner tone="crit" title={words.driftTitle(name)} action={driftAction}>
          {drifted.map((t) => (
            <p key={t.metric}>
              {words.formatTripped(
                words.metrics[t.metric],
                figure(t.metric, t.value),
                t.direction,
                words.status.drift,
                line(t.metric, t.threshold),
              )}
            </p>
          ))}
          {driftMessage ? (
            <p lang={contentLang} className="mt-s1 font-normal">
              {driftMessage}
            </p>
          ) : null}
        </Banner>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(var(--nova-scorecard-cell-min-w),1fr))] gap-s5">
        <KpiTile
          label={words.metrics.drafts}
          value={number(metrics.drafts, [0, 0])}
        />
        <KpiTile
          label={words.metrics.approvedAsIs}
          value={figure('approvedAsIs', metrics.approvedAsIs)}
          visual={
            trend && trend.length > 1 ? (
              <Sparkline
                ariaLabel={words.trend(words.metrics.approvedAsIs)}
                data={trend.map((point) => ({ ...point }))}
                config={{
                  approvedAsIs: {
                    label: words.metrics.approvedAsIs,
                    color: 'chart-1',
                  },
                }}
                categoryKey="label"
                seriesKeys={['approvedAsIs']}
                valueFormatter={(value) => figure('approvedAsIs', value)}
                height={40}
              />
            ) : undefined
          }
        />
        <KpiTile
          label={words.metrics.avgEdits}
          value={figure('avgEdits', metrics.avgEdits)}
        />
        <KpiTile
          label={words.metrics.rejected}
          value={figure('rejected', metrics.rejected)}
        />
      </div>

      {fleet && fleetTone ? (
        <div
          data-compare=""
          className="flex flex-wrap items-center gap-s5 text-body-sm text-ink"
        >
          <span className="min-w-0 flex-1 font-semibold">{words.compare}</span>
          <span
            data-bar=""
            aria-hidden="true"
            className="relative h-s3 min-w-(--nova-scorecard-bar-min-w) flex-1 rounded-full border border-border bg-surface-2"
          >
            <span
              className={cx('block h-full rounded-full', barTones[fleetTone])}
              style={{ width: `${clamp(metrics.approvedAsIs)}%` }}
            />
            <span
              className="absolute -inset-y-s1 w-s0 bg-ink"
              style={{ left: `${clamp(fleet.approvedAsIs)}%` }}
            />
          </span>
          <span className="font-mono text-label whitespace-nowrap">
            {words.here(figure('approvedAsIs', metrics.approvedAsIs))}
            <span className="text-ink-2">
              {' / '}
              {words.fleet(figure('approvedAsIs', fleet.approvedAsIs))}
            </span>
          </span>
          <span
            className={cx(
              'text-caption font-semibold',
              fleetTone === 'good' ? 'text-good-deep' : 'text-crit-deep',
            )}
          >
            {fleetTone === 'good' ? words.atOrAbove : words.below}
          </span>
        </div>
      ) : null}

      {corrections && corrections.length > 0 ? (
        <div className="flex flex-col gap-s3">
          <SubHeading className="font-display text-input font-semibold text-ink">
            {words.corrections}
          </SubHeading>
          <Table caption={words.corrections} density="compact">
            <TableHead>
              <TableRow>
                <TableHeaderCell>{words.correction}</TableHeaderCell>
                <TableHeaderCell>{words.who}</TableHeaderCell>
                <TableHeaderCell numeric>{words.times}</TableHeaderCell>
                <TableHeaderCell numeric>{words.timeLost}</TableHeaderCell>
                <TableHeaderCell align="right">{words.action}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {corrections.map((row) => (
                <TableRow key={row.id}>
                  <TableCell lang={contentLang}>{row.label}</TableCell>
                  <TableCell>{row.who}</TableCell>
                  <TableCell numeric>{number(row.count, [0, 0])}</TableCell>
                  <TableCell numeric>{row.timeLost}</TableCell>
                  <TableCell align="right">
                    {row.resolved ? (
                      <Chip tone="good">{row.resolved}</Chip>
                    ) : onOpenCorrection ? (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={words.openName(row.label)}
                        onClick={() => onOpenCorrection(row.id)}
                      >
                        {words.open}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {rejections && rejections.length > 0 ? (
        <div className="flex flex-col gap-s3">
          <SubHeading className="font-display text-input font-semibold text-ink">
            {words.rejections}
          </SubHeading>
          <Table caption={words.rejections} density="compact">
            <TableHead>
              <TableRow>
                <TableHeaderCell>{words.reason}</TableHeaderCell>
                <TableHeaderCell numeric>
                  {words.rejectionCount}
                </TableHeaderCell>
                <TableHeaderCell>{words.worker}</TableHeaderCell>
                <TableHeaderCell>{words.outcome}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rejections.map((row) => (
                <TableRow key={row.id}>
                  <TableCell lang={contentLang}>{row.reason}</TableCell>
                  <TableCell numeric>{number(row.count, [0, 0])}</TableCell>
                  <TableCell className="text-label text-ink-2">
                    {row.worker}
                  </TableCell>
                  <TableCell className="text-label text-ink-2">
                    {row.outcome}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
