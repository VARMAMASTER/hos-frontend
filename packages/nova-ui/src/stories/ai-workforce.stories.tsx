import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AiActionFeed,
  type AiAction,
} from '../components/ai-action-feed/ai-action-feed';
import {
  AiQualityScorecard,
  type AiQualityThreshold,
} from '../components/ai-quality-scorecard/ai-quality-scorecard';
import {
  AlgorithmChangeGate,
  type ChangeGateCheck,
} from '../components/algorithm-change-gate/algorithm-change-gate';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { FleetKillSwitch } from '../components/fleet-kill-switch/fleet-kill-switch';
import { HeroBand } from '../components/hero-band/hero-band';
import { LearnedPreferenceRow } from '../components/learned-preference-row/learned-preference-row';
import { LiveDot } from '../components/live-dot/live-dot';
import { WorkerCard, WorkerGrid } from '../components/worker-card/worker-card';

// The AI workforce and its oversight in one place: who the AI workers are and what they did today,
// how good their drafts are, the fleet kill switch and the change gate, and what one doctor's agent
// has learned. Every patient, member of staff and hospital here is fictional. Flip the toolbar's
// theme, material and scheme, or open the Dark stories.
const meta = { title: 'AI/Workforce' } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DARK = { scheme: 'dark' } as const;

const HERO_STATS = [
  { value: '1,284', label: 'actions taken', delta: '▲ 19% vs 1,079' },
  { value: '96%', label: 'approved as-drafted', delta: '▲ 2 pts vs 94%' },
  { value: '0', label: 'sent without approval', delta: '0 since go-live' },
];

const ACTIONS: AiAction[] = [
  {
    id: 'a6',
    agent: 'Discharge Drafter',
    body: 'drafted a discharge summary for B. Srinu — post-op knee, day 4, Inj. Ceftriaxone course completed.',
    time: '12:15 PM',
    resolution: 'pending',
  },
  {
    id: 'a5',
    agent: 'Billing Agent',
    body: 'drafted pharmacy bill ₹1,240 for Lakshmi Devi — GST 12% applied, consult exempt.',
    time: '11:54 AM',
    resolution: 'approved',
    resolutionLabel: 'Approved by Ravi Teja',
  },
  {
    id: 'a4',
    agent: 'WhatsApp Assistant',
    body: 'could not match a refund question to any bill; handed to the front desk.',
    time: '11:31 AM',
    resolution: 'escalated',
  },
  {
    id: 'a3',
    agent: 'Lab Summarizer',
    body: 'sent a CBC + TSH summary to Padma Sree in Telugu — “అన్ని విలువలు సాధారణ పరిధిలో ఉన్నాయి”.',
    time: '10:18 AM',
    resolution: 'approved',
    resolutionLabel: 'Signed off by Prasad',
    lang: 'te',
  },
  {
    id: 'a2',
    agent: 'AI Scribe',
    body: 'drafted a consult note for Dr. K. Ramesh — Lakshmi Devi (58F, T2DM) follow-up.',
    time: '09:47 AM',
    resolution: 'approved',
    resolutionLabel: 'Approved in 40s',
  },
  {
    id: 'a1',
    agent: 'WhatsApp Assistant',
    body: 'booked K. Manjula (36F) — Gynecology, token T-04, tomorrow 10:30 AM with Dr. Sunitha Rao.',
    time: '09:42 AM',
    resolution: 'approved',
    resolutionLabel: 'Confirmed by Swapna',
  },
];

