import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Surface } from '../../primitives/surface';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { Button } from '../button/button';
import { ChatBubble, type ChatBubbleProps } from '../chat-bubble/chat-bubble';
import { Chip } from '../chip/chip';
import { LiveDot } from '../live-dot/live-dot';

// Where the call is:
// - idle: nothing has played; a Play button.
// - live: the line is open (a live dot and the running timer).
// - typing: the line is open and a turn is being transcribed (the dots in the transcript).
// - replaying: a recorded call is playing back; Pause and Resume.
// - ended: the call is over; Replay.
export type CallState = 'idle' | 'live' | 'typing' | 'replaying' | 'ended';

export const CALL_STATES: readonly CallState[] = [
  'idle',
  'live',
  'typing',
  'replaying',
  'ended',
];

export interface CallLanguage {
  // The language code (te, hi, en), set as the chip label's lang.
  code: string;
  // Its name, in itself and in English: "తెలుగు · Telugu".
  label: string;
}

// Every fixed word, so the console can be read in Telugu, Hindi or English.
export interface CallTranscriptConsoleLabels {
  transcript: string;
  timer: string;
  // The call time in words, for the 30-second announcement.
  spokenTime: (seconds: number) => string;
  live: string;
  replaying: string;
  paused: string;
  ended: string;
  play: string;
  pause: string;
  resume: string;
  replay: string;
  typing: string;
}

function spokenTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const parts = [
    minutes ? `${minutes} minute${minutes === 1 ? '' : 's'}` : '',
    rest ? `${rest} second${rest === 1 ? '' : 's'}` : '',
  ].filter((part) => part !== '');
  return parts.length ? parts.join(' ') : '0 seconds';
}

export const CALL_TRANSCRIPT_CONSOLE_LABELS: Readonly<CallTranscriptConsoleLabels> =
  {
    transcript: 'Call transcript',
    timer: 'Call time',
    spokenTime,
    live: 'Live',
    replaying: 'Replaying',
    paused: 'Paused',
    ended: 'Call ended',
    play: 'Play call',
    pause: 'Pause replay',
    resume: 'Resume replay',
    replay: 'Replay call',
    typing: 'Speaking…',
  };

