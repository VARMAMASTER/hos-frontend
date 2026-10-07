import {
  Children,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { AiClassChip, type AiTier } from '../ai-class-chip/ai-class-chip';
import { Chip } from '../chip/chip';
import { StatusDot, type StatusDotTone } from '../status-dot/status-dot';
import { Switch } from '../switch/switch';

// What the worker is doing now. A worker that is switched off is shown as paused, whatever this says.
export type WorkerStatus = 'idle' | 'working' | 'paused' | 'error';

export interface WorkerCardLabels {
  // Read before the name, for assistive technology: the spark is hidden from it.
  aiWorker: string;
  // The switch's visible word (the prototype's .sw-l).
  switchLabel: string;
  live: string;
  off: string;
  status: Record<WorkerStatus, string>;
}

export const WORKER_CARD_LABELS: Readonly<WorkerCardLabels> = {
  aiWorker: 'AI worker',
  switchLabel: 'On',
  live: 'Live',
  off: 'Off',
  status: {
    idle: 'idle',
    working: 'working…',
    paused: 'paused',
    error: 'error',
  },
};

export interface WorkerCardProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title' | 'role'> {
  // The worker's name: "WhatsApp Assistant". It names the card and the switch.
  name: string;
  // What it does and for whom: "Front desk · Te/En/Hi".
  role?: ReactNode;
  // The one "today" figure: "23 chats answered · 14 bookings today".
  stat?: ReactNode;
  // A quiet line under the stat: where the full stats live.
  hint?: ReactNode;
  status?: WorkerStatus;
  // Shown under the status line when the status is error.
  errorMessage?: ReactNode;
  // Controlled when given: the card reports through onEnabledChange and the parent decides.
  enabled?: boolean;
  defaultEnabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  // Asked before the worker is switched off (turning on never asks). Resolve true to go ahead; the
  // switch stays on until it does. A FleetKillSwitch reason dialog is the usual answer.
  confirmDisable?: () => boolean | Promise<boolean>;
  // The worker's regulatory class. A RED worker can never be switched on: its switch is locked off.
  tier?: AiTier;
  tierDetail?: string;
  headingLevel?: 2 | 3 | 4;
  labels?: Partial<Omit<WorkerCardLabels, 'status'>> & {
    status?: Partial<Record<WorkerStatus, string>>;
  };
  // The language of the role, stat and hint (te, hi, en).
  contentLang?: string;
}

const statusTones: Record<WorkerStatus, StatusDotTone> = {
  idle: 'neutral',
  working: 'good',
  paused: 'neutral',
  error: 'crit',
};

