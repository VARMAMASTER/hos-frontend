import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { AiMark } from '../../primitives/ai-mark';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { Button } from '../button/button';
import { Switch } from '../switch/switch';
import { Textarea } from '../textarea/textarea';

export interface LearnedPreferenceRowLabels {
  on: string;
  off: string;
  nowDoes: string;
  wouldDo: string;
  idle: string;
  correct: string;
  correctionLabel: string;
  save: string;
  cancel: string;
}

export const LEARNED_PREFERENCE_ROW_LABELS: Readonly<LearnedPreferenceRowLabels> =
  {
    on: 'ON',
    off: 'OFF',
    nowDoes: 'Now does automatically:',
    wouldDo: 'What it would do:',
    idle: 'Currently doing nothing.',
    correct: 'Correct this',
    correctionLabel: 'What should it do instead?',
    save: 'Save correction',
    cancel: 'Cancel',
  };

export interface LearnedPreferenceRowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  // What the agent learned, as a sentence. It names the row and its switch.
  learned: string;
  // The evidence: "Learned from 6 corrections you made in 30 days."
  why: ReactNode;
  // What it now does because of it.
  does: ReactNode;
  // Said in place of `why` while it is off ("You switched this off on 04 Jul, after…").
  whenOff?: ReactNode;
  enabled?: boolean;
  defaultEnabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  // "Correct this" as a callback (open the caller's own editor)…
  onCorrect?: () => void;
  // …or an inline editor, whose text is sent here and then forgotten.
  onSubmitCorrection?: (correction: string) => void;
  labels?: Partial<LearnedPreferenceRowLabels>;
  // The language of the learned text and its explanation (te, hi, en).
  contentLang?: string;
}

// One thing an AI agent has learned about a clinician (03-doctor.html, My AI Team): what it learned,
// why (the evidence), what it now does, an ON/OFF switch, and "Correct this". A system that quietly
// learns habits and never shows the list is unsettling, so every learned behaviour is a row that can
// be read, corrected or switched off. Off, the row dims to the quiet inks (never below their proven
// contrast) and says it is doing nothing.
export function LearnedPreferenceRow({
  learned,
  why,
  does,
  whenOff,
  enabled,
  defaultEnabled = true,
  onEnabledChange,
  onCorrect,
  onSubmitCorrection,
  labels,
  contentLang,
  className,
  ...rest
}: LearnedPreferenceRowProps) {
  const words = { ...LEARNED_PREFERENCE_ROW_LABELS, ...labels };
  const titleId = useId();
  const [on, setOn] = useControllableState({
    value: enabled,
    defaultValue: defaultEnabled,
    onChange: onEnabledChange,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const correctRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  // Opening the editor puts the caret in it; closing it puts focus back on "Correct this".
  useEffect(() => {
    if (editing) boxRef.current?.focus();
    else if (wasEditing.current) correctRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  const inline = onSubmitCorrection !== undefined;
  const correction = draft.trim();

  function close() {
    setDraft('');
    setEditing(false);
  }

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-enabled={on ? 'true' : 'false'}
      className={cx(
        // The prototype's .learn-row: the line edge, panel-2, 10px by 12px. Off, it drops to the
        // panel and the quiet inks instead of the prototype's 55% opacity, which would take its text
        // below 4.5:1.
        'rounded-card border border-border px-s5 py-s4',
        on ? 'bg-surface-2' : 'border-dashed bg-surface',
        className,
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-s4">
        <p
          lang={contentLang}
          className={cx(
            'flex min-w-0 items-start gap-s3 text-control font-semibold',
            on ? 'text-ink' : 'text-ink-2',
          )}
        >
          <AiMark className="mt-s0 text-ai" />
          <span id={titleId} data-learned="">
            {learned}
          </span>
        </p>
        <span
          aria-hidden="true"
          data-state=""
          className={cx(
            'shrink-0 text-caption font-bold',
            on ? 'text-ai-deep' : 'text-ink-3',
          )}
        >
          {on ? words.on : words.off}
        </span>
      </div>
      <p
        lang={contentLang}
        className="mt-s1 text-label leading-relaxed text-ink-2"
      >
        {!on && whenOff ? whenOff : why}
      </p>
      <p
        lang={contentLang}
        className={cx(
          'mt-s2 text-body-sm leading-relaxed',
          on ? 'text-ink' : 'text-ink-3',
        )}
      >
        {/* The prototype's .learn-does: the lead-in plain, the caller bolds what matters. */}
        <span>{on ? words.nowDoes : words.wouldDo}</span> {does}
        {on ? null : (
          <>
            {' '}
            <span className="font-semibold">{words.idle}</span>
          </>
        )}
      </p>
      <div className="mt-s3 flex flex-wrap items-center gap-s3">
        <Switch
          checked={on}
          onCheckedChange={setOn}
          label={<VisuallyHidden>{learned}</VisuallyHidden>}
        />
        {inline || onCorrect ? (
          <Button
            ref={correctRef}
            variant="ghost"
            size="sm"
            aria-describedby={titleId}
            aria-expanded={inline ? editing : undefined}
            onClick={() => {
              if (inline) setEditing(!editing);
              else onCorrect?.();
            }}
          >
            {words.correct}
          </Button>
        ) : null}
      </div>
      {inline && editing ? (
        <div className="mt-s3 flex flex-col gap-s3">
          <Textarea
            ref={boxRef}
            label={words.correctionLabel}
            lang={contentLang}
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-s3">
            <Button variant="ghost" size="sm" onClick={close}>
              {words.cancel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              aria-disabled={correction === '' ? true : undefined}
              onClick={() => {
                onSubmitCorrection?.(correction);
                close();
              }}
            >
              {words.save}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
