import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { AiSourceLine } from '../components/ai-source-line/ai-source-line';
import {
  AmbientScribeRecorder,
  SCRIBE_RECORDER_STATUSES,
  type ScribeRecorderStatus,
  type ScribeStep,
} from '../components/ambient-scribe-recorder/ambient-scribe-recorder';
import { Card, CardBody, CardHeader } from '../components/card/card';
import {
  SoapDraftBlock,
  type SoapSections,
} from '../components/soap-draft-block/soap-draft-block';
import {
  VoiceEntryCapture,
  type VoiceEntryStatus,
  type VoiceParsed,
} from '../components/voice-entry-capture/voice-entry-capture';

// The AI voice batch in one place: the ambient scribe, the SOAP draft it writes, and the nurse's
// voice entry. Nothing here touches a microphone or the network: the waveform is a timer feeding
// made-up levels, the transcript is the prototype's script. Every patient and member of staff is
// fictional. Flip the toolbar's scheme, theme and material, or open the Dark stories.
const meta = { title: 'AI/Voice' } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DARK = { scheme: 'dark' } as const;

// The prototype's interim fragments (03-doctor.html, startInterim).
const FRAGMENTS = [
  '“కాళ్ళలో తిమ్మిరి…” — tingling in both feet… two weeks…',
  'worse at night… disturbs her sleep…',
  '“చాలా దాహం, అలసట అనిపిస్తోంది” — thirst and fatigue…',
  'sugar checked last month… RBS around 214…',
  'BP 148 over 92… pulse 82…',
  '“మందు అప్పుడప్పుడు మిస్ అవుతుంది” — misses a dose sometimes…',
  'no chest pain… no breathlessness…',
];

const STEP_LABELS = [
  'Transcribing 02:41 of Telugu + English…',
  'Extracting symptoms & vitals…',
  'Checking drug interactions & allergies…',
  'Drafting SOAP note…',
];

const SECTIONS: SoapSections = {
  subjective: {
    text: '“రెండు వారాలుగా అలసట, ఎక్కువ దాహం అనిపిస్తోంది. కాళ్లలో జివ్వుమనే అనుభూతి కూడా ఉంది.”',
    gloss:
      'Patient reports fatigue and increased thirst over 2 weeks. Occasional tingling in both feet. Denies chest pain or breathlessness.',
    lang: 'te',
  },
  objective: {
    text: 'BP 148/92 mmHg · పల్స్ 82/నిమిషం · బరువు 68 కేజీలు · RBS 214 mg/dL',
    gloss:
      'BP 148/92 mmHg · Pulse 82/min · Weight 68 kg · Random blood sugar 214 mg/dL. Reduced sensation both soles on monofilament test.',
    lang: 'te',
  },
  assessment: {
    text: 'టైప్ 2 డయాబెటిస్ — HbA1c 8.4%; నరాల సమస్య (నవంబర్ 2025 నుంచి); బీపీ నియంత్రణలో లేదు',
    gloss:
      'Type 2 diabetes mellitus, HbA1c 8.4% today. Diabetic neuropathy, symptomatic. Hypertension, above target.',
    lang: 'te',
  },
};

const PLAN = {
  text: 'మెట్‌ఫార్మిన్ కొనసాగించండి. రెండు వారాల్లో HbA1c, KFT తో రివ్యూ.',
  gloss: 'Continue metformin. Review in two weeks with HbA1c and KFT.',
  lang: 'te',
};

const SOURCE = (
  <AiSourceLine label="Transcribed from">
    consult audio 10:41–10:44 AM · Telugu + English mixed speech · S and O are
    verbatim, A restates values already in her chart, P is yours
  </AiSourceLine>
);

// A made-up input level: a slow swell with a faster flutter, 0..1. No audio is involved.
function level(tick: number): number {
  const swell = 0.5 + 0.35 * Math.sin(tick / 4);
  const flutter = 0.25 * Math.sin(tick * 1.7) * Math.cos(tick * 0.9);
  return Math.min(1, Math.max(0, swell + flutter));
}