function Overview() {
  return (
    <div className="flex flex-col gap-5">
      <HeroBand
        title="Your AI staff saved 212 hours this month"
        description="1 – 18 Jul 2026 · 5 AI workers · every output approved by a person"
      >
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-4">
          {HERO_STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="text-[11px] text-(color:--nova-hero-ink-2)">
                {stat.label}
              </dt>
              <dd className="font-display text-[20px] font-bold tabular-nums">
                {stat.value}
              </dd>
              <dd className="text-[10.5px] text-(color:--nova-hero-ink-2) tabular-nums">
                {stat.delta}
              </dd>
            </div>
          ))}
        </dl>
      </HeroBand>
      <WorkerGrid aria-label="AI workers">
        <WorkerCard
          name="WhatsApp Assistant"
          role="Front desk · Te/En/Hi"
          stat="23 chats answered · 14 bookings today"
          status="working"
          tier="green"
          tierDetail="productivity"
        />
        <WorkerCard
          name="AI Scribe"
          role="Consult notes · 4 doctors"
          stat="48 notes drafted · avg approval 38 sec"
          tier="green"
          tierDetail="productivity"
        />
        <WorkerCard
          name="Billing Agent"
          role="OPD + IPD · GST-aware"
          stat="31 bills drafted · ₹4,320 unbilled caught"
          tier="green"
          tierDetail="productivity"
        />
        <WorkerCard
          name="Discharge Drafter"
          role="IPD summaries"
          stat="3 summaries drafted · 4.2 hrs saved today"
          defaultEnabled={false}
          tier="green"
          tierDetail="productivity"
        />
        <WorkerCard
          name="Lab Summarizer"
          role="Patient reports · Telugu"
          stat="19 summaries sent in Telugu today"
          status="error"
          errorMessage="SMS gateway is not answering; summaries are queued."
          tier="amber"
          tierDetail="reference"
        />
      </WorkerGrid>
      {/* The feed is its own opaque panel, so it sits under a heading rather than in a card. */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[17px] font-semibold tracking-h2 text-ink">
            Everything your AI did today
          </h2>
          <LiveDot label="Live · updates every minute" />
        </div>
        <AiActionFeed actions={ACTIONS} />
      </section>
    </div>
  );
}

export const WorkforceOverview: Story = { render: () => <Overview /> };
export const WorkforceOverviewDark: Story = {
  render: () => <Overview />,
  globals: DARK,
};

const RULE: AiQualityThreshold[] = [
  { metric: 'approvedAsIs', watch: 75, drift: 60 },
  { metric: 'avgEdits', watch: 2, drift: 3 },
];

const trend = (values: number[]) =>
  values.map((approvedAsIs, index) => ({
    label: `${index * 3 + 1} Jul`,
    approvedAsIs,
  }));

function Scorecards() {
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <AiQualityScorecard
        name="AI Scribe"
        description="Consultation notes"
        metrics={{
          drafts: 1842,
          approvedAsIs: 84.1,
          avgEdits: 0.9,
          rejected: 1.8,
        }}
        thresholds={RULE}
        trend={trend([80.2, 81.0, 82.4, 83.1, 83.9, 84.1])}
        fleet={{ approvedAsIs: 79.4 }}
      />
      <AiQualityScorecard
        name="Lab Summarizer"
        description="Plain-language result summaries"
        metrics={{
          drafts: 612,
          approvedAsIs: 71.9,
          avgEdits: 1.7,
          rejected: 5.6,
        }}
        thresholds={RULE}
        trend={trend([74.0, 73.2, 72.8, 72.1, 71.9, 71.9])}
        fleet={{ approvedAsIs: 74.5 }}
      />
      <AiQualityScorecard
        name="Discharge Drafter"
        description="Discharge summaries"
        metrics={{
          drafts: 178,
          approvedAsIs: 58.4,
          avgEdits: 3.6,
          rejected: 9,
        }}
        thresholds={RULE}
        trend={trend([72.0, 70.5, 66.1, 63.0, 60.2, 58.4])}
        fleet={{ approvedAsIs: 71.2 }}
        driftMessage="Concentrated in Orthopedics since the TKR package pathway was added on 09 Jul."
        driftAction={
          <Button variant="ai" size="sm">
            Approve re-grounding
          </Button>
        }
        corrections={[
          {
            id: 'c1',
            label: 'Discharge summary uses the old TKR physio schedule',
            who: 'Dr. P. Anil Kumar',
            count: 12,
            timeLost: '38 min',
          },
          {
            id: 'c2',
            label: 'Follow-up written as a weekday, not a date',
            who: 'Sister Vasavi',
            count: 5,
            timeLost: '9 min',
            resolved: 'Fixed 12 Jul',
          },
        ]}
        onOpenCorrection={() => undefined}
        rejections={[
          {
            id: 'r1',
            reason: 'Carried the old TKR physio schedule',
            count: 11,
            worker: 'Discharge Drafter',
            outcome: 'Bundled into the drift alert — awaiting your approval',
          },
        ]}
      />
    </div>
  );
}

export const QualityScorecards: Story = { render: () => <Scorecards /> };
export const QualityScorecardsDark: Story = {
  render: () => <Scorecards />,
  globals: DARK,
};

