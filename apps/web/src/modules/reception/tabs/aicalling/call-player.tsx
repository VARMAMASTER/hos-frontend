import { useEffect, useState } from 'react';
import {
  AiSourceLine,
  CallSystemEvent,
  CallTranscriptConsole,
  CallTurn,
  CallWriteBack,
  Stack,
  Text,
  type CallState,
} from '@hos/nova-ui';
import type { AiCall, AiCallStep, PatientLanguage } from '../../data';
import { ReceptionDraftReply } from '../../ui';

// How long each turn takes to arrive when a recorded call is played back.
const STEP_MS = 800;

export const CALL_LANGUAGES: { code: PatientLanguage; label: string }[] = [
  { code: 'te', label: 'తెలుగు · Telugu' },
  { code: 'hi', label: 'हिन्दी · Hindi' },
  { code: 'en', label: 'English' },
];

// "1:24" into the call, in seconds.
function secondsOf(time: string): number {
  const [minutes, seconds] = time.split(':');
  return Number(minutes) * 60 + Number(seconds);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export interface CallPlayerProps {
  call: AiCall;
  language: PatientLanguage;
  // Starts playing as soon as it appears (the "Replay the 10:39 escalation" shortcut).
  autoPlay?: boolean;
  // The follow-up that was sent from this call, shown settled.
  settledFollowUp?: AiCall['followUp'];
  onSendFollowUp: (message: string) => Promise<boolean>;
}

// A recorded call, played back turn by turn in the language chosen, with what it wrote back and the
// follow-up the agent drafted. The follow-up is a draft until a person approves it.
export function CallPlayer({
  call,
  language,
  autoPlay = false,
  settledFollowUp,
  onSendFollowUp,
}: CallPlayerProps) {
  const [state, setState] = useState<CallState>(
    autoPlay ? 'replaying' : 'idle',
  );
  const [paused, setPaused] = useState(false);
  const [shown, setShown] = useState(autoPlay ? 1 : 0);

  useEffect(() => {
    if (state !== 'replaying' || paused) return undefined;
    if (shown >= call.steps.length) {
      setState('ended');
      return undefined;
    }
    const timer = setTimeout(() => setShown((count) => count + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [state, paused, shown, call.steps.length]);

  function start() {
    setShown(prefersReducedMotion() ? call.steps.length : 1);
  }

  const steps = call.steps.slice(0, shown);
  const ended = state === 'ended';
  const next = call.steps[shown];
  const lastTurn = [...steps]
    .reverse()
    .find((step): step is Extract<AiCallStep, { kind: 'turn' }> => {
      return step.kind === 'turn';
    });
  const elapsed = ended
    ? call.durationSeconds
    : lastTurn
      ? secondsOf(lastTurn.at)
      : 0;
  const typing =
    state === 'replaying' && !paused && next?.kind === 'turn' ? next : null;
  const followUp = call.followUp ?? settledFollowUp ?? null;

  return (
    <Stack gap="s4">
      <CallTranscriptConsole
        title={call.title}
        subtitle={`${call.subtitle} · ${
          CALL_LANGUAGES.find((item) => item.code === language)?.label ?? ''
        }`}
        languages={CALL_LANGUAGES}
        language={language}
        elapsed={elapsed}
        state={state}
        onStateChange={setState}
        paused={paused}
        onPausedChange={setPaused}
        onPlay={start}
        onReplay={start}
        typing={typing !== null}
        typingSide={typing?.ai === false ? 'out' : 'in'}
        typingLabel={
          typing
            ? `${typing.ai ? 'AI agent' : typing.speaker} is speaking`
            : undefined
        }
        footer={
          <CallWriteBack
            records={ended ? call.writeBack : []}
            empty={
              ended
                ? 'This call wrote nothing back: it was handed to a person.'
                : 'Nothing yet. Play the call — every record the agent creates appears here as it happens, because "the AI called them" is worth nothing if a human still has to type the booking afterwards.'
            }
          />
        }
      >
        {state === 'idle' ? (
          <CallSystemEvent>
            The agent identifies itself as an AI in the first sentence of every
            call. It is never introduced as a person.
          </CallSystemEvent>
        ) : null}
        {steps.map((step) =>
          step.kind === 'system' ? (
            <CallSystemEvent key={step.id} critical={step.critical}>
              {step.text}
            </CallSystemEvent>
          ) : (
            <CallTurn
              key={step.id}
              ai={step.ai}
              speaker={step.ai ? undefined : step.speaker}
              contentLang={language}
              gloss={language === 'en' ? undefined : step.text.en}
              time={step.at}
            >
              {step.text[language]}
            </CallTurn>
          ),
        )}
      </CallTranscriptConsole>
      {ended && followUp ? (
        <ReceptionDraftReply
          key={followUp.id}
          title={followUp.title}
          channel="whatsapp"
          recipient={followUp.recipient}
          message={followUp.message}
          onSend={onSendFollowUp}
          source={
            <Stack gap="s2">
              <Text size="sm">{followUp.summary}</Text>
              <AiSourceLine label="Read from">
                What the call booked · nothing is sent until you approve
              </AiSourceLine>
            </Stack>
          }
        />
      ) : null}
    </Stack>
  );
}
