import { useId, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { AiClassChip, type AiTier } from '../ai-class-chip/ai-class-chip';
import { Button } from '../button/button';
import { Chip, type ChipStyleTone } from '../chip/chip';
import { Switch } from '../switch/switch';
import { ReasonDialog, type ReasonDialogLabels } from './reason-dialog';

// Who an off switch reaches: every tenant running the worker, or one hospital.
export type KillSwitchScope = 'fleet' | 'tenant';
export type KillSwitchState = 'enabled' | 'disabled' | 'rolling-back';

// A change and the person behind it: who, when and why. Shown beside the switch, and the caller's to
// store (it is never kept by the component beyond its own state).
export interface KillSwitchRecord {
  action: 'disabled' | 'enabled';
  by: string;
  at: string;
  reason: string;
}

export interface FleetKillSwitchLabels {
  fleetWide: string;
  forTenant: (name: string) => string;
  thisTenant: string;
  switchName: (worker: string, scope: string) => string;
  enabled: string;
  disabled: (scope: string) => string;
  rollingBack: string;
  locked: string;
  whyBlocked: string;
  rollBack: string;
  disableTitle: (worker: string, scope: string) => string;
  disableConfirm: (scope: string) => string;
  rollbackTitle: (worker: string, scope: string) => string;
  rollbackConfirm: (scope: string) => string;
  formatRecord: (record: KillSwitchRecord, scope: string) => string;
  reasonPrefix: string;
  dialog?: Partial<ReasonDialogLabels>;
}

export const FLEET_KILL_SWITCH_LABELS: Readonly<FleetKillSwitchLabels> = {
  fleetWide: 'fleet-wide',
  forTenant: (name) => `for ${name}`,
  thisTenant: 'this tenant',
  switchName: (worker, scope) => `${worker} enabled ${scope}`,
  enabled: 'Enabled',
  disabled: (scope) => `Disabled ${scope}`,
  rollingBack: 'Rolling back…',
  locked: 'Locked',
  whyBlocked: 'Why blocked',
  rollBack: 'Roll back',
  disableTitle: (worker, scope) => `Disable ${worker} ${scope}`,
  disableConfirm: (scope) => `Disable ${scope}`,
  rollbackTitle: (worker, scope) => `Re-enable ${worker} ${scope}`,
  rollbackConfirm: (scope) => `Re-enable ${scope}`,
  formatRecord: (record, scope) =>
    `${record.action === 'disabled' ? 'Disabled' : 'Re-enabled'} ${scope} by ${record.by} · ${record.at}`,
  reasonPrefix: 'Reason:',
};

export interface FleetKillSwitchProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  // The AI worker: "Discharge Drafter".
  worker: string;
  // What it does: "Discharge summaries".
  description?: ReactNode;
  scope: KillSwitchScope;
  // The hospital, at tenant scope.
  scopeName?: string;
  // What switching it off stops, stated in the dialog: "Stops 14 hospitals' discharge drafts".
  impact: ReactNode | readonly ReactNode[];
  // What re-enabling it does, stated in the rollback dialog.
  rollbackImpact?: ReactNode | readonly ReactNode[];
  tier?: AiTier;
  tierDetail?: string;
  // A locked row cannot be switched at all. RED tier is always locked.
  locked?: boolean;
  // Why it is locked, behind "Why blocked".
  lockedReason?: ReactNode;
  state?: KillSwitchState;
  defaultState?: KillSwitchState;
  onStateChange?: (state: KillSwitchState) => void;
  record?: KillSwitchRecord | null;
  defaultRecord?: KillSwitchRecord | null;
  onRecordChange?: (record: KillSwitchRecord) => void;
  // The person acting, recorded with every change.
  actor: string;
  now?: () => Date;
  formatTime?: (date: Date) => string;
  minReasonLength?: number;
  // Called with the reason once it is confirmed. A promise from onRollback holds the row in
  // "rolling back" until it settles (and back to disabled if it fails).
  onDisable?: (reason: string) => void | Promise<void>;
  onRollback?: (reason: string) => void | Promise<void>;
  labels?: Partial<FleetKillSwitchLabels>;
  headingLevel?: 3 | 4;
}

const stateTones: Record<KillSwitchState | 'locked', ChipStyleTone> = {
  enabled: 'good',
  disabled: 'crit',
  'rolling-back': 'info',
  locked: 'crit',
};