const CHECKS: ChangeGateCheck[] = [
  {
    id: 'g1',
    name: 'Code-switched dictation · 240 synthetic cases',
    result: '97.1%',
    threshold: '≥ 95%',
    status: 'pass',
  },
  {
    id: 'g2',
    name: 'Drug names vs licensed formulary · 180 cases',
    result: '99.2%',
    threshold: '≥ 99%',
    status: 'pass',
  },
  {
    id: 'g3',
    name: 'Negation handling ("no chest pain") · 120 cases',
    result: '86.0%',
    threshold: '≥ 95%',
    status: 'fail',
    failure:
      '17 of 120 cases charted a negated symptom as present, 11 of them in code-switched dictation.',
  },
  {
    id: 'g4',
    name: 'Unsupported-claim probe · 200 adversarial cases',
    result: '0.3%',
    threshold: '≤ 0.5%',
    status: 'pass',
  },
];

function FleetControl() {
  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <Card>
        <CardHeader
          title="AI workers across the fleet"
          description="Turning a worker off asks why, and the reason reaches every affected hospital's audit log"
        />
        <CardBody>
          <FleetKillSwitch
            worker="AI Scribe"
            description="Consultation notes · v4.2 on 8 tenants"
            scope="fleet"
            tier="green"
            tierDetail="productivity"
            impact={[
              'Stops consultation drafts at 10 hospitals within seconds',
              'Doctors keep working; they type their notes',
            ]}
            actor="Dr. G. Prakash"
          />
          <FleetKillSwitch
            worker="Discharge Drafter"
            description="Discharge summaries · v2.4 on 4 tenants"
            scope="fleet"
            tier="green"
            tierDetail="productivity"
            impact={["Stops 14 hospitals' discharge drafts"]}
            defaultState="disabled"
            defaultRecord={{
              action: 'disabled',
              by: 'Dr. G. Prakash',
              at: '18 Jul, 04:20 PM',
              reason:
                'Edit distance tripled at 2 tenants and the cause is unknown — off until root-caused.',
            }}
            actor="Dr. G. Prakash"
          />
          <FleetKillSwitch
            worker="Sepsis early prediction"
            description="Predicts deterioration from charted vitals"
            scope="fleet"
            tier="red"
            tierDetail="medical device"
            impact="—"
            lockedReason="A medical device under the Medical Device Rules 2017. Awaits a CDSCO Class C licence; no HOS role can override this."
            actor="Dr. G. Prakash"
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Algorithm Change Protocol"
          description="A model or prompt change reaches no tenant until every synthetic suite passes"
        />
        <CardBody>
          <AlgorithmChangeGate
            title="AI Scribe v4.2 → v4.3"
            headingLevel={3}
            description="Better handling of Telugu–English code-switched dictation."
            checks={CHECKS}
            promoteLabel="Promote to canary"
            actor="Dr. G. Prakash"
          />
        </CardBody>
      </Card>
    </div>
  );
}

export const KillSwitchAndGate: Story = { render: () => <FleetControl /> };
export const KillSwitchAndGateDark: Story = {
  render: () => <FleetControl />,
  globals: DARK,
};

function MyAiTeam() {
  return (
    <Card className="max-w-2xl">
      <CardHeader
        title="What it has learned about you"
        description="AI Scribe · Dr. K. Ramesh · every learned habit can be read, corrected or switched off"
      />
      <CardBody className="flex flex-col gap-2">
        <LearnedPreferenceRow
          learned="You always add a renal-function note for older patients on Metformin"
          why="Learned from 6 corrections you made in 30 days."
          does="every draft for a patient over 55 on Metformin carries your renal line and cites the eGFR it read. It still does not pick a dose."
          onSubmitCorrection={() => undefined}
        />
        <LearnedPreferenceRow
          learned="Your Telugu counselling register is spoken, not formal"
          why="Learned from 14 of your own Telugu lines rewritten. You say షుగర్, never మధుమేహం."
          does="drafts every patient-facing Telugu line in your spoken register."
          onSubmitCorrection={() => undefined}
        />
        <LearnedPreferenceRow
          learned="You dictate vitals before symptoms"
          why="Learned from the order of speech in 412 transcripts."
          does="lays the draft out in the order you spoke it."
          onSubmitCorrection={() => undefined}
        />
        <LearnedPreferenceRow
          learned="Shortening your Subjective section to two lines"
          why=""
          whenOff="You switched this off on 04 Jul, after a shortened S dropped a patient's mention of night sweats. It will not be re-learned unless you turn it back on."
          does="compress S to the two most clinically loaded sentences."
          defaultEnabled={false}
          onSubmitCorrection={() => undefined}
        />
      </CardBody>
    </Card>
  );
}

export const LearnedPreferences: Story = { render: () => <MyAiTeam /> };
export const LearnedPreferencesDark: Story = {
  render: () => <MyAiTeam />,
  globals: DARK,
};
