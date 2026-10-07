import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { AiBadge } from '../ai-badge/ai-badge';
import { Button } from '../button/button';
import { Chip } from '../chip/chip';
import { Menu, MenuItemRadio } from '../menu/menu';
import { StatusDotMark } from '../status-dot/status-dot-mark';
import { StreamCaret } from './stream-caret';

// Where the scribe is. The recorder never touches the microphone: the app owns getUserMedia, the
// recorder, the transcription and the AI, and tells the recorder which of these it is in.
// - idle: nothing recorded yet; Start, with the consent text.
// - requesting: the browser is asking for the microphone.
// - denied: the microphone was refused; how to enable it, and Try again.
// - recording / paused: the live indicator, the waveform, the timer and the interim words.
// - stopped: "Recorded · 02:41".
// - processing: the drafting steps.
// - done: the draft is ready.
export type ScribeRecorderStatus =
  | 'idle'
  | 'requesting'
  | 'denied'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'processing'
  | 'done';

export const SCRIBE_RECORDER_STATUSES: readonly ScribeRecorderStatus[] = [
  'idle',
  'requesting',
  'denied',
  'recording',
  'paused',
  'stopped',
  'processing',
  'done',
];

export type ScribeStepState = 'done' | 'active' | 'pending';

export interface ScribeStep {
  label: ReactNode;
  state: ScribeStepState;
}

export interface ScribeLanguageOption {
  value: string;
  label: string;
}

// Every fixed word, so the recorder can be shown in Telugu, Hindi or English.
export interface AmbientScribeRecorderLabels {
  name: string;
  status: Record<ScribeRecorderStatus, string>;
  start: string;
  pause: string;
  resume: string;
  stop: string;
  retry: string;
  elapsed: string;
  denied: string;
  privacy: string;
  language: string;
  steps: string;
  stepStates: Record<ScribeStepState, string>;
}

export const AMBIENT_SCRIBE_RECORDER_LABELS: Readonly<AmbientScribeRecorderLabels> =
  {
    name: 'AI Scribe',
    status: {
      idle: 'Not recording',
      requesting: 'Waiting for microphone permission…',
      denied: 'Microphone blocked',
      recording: 'Recording',
      paused: 'Paused',
      stopped: 'Recorded',
      processing: 'Drafting the note',
      done: 'Draft ready',
    },
    start: 'Start recording',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop & draft',
    retry: 'Try again',
    elapsed: 'Elapsed',
    denied:
      'The microphone is blocked for this page, so HOS cannot record the consultation. Allow the microphone for this site, then try again.',
    privacy: 'Audio is processed for the draft and not stored',
    language: 'Language',
    steps: 'Drafting progress',
    stepStates: { done: 'Done', active: 'In progress', pending: 'Waiting' },
  };

export type AmbientScribeRecorderLabelOverrides = Partial<
  Omit<AmbientScribeRecorderLabels, 'status' | 'stepStates'>
> & {
  status?: Partial<Record<ScribeRecorderStatus, string>>;
  stepStates?: Partial<Record<ScribeStepState, string>>;
};

export interface AmbientScribeRecorderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  status?: ScribeRecorderStatus;
  defaultStatus?: ScribeRecorderStatus;
  onStatusChange?: (status: ScribeRecorderStatus) => void;
  // The app's hooks. Each also moves an uncontrolled recorder on: Start (and Try again) to
  // requesting, Pause to paused, Resume to recording, Stop & draft to stopped.
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  // The length of the recording so far, from the app's recorder.
  elapsedSeconds?: number;
  // Input levels, 0 to 1, oldest first (an analyser's RMS, sampled by the app). The latest barCount
  // are drawn.
  levels?: readonly number[];
  barCount?: number;
  // The words recognised so far, as the transcription service streams them, and their language.
  interim?: string;
  interimLang?: string;
  // Announce the interim words to a screen reader, a sentence at a time. On by default.
  announceInterim?: boolean;
  // The languages being recognised ("Telugu + English"), or with languageOptions the value of the
  // current one.
  language?: string;
  languageOptions?: readonly ScribeLanguageOption[];
  // With languageOptions, the language chip becomes a menu.
  onLanguageChange?: (value: string) => void;
  // Idle: the consent the patient gave, or the line asking for it.
  consent?: ReactNode;
  // Denied: how to enable the microphone in this browser.
  deniedHelp?: ReactNode;
  // Processing: the drafting steps, or a progress component of the caller's own in place of them.
  steps?: readonly ScribeStep[];
  progress?: ReactNode;
  // Done: the draft (a SoapDraftBlock), or what leads to it.
  draft?: ReactNode;
  labels?: AmbientScribeRecorderLabelOverrides;
}