const timeFormat = (date: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

const glyph = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

// A shape per state: a power symbol on, a power symbol struck through off, a turning arc rolling
// back (still under reduced motion), a padlock locked.
function StateIcon({ state }: { state: KillSwitchState | 'locked' }) {
  if (state === 'locked') {
    return (
      <svg {...glyph}>
        <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
        <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
      </svg>
    );
  }
  if (state === 'rolling-back') {
    return (
      <svg {...glyph} className="motion-safe:animate-spin">
        <path d="M16 10a6 6 0 1 1-2-4.47" />
      </svg>
    );
  }
  return (
    <svg {...glyph}>
      <path d="M10 3v6" />
      <path d="M6 5.5a6 6 0 1 0 8 0" />
      {state === 'disabled' ? <path d="M3.5 16.5l13-13" /> : null}
    </svg>
  );
}

type DialogMode = 'disable' | 'rollback' | null;

// The fleet (or tenant) kill switch for one AI worker (12-superadmin.html, AI fleet control;
// 17-tenant.html, AI for this tenant). Turning it off opens a reason dialog that states the impact
// and will not confirm without a written reason; the change is then shown with who, when and why,
// and a rollback (gated the same way) is offered. A RED-tier row is locked: the switch is disabled
// and "Why blocked" says why. Nothing here calls a network: it records and calls back.
export function FleetKillSwitch({
  worker,
  description,
  scope,
  scopeName,
  impact,
  rollbackImpact,
  tier,
  tierDetail,
  locked: lockedProp,
  lockedReason,
  state: stateProp,
  defaultState = 'enabled',
  onStateChange,
  record: recordProp,
  defaultRecord = null,
  onRecordChange,
  actor,
  now = () => new Date(),
  formatTime = timeFormat,
  minReasonLength = 15,
  onDisable,
  onRollback,
  labels,
  headingLevel = 3,
  className,
  ...rest
}: FleetKillSwitchProps) {
  const words = { ...FLEET_KILL_SWITCH_LABELS, ...labels };
  const ids = useId();
  const headingId = `${ids}-name`;
  const reasonId = `${ids}-why`;
  const Heading = `h${headingLevel}` as const;
  const locked = lockedProp ?? tier === 'red';
  const scopeWords =
    scope === 'fleet'
      ? words.fleetWide
      : words.forTenant(scopeName ?? words.thisTenant);

  const [state, setState] = useControllableState<KillSwitchState>({
    value: stateProp,
    defaultValue: defaultState,
    onChange: onStateChange,
  });
  const [record, setRecord] = useControllableState<KillSwitchRecord | null>({
    value: recordProp,
    defaultValue: defaultRecord,
    onChange: (next) => {
      if (next) onRecordChange?.(next);
    },
  });
  const [mode, setMode] = useState<DialogMode>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  const shown: KillSwitchState | 'locked' = locked ? 'locked' : state;
  const on = !locked && state !== 'disabled';

  function stamp(action: KillSwitchRecord['action'], reason: string) {
    setRecord({ action, by: actor, at: formatTime(now()), reason });
  }

  function confirm(reason: string) {
    const current = mode;
    setMode(null);
    if (current === 'disable') {
      stamp('disabled', reason);
      setState('disabled');
      void onDisable?.(reason);
      return;
    }
    const previous = record;
    stamp('enabled', reason);
    const result = onRollback?.(reason);
    if (result instanceof Promise) {
      setState('rolling-back');
      result.then(
        () => setState('enabled'),
        () => {
          setRecord(previous);
          setState('disabled');
        },
      );
    } else {
      setState('enabled');
    }
  }

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      data-state={shown}
      className={cx(
        'flex flex-wrap items-start gap-x-s6 gap-y-s3 border-b border-border py-s5 text-body-sm last:border-b-0',
        className,
      )}
      {...rest}
    >
      <div className="min-w-(--nova-ai-column-min-w) flex-1">
        <div className="flex flex-wrap items-center gap-s3">
          <Heading
            id={headingId}
            className="font-display text-input font-bold text-ink"
          >
            {worker}
          </Heading>
          {tier ? <AiClassChip tier={tier} detail={tierDetail} /> : null}
        </div>
        {description ? (
          <p className="mt-px text-caption text-ink-2">{description}</p>
        ) : null}
        {record && !locked ? (
          <div data-record="" className="mt-s2 text-label text-ink-2">
            <p className="font-semibold text-ink">
              {words.formatRecord(record, scopeWords)}
            </p>
            <p>
              {`${words.reasonPrefix} `}
              <q>{record.reason}</q>
            </p>
          </div>
        ) : null}
        {locked && lockedReason ? (
          <p
            id={reasonId}
            hidden={!whyOpen}
            className="mt-s2 text-label text-crit-deep"
          >
            {lockedReason}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-s3">
        <Chip tone={stateTones[shown]} icon={<StateIcon state={shown} />}>
          {shown === 'locked'
            ? words.locked
            : shown === 'enabled'
              ? words.enabled
              : shown === 'disabled'
                ? words.disabled(scopeWords)
                : words.rollingBack}
        </Chip>
        {locked && lockedReason ? (
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={whyOpen}
            aria-controls={reasonId}
            onClick={() => setWhyOpen(!whyOpen)}
          >
            {words.whyBlocked}
          </Button>
        ) : null}
        {!locked && state === 'disabled' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode('rollback')}
          >
            {words.rollBack}
          </Button>
        ) : null}
        <Switch
          checked={on}
          disabled={locked || state === 'rolling-back'}
          aria-describedby={locked && lockedReason ? reasonId : undefined}
          onCheckedChange={(next) => setMode(next ? 'rollback' : 'disable')}
          label={
            <VisuallyHidden>
              {words.switchName(worker, scopeWords)}
            </VisuallyHidden>
          }
        />
      </div>
      <ReasonDialog
        open={mode !== null}
        onCancel={() => setMode(null)}
        onConfirm={confirm}
        danger={mode !== 'rollback'}
        title={
          mode === 'rollback'
            ? words.rollbackTitle(worker, scopeWords)
            : words.disableTitle(worker, scopeWords)
        }
        impact={mode === 'rollback' ? rollbackImpact : impact}
        confirmLabel={
          mode === 'rollback'
            ? words.rollbackConfirm(scopeWords)
            : words.disableConfirm(scopeWords)
        }
        minLength={minReasonLength}
        labels={words.dialog}
      />
    </div>
  );
}