// The live scribe, end to end: Start, the permission prompt, the recording (a timer feeds the levels,
// the clock and the interim words), Pause and Resume, Stop & draft, the drafting steps, then the SOAP
// draft streaming in with the plan blocked until "Dictate the plan".
function LiveScribe() {
  const [status, setStatus] = useState<ScribeRecorderStatus>('idle');
  const [tick, setTick] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [sections, setSections] = useState<SoapSections>(SECTIONS);

  useEffect(() => {
    if (status !== 'requesting') return;
    const id = setTimeout(() => setStatus('recording'), 900);
    return () => clearTimeout(id);
  }, [status]);

  useEffect(() => {
    if (status !== 'recording') return;
    const levels = setInterval(() => setTick((t) => t + 1), 120);
    const clock = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(levels);
      clearInterval(clock);
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'stopped') return;
    const id = setTimeout(() => setStatus('processing'), 400);
    return () => clearTimeout(id);
  }, [status]);

  useEffect(() => {
    if (status !== 'processing') return;
    if (step >= STEP_LABELS.length) {
      setStatus('done');
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), 800);
    return () => clearTimeout(id);
  }, [status, step]);

  useEffect(() => {
    if (status !== 'done' || revealed >= 4) return;
    const id = setTimeout(() => setRevealed((r) => r + 1), 700);
    return () => clearTimeout(id);
  }, [status, revealed]);

  const levels = Array.from({ length: 5 }, (_, i) => level(tick + i));
  const steps: ScribeStep[] = STEP_LABELS.map((label, index) => ({
    label,
    state: index < step ? 'done' : index === step ? 'active' : 'pending',
  }));

  return (
    <div className="flex max-w-3xl flex-col gap-s6">
      <Card>
        <CardHeader
          title="Live consultation — Lakshmi Devi"
          description="Token T-12 · Room 3 · in room since 10:41 AM"
        />
        <CardBody>
          <AmbientScribeRecorder
            status={status}
            onStatusChange={setStatus}
            onStart={() => {
              setElapsed(0);
              setStep(0);
              setRevealed(0);
              setSections(SECTIONS);
            }}
            elapsedSeconds={elapsed}
            levels={levels}
            interim={FRAGMENTS[Math.floor(tick / 12) % FRAGMENTS.length]}
            language="Telugu + English"
            consent={
              <p>
                Lakshmi Devi agreed to this consultation being recorded for her
                note.
              </p>
            }
            steps={steps}
          />
        </CardBody>
      </Card>
      {status === 'done' ? (
        <SoapDraftBlock
          approverName="Dr. K. Ramesh"
          status={revealed < 4 ? 'generating' : undefined}
          defaultStatus="pending"
          revealed={revealed}
          sections={sections}
          onSectionsChange={setSections}
          onDictatePlan={() =>
            setTimeout(() => setSections((s) => ({ ...s, plan: PLAN })), 1400)
          }
          source={revealed >= 4 ? SOURCE : undefined}
        />
      ) : null}
    </div>
  );
}

export const LiveScribeFlow: Story = { render: () => <LiveScribe /> };
export const LiveScribeFlowDark: Story = {
  render: () => <LiveScribe />,
  globals: DARK,
};