// The silhouette of the prototype's five bars (6, 14, 9, 15 and 7px of 16), for a recorder given
// no levels.
const RESTING_LEVELS = [0.375, 0.875, 0.5625, 0.9375, 0.4375];

// A silent bar still shows as a stub, so the waveform never looks like a gap.
const MIN_SCALE = 0.15;

// A sentence has ended: a full stop, a question or exclamation mark, an ellipsis, or the Devanagari
// danda, optionally inside a closing quote or bracket.
const SENTENCE_END = /[.!?…।॥]["'”’)\]]*$/u;

const LIVE: readonly ScribeRecorderStatus[] = ['recording', 'paused'];
const RECORDED: readonly ScribeRecorderStatus[] = [
  'recording',
  'paused',
  'stopped',
  'processing',
  'done',
];

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.min(1, Math.max(0, level));
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// 02:41, or 1:02:05 past the hour.
function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${pad(minutes)}:${pad(rest)}`;
}

const svg = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

const icons = {
  mic: (
    <svg {...svg} className="size-icon-md shrink-0">
      <rect x="7" y="2.5" width="6" height="10" rx="3" />
      <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" />
    </svg>
  ),
  micOff: (
    <svg {...svg} className="size-icon-md shrink-0">
      <path d="M7 7V5.5a3 3 0 0 1 6 0v4M4.5 9.5a5.5 5.5 0 0 0 9.2 4.1M10 15v2.5M3 3l14 14" />
    </svg>
  ),
  waiting: (
    <svg {...svg} className="size-icon-md shrink-0 motion-safe:animate-spin">
      <circle cx="10" cy="10" r="7" opacity="0.35" />
      <path d="M17 10a7 7 0 0 0-7-7" />
    </svg>
  ),
  pause: (
    <svg {...svg} className="size-icon-xs shrink-0">
      <path d="M7 4.5v11M13 4.5v11" />
    </svg>
  ),
  stopped: (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      className="size-icon-xs shrink-0"
    >
      <rect x="4" y="4" width="12" height="12" rx="1.5" fill="currentColor" />
    </svg>
  ),
  lock: (
    <svg {...svg} className="size-icon-sm shrink-0">
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  ),
  stepDone: (
    <svg {...svg} className="size-icon-sm shrink-0 text-good">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  ),
  stepActive: (
    <svg
      {...svg}
      className="size-icon-sm shrink-0 text-ai motion-safe:animate-spin"
    >
      <circle cx="10" cy="10" r="7" opacity="0.35" />
      <path d="M17 10a7 7 0 0 0-7-7" />
    </svg>
  ),
  stepPending: (
    <svg {...svg} className="size-icon-sm shrink-0 text-ink-3">
      <circle cx="10" cy="10" r="6" />
    </svg>
  ),
} as const;

const STEP_ICONS: Record<ScribeStepState, ReactNode> = {
  done: icons.stepDone,
  active: icons.stepActive,
  pending: icons.stepPending,
};

// The rest of `full` that has not been announced yet: only the new sentence when the words extend
// what was already read out, all of them otherwise.
function unannounced(announced: string, full: string): string {
  return full.startsWith(announced)
    ? full.slice(announced.length).trim()
    : full;
}

// The prototype's AI Scribe (03-doctor.html, the live consultation card; hos.css .rec): the dark
// recording pill with its bars and timer, the language chip and Stop & draft, the interim words under
// it with the AI caret. Added for the real product: Pause and Resume, the permission request and its
// refusal, the drafting steps, and an always-visible privacy line.
export function AmbientScribeRecorder({
  status: statusProp,
  defaultStatus = 'idle',
  onStatusChange,
  onStart,
  onPause,
  onResume,
  onStop,
  elapsedSeconds = 0,
  levels,
  barCount = 5,
  interim,
  interimLang,
  announceInterim = true,
  language,
  languageOptions,
  onLanguageChange,
  consent,
  deniedHelp,
  steps,
  progress,
  draft,
  labels: labelsProp,
  className,
  onFocus,
  onBlur,
  ...rest
}: AmbientScribeRecorderProps) {
  const words: AmbientScribeRecorderLabels = {
    ...AMBIENT_SCRIBE_RECORDER_LABELS,
    ...labelsProp,
    status: { ...AMBIENT_SCRIBE_RECORDER_LABELS.status, ...labelsProp?.status },
    stepStates: {
      ...AMBIENT_SCRIBE_RECORDER_LABELS.stepStates,
      ...labelsProp?.stepStates,
    },
  };
  const [status, setStatus] = useControllableState({
    value: statusProp,
    defaultValue: defaultStatus,
    onChange: onStatusChange,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const focusInside = useRef(false);

  // Focus follows the recording when the control it was on goes away (Start, once pressed): to
  // Pause while recording, never to Stop, which ends the consultation's recording for good.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !focusInside.current) return;
    const active = document.activeElement;
    if (active && active !== document.body && active !== root) return;
    const target =
      root.querySelector<HTMLElement>('[data-action="toggle"]') ??
      root.querySelector<HTMLElement>('[data-action="start"]') ??
      root.querySelector<HTMLElement>('[data-action="retry"]') ??
      root;
    target.focus();
  }, [status]);

  // The interim words, announced a sentence at a time: when a sentence ends, when the next fragment
  // replaces the current one, and what is left when the recording stops. Never per character.
  const [announcement, setAnnouncement] = useState('');
  const announced = useRef('');
  const previous = useRef('');
  const previousStatus = useRef(status);
  useEffect(() => {
    const text = (interim ?? '').trim();
    const before = previous.current;
    const wasLive = LIVE.includes(previousStatus.current);
    previous.current = text;
    previousStatus.current = status;
    if (!announceInterim) return;
    const parts: string[] = [];
    if (!text.startsWith(before)) {
      const rest = unannounced(announced.current, before);
      if (rest) parts.push(rest);
      announced.current = '';
    }
    const ended = SENTENCE_END.test(text);
    const stopped = wasLive && !LIVE.includes(status);
    if (text && (ended || stopped)) {
      const rest = unannounced(announced.current, text);
      if (rest) parts.push(rest);
      announced.current = text;
    }
    if (parts.length > 0) setAnnouncement(parts.join(' '));
  }, [interim, status, announceInterim]);

  const live = LIVE.includes(status);
  const recorded = RECORDED.includes(status);
  const time = formatElapsed(elapsedSeconds);

  const source = levels ?? RESTING_LEVELS;
  const count = Math.max(1, Math.floor(barCount));
  const latest = source.slice(-count);
  const shown = [
    ...Array<number>(Math.max(0, count - latest.length)).fill(0),
    ...latest,
  ].map((level) => (status === 'paused' ? 0 : clampLevel(level)));

  const glyph =
    // LiveDot's heartbeat in its good tone: a crit dot on the fixed dark chrome is under 3:1 in the
    // light scheme (theme/legibility.ts, AI_VOICE_PAIRINGS). The words say "Recording"; the dot only beats.
    status === 'recording' ? (
      <StatusDotMark tone="good" pulse />
    ) : status === 'paused' ? (
      icons.pause
    ) : recorded ? (
      icons.stopped
    ) : status === 'requesting' ? (
      icons.waiting
    ) : status === 'denied' ? (
      icons.micOff
    ) : (
      icons.mic
    );

  const currentLanguage =
    languageOptions?.find((option) => option.value === language)?.label ??
    language;

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={words.name}
      tabIndex={-1}
      data-status={status}
      className={cx(
        'flex flex-col gap-s3 rounded-control',
        focusRing,
        className,
      )}
      onFocus={(event) => {
        focusInside.current = true;
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          focusInside.current = false;
        }
        onBlur?.(event);
      }}
      {...rest}
    >
      {/* .rec-row: 12px apart, wrapping. */}
      <div className="flex flex-wrap items-center gap-s5">
        <AiBadge label={words.name} />
        {/* The recording indicator, always on screen: the dark pill once there is a recording, a
            plain line before it. Its words are the one status region. */}
        <span
          data-slot="indicator"
          className={cx(
            'inline-flex items-center text-control font-semibold',
            recorded
              ? 'gap-s4 rounded-full bg-chrome-1 px-s6 py-s3 text-chrome-ink'
              : 'gap-s2',
            status === 'denied' ? 'text-crit-deep' : !recorded && 'text-ink-2',
          )}
        >
          {glyph}
          {live ? (
            <span
              data-slot="waveform"
              aria-hidden="true"
              className="inline-flex h-s6 items-end gap-s0"
            >
              {shown.map((level, index) => (
                <span
                  key={index}
                  data-slot="bar"
                  data-level={String(level)}
                  className="h-full w-(--nova-scribe-bar-w) origin-bottom rounded-full bg-chrome-accent motion-safe:transition-transform motion-safe:duration-fast motion-safe:ease-standard"
                  style={{ transform: `scaleY(${Math.max(MIN_SCALE, level)})` }}
                />
              ))}
            </span>
          ) : null}
          {/* One inline run, so "Recording · 02:41" reads as the prototype's single label. */}
          <span>
            <span role="status">{words.status[status]}</span>
            {recorded ? (
              <>
                <span aria-hidden="true"> · </span>
                <span
                  role="timer"
                  aria-label={`${words.elapsed} ${time}`}
                  className="tabular-nums"
                >
                  {time}
                </span>
              </>
            ) : null}
          </span>
        </span>
        {currentLanguage ? (
          languageOptions && onLanguageChange ? (
            <Menu
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`${words.language}: ${currentLanguage}`}
                >
                  {currentLanguage}
                  <svg {...svg} className="size-icon-xs">
                    <path d="M5.5 8l4.5 4.5L14.5 8" />
                  </svg>
                </Button>
              }
            >
              {languageOptions.map((option) => (
                <MenuItemRadio
                  key={option.value}
                  checked={option.value === language}
                  onClick={() => onLanguageChange(option.value)}
                >
                  {option.label}
                </MenuItemRadio>
              ))}
            </Menu>
          ) : (
            <Chip tone="info">{currentLanguage}</Chip>
          )
        ) : null}
        {status === 'idle' ? (
          <Button
            variant="ai"
            size="sm"
            data-action="start"
            onClick={() => {
              setStatus('requesting');
              onStart?.();
            }}
          >
            {words.start}
          </Button>
        ) : null}
        {status === 'denied' ? (
          <Button
            variant="ghost"
            size="sm"
            data-action="retry"
            onClick={() => {
              setStatus('requesting');
              onStart?.();
            }}
          >
            {words.retry}
          </Button>
        ) : null}
        {live ? (
          <>
            {/* One button that says Pause or Resume, so the focus stays on it across the change. */}
            <Button
              variant="ghost"
              size="sm"
              data-action="toggle"
              onClick={() => {
                if (status === 'recording') {
                  setStatus('paused');
                  onPause?.();
                } else {
                  setStatus('recording');
                  onResume?.();
                }
              }}
            >
              {status === 'recording' ? words.pause : words.resume}
            </Button>
            <Button
              variant="danger"
              size="sm"
              data-action="stop"
              onClick={() => {
                setStatus('stopped');
                onStop?.();
              }}
            >
              <span aria-hidden="true" className="inline-flex">
                {icons.stopped}
              </span>
              {words.stop}
            </Button>
          </>
        ) : null}
      </div>

      {live ? (
        <p
          data-slot="interim"
          lang={interimLang}
          className="min-h-s6 text-label italic text-ink-2"
        >
          {interim}
          {status === 'recording' ? <StreamCaret /> : null}
        </p>
      ) : null}
      {/* Always mounted, so each announcement is heard; it holds only whole sentences. */}
      <VisuallyHidden
        as="div"
        data-slot="interim-live"
        aria-live="polite"
        lang={interimLang}
      >
        {announcement}
      </VisuallyHidden>

      {status === 'idle' && consent ? (
        <div className="text-body-sm text-ink-2">{consent}</div>
      ) : null}

      {status === 'denied' ? (
        <div className="flex flex-col gap-s1">
          <p className="flex items-start gap-s2 text-body-sm font-semibold text-crit-deep">
            {icons.micOff}
            {words.denied}
          </p>
          {deniedHelp ? (
            <div className="text-body-sm text-ink-2">{deniedHelp}</div>
          ) : null}
        </div>
      ) : null}

      {status === 'processing'
        ? (progress ??
          (steps && steps.length > 0 ? (
            <ol aria-label={words.steps} className="flex flex-col">
              {steps.map((step, index) => (
                <li
                  key={index}
                  data-state={step.state}
                  className={cx(
                    'flex items-center gap-s3 py-s1 text-body-sm',
                    step.state === 'done' ? 'text-ink' : 'text-ink-2',
                  )}
                >
                  {STEP_ICONS[step.state]}
                  <VisuallyHidden>
                    {words.stepStates[step.state]}:{' '}
                  </VisuallyHidden>
                  {step.label}
                </li>
              ))}
            </ol>
          ) : null))
        : null}

      {status === 'done' && draft ? <div>{draft}</div> : null}

      <p className="flex items-center gap-s2 text-caption text-ink-2">
        {icons.lock}
        {words.privacy}
      </p>
    </div>
  );
}