// mm:ss, the prototype's .ch-timer ("02:12").
export function formatCallTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(whole / 60))}:${pad(whole % 60)}`;
}

// How often the running time is announced while the line is open: never every second.
const ANNOUNCE_EVERY_S = 30;

export interface CallTranscriptConsoleProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  // Who is on the call ("Outbound · K. Yadamma, 63F"). It names the console.
  title: ReactNode;
  // What the call is ("Follow-up recall · +91 98493 21574 · Telugu").
  subtitle?: ReactNode;
  // The languages the agent speaks, as chips; `language` marks the call's own.
  languages?: readonly CallLanguage[];
  language?: string;
  // Seconds since the call began. The caller runs the clock.
  elapsed?: number;
  state?: CallState;
  defaultState?: CallState;
  onStateChange?: (state: CallState) => void;
  // A replay is paused.
  paused?: boolean;
  defaultPaused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  // Play (from idle) and Replay (once ended) start a replay; the caller plays the turns.
  onPlay?: () => void;
  onReplay?: () => void;
  // A turn is being transcribed (or replayed): the typing dots, in any state. The typing state
  // always shows them.
  typing?: boolean;
  // While typing: which side is speaking (in, the AI, by default) and who, in words.
  typingSide?: 'in' | 'out';
  typingLabel?: string;
  // The turns: CallTurn and CallSystemEvent.
  children?: ReactNode;
  // Under the transcript: CallWriteBack, the records the call created.
  footer?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  labels?: Partial<CallTranscriptConsoleLabels>;
}

// The AI calling console (02-reception's .call-frame): a chrome header with who is on the line, the
// language chips and the timer; the transcript as a named log of ChatBubbles (the AI on the left,
// the caller on the right, each with the native text and its English gloss) and system pills; and an
// optional footer of what the call wrote back. The transcript log reads new turns out politely. The
// running timer is a role="timer" (never announced by itself), and a polite status says the call
// time every 30 seconds while the line is open. There is no dialler, mute or hold: it only shows a
// call, and Play, Pause and Replay only call back.
export function CallTranscriptConsole({
  title,
  subtitle,
  languages,
  language,
  elapsed = 0,
  state: stateProp,
  defaultState = 'idle',
  onStateChange,
  paused: pausedProp,
  defaultPaused = false,
  onPausedChange,
  onPlay,
  onReplay,
  typing = false,
  typingSide = 'in',
  typingLabel,
  children,
  footer,
  headingLevel = 3,
  labels: labelsProp,
  className,
  ...rest
}: CallTranscriptConsoleProps) {
  const words: CallTranscriptConsoleLabels = {
    ...CALL_TRANSCRIPT_CONSOLE_LABELS,
    ...labelsProp,
  };
  const ids = useId();
  const titleId = `${ids}-title`;
  const transcriptId = `${ids}-transcript`;
  const [state, setState] = useControllableState({
    value: stateProp,
    defaultValue: defaultState,
    onChange: onStateChange,
  });
  const [paused, setPaused] = useControllableState({
    value: pausedProp,
    defaultValue: defaultPaused,
    onChange: onPausedChange,
  });
  const logRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const refocus = useRef(false);
  const lastSaid = useRef<number | null>(null);
  const [timeSaid, setTimeSaid] = useState('');
  const lineOpen = state === 'live' || state === 'typing';

  // The time in words every 30 seconds while the line is open; never the moment it opens (the
  // timer is on screen and readable on request), and never during a replay.
  useEffect(() => {
    if (!lineOpen) {
      lastSaid.current = null;
      return;
    }
    const step = Math.floor(elapsed / ANNOUNCE_EVERY_S);
    if (lastSaid.current === null) {
      lastSaid.current = step;
    } else if (step > lastSaid.current) {
      lastSaid.current = step;
      setTimeSaid(
        `${words.timer} ${words.spokenTime(step * ANNOUNCE_EVERY_S)}`,
      );
    }
  }, [elapsed, lineOpen, words]);

  // Keep the newest turn in view, unless the reader has scrolled back up.
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && atBottom.current) log.scrollTop = log.scrollHeight;
  });

  // A control that replaced the one just pressed takes the focus; with no control left (the line
  // opened), the transcript does.
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    (
      controlsRef.current?.querySelector<HTMLElement>('button') ??
      logRef.current
    )?.focus();
  });

  function play(replay: boolean) {
    refocus.current = true;
    setPaused(false);
    setState('replaying');
    if (replay) onReplay?.();
    else onPlay?.();
  }

  const Heading = `h${headingLevel}` as const;

  let indicator: ReactNode = null;
  if (lineOpen) {
    indicator = <LiveDot label={words.live} />;
  } else if (state === 'replaying') {
    indicator = (
      <Chip tone={paused ? 'neutral' : 'info'} icon={paused ? '❚❚' : '↺'}>
        {paused ? words.paused : words.replaying}
      </Chip>
    );
  } else if (state === 'ended') {
    indicator = <Chip tone="neutral">{words.ended}</Chip>;
  }

  let controls: ReactNode = null;
  if (state === 'idle') {
    controls = (
      <Button variant="ai" size="sm" onClick={() => play(false)}>
        <span aria-hidden="true">▶</span>
        {words.play}
      </Button>
    );
  } else if (state === 'replaying') {
    controls = (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          refocus.current = true;
          setPaused(!paused);
        }}
      >
        <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
        {paused ? words.resume : words.pause}
      </Button>
    );
  } else if (state === 'ended') {
    controls = (
      <Button variant="ghost" size="sm" onClick={() => play(true)}>
        <span aria-hidden="true">↺</span>
        {words.replay}
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-state={state}
      className={cx(
        // .call-frame: the strong line, the large radius, panel-2 behind the transcript.
        'flex flex-col overflow-hidden rounded-overlay border border-border-strong bg-surface-2',
        className,
      )}
      {...rest}
    >
      <Surface
        material="chrome"
        radius="none"
        data-slot="call-header"
        // .call-h: the chrome gradient, 12px by 16px, 10px between its parts. It fills the frame's
        // top edge square; the frame's own corners clip it.
        className="flex flex-wrap items-center gap-s4 px-card py-card-bar"
      >
        <div className="min-w-0">
          <Heading
            id={titleId}
            className="font-display text-input font-bold break-words"
          >
            {title}
          </Heading>
          {subtitle !== undefined && subtitle !== null ? (
            <p className="text-meta break-words text-[color:var(--nova-chrome-ink-2)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {languages && languages.length > 0 ? (
          <div data-slot="languages" className="flex flex-wrap gap-s2">
            {languages.map((item) => (
              <Chip key={item.code} selected={item.code === language}>
                <span lang={item.code}>{item.label}</span>
              </Chip>
            ))}
          </div>
        ) : null}
        <div className="ml-auto flex items-center gap-s3">
          <span data-slot="call-state">{indicator}</span>
          <span
            role="timer"
            // .ch-timer: 12.5px mono in a pill, lifted off the chrome.
            className="rounded-full bg-[var(--nova-chrome-field)] px-s4 py-s1 font-mono text-body-sm"
          >
            <VisuallyHidden>{words.timer} </VisuallyHidden>
            {formatCallTime(elapsed)}
          </span>
        </div>
      </Surface>
      <span id={transcriptId} hidden>
        {words.transcript}
      </span>
      <div
        ref={logRef}
        role="log"
        aria-labelledby={`${transcriptId} ${titleId}`}
        // It scrolls, so it takes focus and can be scrolled from the keyboard.
        tabIndex={0}
        onScroll={(event) => {
          const log = event.currentTarget;
          atBottom.current =
            log.scrollHeight - log.scrollTop - log.clientHeight < 24;
        }}
        // .call-b: 12px of padding, 8px between turns, 240px to 460px tall.
        className={cx(
          'flex min-h-(--nova-transcript-min-h) max-h-(--nova-transcript-max-h) flex-col gap-s3 overflow-y-auto p-s5',
          focusRing,
        )}
      >
        {children}
        {typing || state === 'typing' ? (
          <ChatBubble
            direction={typingSide}
            typing
            typingLabel={typingLabel ?? words.typing}
          />
        ) : null}
      </div>
      {controls ? (
        <div
          ref={controlsRef}
          data-slot="call-controls"
          className="flex justify-center gap-s3 px-s5 pb-s5"
        >
          {controls}
        </div>
      ) : null}
      <VisuallyHidden data-slot="timer-announcer" role="status">
        {timeSaid}
      </VisuallyHidden>
      {footer !== undefined && footer !== null ? (
        <div
          data-slot="call-footer"
          className="border-t border-border bg-surface px-card py-card-bar"
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export interface CallTurnProps
  extends Omit<
    ChatBubbleProps,
    | 'direction'
    | 'tone'
    | 'palette'
    | 'typing'
    | 'typingLabel'
    | 'critical'
    | 'criticalLabel'
  > {
  // The AI agent's turn (on the left, marked with the AI mark); the caller's otherwise.
  ai?: boolean;
}

// One turn of the call: who spoke (in text), what they said in their language, the English gloss and
// the time into the call. A ChatBubble in the product's colours (the prototype's retinted .wa-msg).
export function CallTurn({
  ai = false,
  aiLabel = 'AI agent',
  ...rest
}: CallTurnProps) {
  return (
    <ChatBubble
      palette="nova"
      direction={ai ? 'in' : 'out'}
      tone={ai ? 'ai' : 'default'}
      aiLabel={aiLabel}
      {...rest}
    />
  );
}

export interface CallSystemEventProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  // An escalation: an icon, the word, the crit tone.
  critical?: boolean;
  criticalLabel?: string;
  contentLang?: string;
}

// Something that happened on the call, between the turns (.call-sys): "Dialling…", "Call ended ·
// 2:12", and, critical, "Transferred to Swapna".
export function CallSystemEvent({
  children,
  critical = false,
  criticalLabel,
  contentLang,
  ...rest
}: CallSystemEventProps) {
  return (
    <ChatBubble
      tone="system"
      critical={critical}
      criticalLabel={criticalLabel}
      contentLang={contentLang}
      {...rest}
    >
      {children}
    </ChatBubble>
  );
}

export interface CallWriteBackRecord {
  id: string;
  title: ReactNode;
  detail?: ReactNode;
}

export interface CallWriteBackProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  records: readonly CallWriteBackRecord[];
  // "Written back while the line was open" by default.
  title?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  // What shows before the call has written anything.
  empty?: ReactNode;
}

// What the call created while the line was open (02-reception's .wrote-list): each record with a
// tick, its name and its detail, for the console's footer.
export function CallWriteBack({
  records,
  title = 'Written back while the line was open',
  headingLevel = 3,
  empty,
  className,
  ...rest
}: CallWriteBackProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <section className={cx('flex flex-col gap-s1', className)} {...rest}>
      <Heading className="font-display text-input font-bold text-ink">
        {title}
      </Heading>
      {records.length === 0 ? (
        empty !== undefined && empty !== null ? (
          <p className="text-label text-ink-2">{empty}</p>
        ) : null
      ) : (
        <ul className="flex flex-col">
          {records.map((record) => (
            <li
              key={record.id}
              // .wrote-item: 10px apart, a hairline between, 12.5px.
              className="flex gap-s4 border-b border-border py-s4 text-body-sm last:border-b-0"
            >
              <span aria-hidden="true" className="shrink-0 font-bold text-good">
                ✓
              </span>
              <span className="min-w-0">
                <b className="font-bold text-ink">{record.title}</b>
                {record.detail !== undefined && record.detail !== null ? (
                  <span className="block text-label text-ink-2">
                    {record.detail}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