function RecorderStatuses() {
  return (
    <div className="grid max-w-5xl gap-s6 md:grid-cols-2">
      {SCRIBE_RECORDER_STATUSES.map((status) => (
        <Card key={status}>
          <CardHeader title={status} />
          <CardBody>
            <AmbientScribeRecorder
              status={status}
              elapsedSeconds={161}
              levels={[0.3, 0.8, 0.55, 0.95, 0.4]}
              interim="worse at night… disturbs her sleep…"
              language="Telugu + English"
              consent={
                <p>The patient agreed to this consult being recorded.</p>
              }
              deniedHelp={
                <a
                  className="font-semibold text-primary-strong underline"
                  href="#mic"
                >
                  How to enable the microphone
                </a>
              }
              steps={STEP_LABELS.map((label, index) => ({
                label,
                state: index < 2 ? 'done' : index === 2 ? 'active' : 'pending',
              }))}
              draft={
                <p className="text-control text-ink-2">
                  The SOAP draft is ready below.
                </p>
              }
            />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

// Every recorder status, held still.
export const RecorderAllStatuses: Story = {
  render: () => <RecorderStatuses />,
};
export const RecorderAllStatusesDark: Story = {
  render: () => <RecorderStatuses />,
  globals: DARK,
};

function SoapDrafts() {
  return (
    <div className="grid max-w-6xl gap-s6 xl:grid-cols-2">
      <SoapDraftBlock
        title="AI SOAP draft — streaming"
        approverName="Dr. K. Ramesh"
        status="generating"
        revealed={2}
        sections={SECTIONS}
      />
      <SoapDraftBlock
        title="AI SOAP draft — plan blocked"
        approverName="Dr. K. Ramesh"
        defaultSections={SECTIONS}
        onDictatePlan={() => undefined}
        source={SOURCE}
      />
      <SoapDraftBlock
        title="AI SOAP draft — approved"
        approverName="Dr. K. Ramesh"
        status="approved"
        approvedBy="Dr. K. Ramesh"
        approvedAt="10:52 AM"
        sections={{ ...SECTIONS, plan: PLAN }}
        source={SOURCE}
      />
    </div>
  );
}

// Streaming, the plan blocked, and approved: Telugu with its English gloss.
export const SoapDraftStates: Story = { render: () => <SoapDrafts /> };
export const SoapDraftStatesDark: Story = {
  render: () => <SoapDrafts />,
  globals: DARK,
};

const SAID =
  '“GM-03 Irfan, temperature nooru point four, pulse ninety-six, BP one twenty-two by seventy-eight, respiratory rate nineteen, SpO₂ ninety-eight room air, sugar nooru four.”';

const PARSED: VoiceParsed = {
  temp: { value: '100.4', confidence: 'low', heard: 'nooru point four' },
  pulse: { value: '96' },
  sys: { value: '122' },
  dia: { value: '78' },
  rr: { value: '19' },
  spo2: { value: '98' },
  grbs: { value: '104' },
};

const LAST = {
  temp: '100.6',
  pulse: '98',
  sys: '120',
  dia: '76',
  rr: '20',
  spo2: '97',
  pain: '2',
  grbs: '112',
};

const VOICE_SOURCE = (
  <AiSourceLine label="Transcribed">
    on the tablet, 11 seconds of speech, Telugu-English code-switched. Numbers
    are only taken from the words you said; a field you did not speak stays
    empty.
  </AiSourceLine>
);

function NurseVoiceEntries() {
  const states: Array<{ status: VoiceEntryStatus; transcript: string }> = [
    {
      status: 'listening',
      transcript: '“GM-03 Irfan, temperature nooru point four, pulse',
    },
    { status: 'parsed', transcript: SAID },
    { status: 'approved', transcript: SAID },
  ];
  return (
    <div className="flex max-w-3xl flex-col gap-s6">
      {states.map(({ status, transcript }) => (
        <VoiceEntryCapture
          key={status}
          title={`Voice entry — GM-03 (${status})`}
          approverName="Mary Grace"
          {...(status === 'parsed' ? { defaultStatus: status } : { status })}
          transcript={transcript}
          parsed={status === 'listening' ? undefined : PARSED}
          lastValues={LAST}
          approvedBy={status === 'approved' ? 'Mary Grace' : undefined}
          approvedAt={status === 'approved' ? '10:47 AM' : undefined}
          source={status === 'listening' ? undefined : VOICE_SOURCE}
        />
      ))}
    </div>
  );
}

// Listening; parsed with one low-confidence value (temperature, also above range) and pain not
// spoken; approved. The parsed one is live: edit, Approve, Undo, Say it again.
export const NurseVoiceEntry: Story = { render: () => <NurseVoiceEntries /> };
export const NurseVoiceEntryDark: Story = {
  render: () => <NurseVoiceEntries />,
  globals: DARK,
};