// One AI worker at a glance: the prototype's .worker-mini (10-ai-workforce.html). A card with the AI
// top edge (3px, the AI mark colour), the spark and the name, its role, one figure for today, a polite
// status line (idle, working… with a pulsing dot, paused, error), and the On switch beside the Live
// chip. Switching it off can be gated by confirmDisable; the switch is named with the worker's name.
export function WorkerCard({
  name,
  role,
  stat,
  hint,
  status = 'idle',
  errorMessage,
  enabled,
  defaultEnabled = true,
  onEnabledChange,
  confirmDisable,
  tier,
  tierDetail,
  headingLevel = 3,
  labels,
  contentLang,
  className,
  ...rest
}: WorkerCardProps) {
  const words = {
    ...WORKER_CARD_LABELS,
    ...labels,
    status: { ...WORKER_CARD_LABELS.status, ...labels?.status },
  };
  const headingId = useId();
  const Heading = `h${headingLevel}` as const;
  const locked = tier === 'red';
  const [isOn, setOn] = useControllableState({
    value: enabled,
    defaultValue: defaultEnabled,
    onChange: onEnabledChange,
  });
  const on = isOn && !locked;
  // One confirmation at a time: a second press while the first is open does not ask twice.
  const asking = useRef(false);

  async function handleChange(next: boolean) {
    if (next || !confirmDisable) {
      setOn(next);
      return;
    }
    if (asking.current) return;
    asking.current = true;
    try {
      if (await confirmDisable()) setOn(false);
    } finally {
      asking.current = false;
    }
  }

  const shown: WorkerStatus = on ? status : 'paused';

  return (
    <article
      aria-labelledby={headingId}
      data-status={shown}
      data-enabled={on ? 'true' : 'false'}
      className={cx(
        // .worker-mini: the panel, the line edge with the 3px AI top edge, radius md, shadow-sm,
        // 16px by 16px (12px below), 10px between its parts.
        'flex h-full flex-col gap-s4 rounded-card border border-t-rail border-border border-t-ai bg-surface px-card pt-card pb-s5 shadow-sm',
        className,
      )}
      {...rest}
    >
      <div className="flex items-start gap-s3">
        <span aria-hidden="true" data-spark="" className="nova-ai-spark">
          ✦
        </span>
        <div className="min-w-0">
          <Heading
            id={headingId}
            className="font-display text-input leading-tight font-bold text-ink"
          >
            <VisuallyHidden>{`${words.aiWorker}:`}</VisuallyHidden> {name}
          </Heading>
          {role ? (
            <p lang={contentLang} className="mt-px text-meta text-ink-2">
              {role}
            </p>
          ) : null}
        </div>
      </div>
      {tier ? <AiClassChip tier={tier} detail={tierDetail} /> : null}
      {stat ? (
        <p
          lang={contentLang}
          className="rounded-control border border-border bg-surface-2 px-s4 py-s3 text-body-sm text-ink tabular-nums"
        >
          {stat}
        </p>
      ) : null}
      {hint ? (
        <p lang={contentLang} className="text-meta text-ink-3">
          {hint}
        </p>
      ) : null}
      <div role="status" className="text-meta">
        <VisuallyHidden>{`${name}: `}</VisuallyHidden>
        <StatusDot
          tone={statusTones[shown]}
          pulse={shown === 'working'}
          label={
            <span
              className={cx(
                'text-meta',
                shown === 'working' && 'font-bold text-ai-deep',
                shown === 'error' && 'font-semibold text-crit-deep',
                (shown === 'idle' || shown === 'paused') && 'text-ink-3',
              )}
            >
              {words.status[shown]}
            </span>
          }
        />
      </div>
      {shown === 'error' && errorMessage ? (
        <p className="text-meta text-crit-deep">{errorMessage}</p>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-s3">
        <Switch
          checked={on}
          disabled={locked}
          onCheckedChange={(next) => void handleChange(next)}
          label={
            <>
              <VisuallyHidden>{name}</VisuallyHidden>{' '}
              <span
                className={cx(
                  'text-meta font-semibold',
                  on ? 'text-ai-deep' : 'text-ink-2',
                )}
              >
                {words.switchLabel}
              </span>
            </>
          }
        />
        <span data-live="">
          {on ? (
            <Chip tone="good" icon={<LiveMark />}>
              {words.live}
            </Chip>
          ) : (
            <Chip tone="neutral">{words.off}</Chip>
          )}
        </span>
      </div>
    </article>
  );
}

// The chip's dot (the prototype's .dot-good), drawn in the chip's own ink.
function LiveMark() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="5" />
    </svg>
  );
}

export interface WorkerGridProps extends HTMLAttributes<HTMLUListElement> {
  children?: ReactNode;
}

// The workers side by side: the prototype's .worker-grid (five equal columns, 12px apart), made
// responsive: as many columns of at least 13rem as fit. A list, so a screen reader hears how many.
export function WorkerGrid({ children, className, ...rest }: WorkerGridProps) {
  return (
    <ul
      role="list"
      className={cx(
        'grid grid-cols-[repeat(auto-fill,minmax(var(--nova-worker-card-min-w),1fr))] gap-s5',
        className,
      )}
      {...rest}
    >
      {Children.toArray(children).map((child, index) => (
        <li key={index} className="flex min-w-0 flex-col">
          {child}
        </li>
      ))}
    </ul>
  );
}
