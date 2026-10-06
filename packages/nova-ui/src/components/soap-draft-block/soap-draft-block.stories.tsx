import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiSourceLine } from '../ai-source-line/ai-source-line';
import { SoapDraftBlock, type SoapSections } from './soap-draft-block';

// Fictional patients and staff throughout, in the prototype's words (03-doctor.html).
const DRAFTED: SoapSections = {
  subjective: {
    text: '“రెండు వారాలుగా అలసట, ఎక్కువ దాహం అనిపిస్తోంది. కాళ్లలో జివ్వుమనే అనుభూతి కూడా ఉంది.”',
    gloss:
      'Patient reports fatigue and increased thirst over 2 weeks. Occasional tingling in both feet. Denies chest pain or breathlessness.',
    lang: 'te',
  },
  objective: {
    text: 'BP 148/92 mmHg · పల్స్ 82/నిమిషం · బరువు 68 కేజీలు · RBS 214 mg/dL',
    gloss:
      'BP 148/92 mmHg · Pulse 82/min · Weight 68 kg · Random blood sugar 214 mg/dL.',
    lang: 'te',
  },
  assessment: {
    text: 'టైప్ 2 డయాబెటిస్ — HbA1c 8.4%; నరాల సమస్య; బీపీ నియంత్రణలో లేదు',
    gloss:
      'Type 2 diabetes mellitus, HbA1c 8.4% today. Diabetic neuropathy, symptomatic. Hypertension, above target.',
    lang: 'te',
  },
};

const meta = {
  title: 'AI/SoapDraftBlock',
  component: SoapDraftBlock,
  args: {
    approverName: 'Dr. K. Ramesh',
    defaultSections: DRAFTED,
    onDictatePlan: () => undefined,
    source: (
      <AiSourceLine label="Transcribed from">
        consult audio 10:41–10:44 AM · Telugu + English mixed speech · S and O
        are verbatim, A restates values already in her chart, P is yours
      </AiSourceLine>
    ),
  },
} satisfies Meta<typeof SoapDraftBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

// The plan is empty by design: blocked, flagged, with "Dictate the plan".
export const PlanBlocked: Story = {};

export const Streaming: Story = {
  args: { status: 'generating', revealed: 2, source: undefined },
};

export const ReadyToApprove: Story = {
  args: {
    defaultSections: {
      ...DRAFTED,
      plan: {
        text: 'మెట్‌ఫార్మిన్ కొనసాగించండి. రెండు వారాల్లో HbA1c, KFT తో రివ్యూ.',
        gloss: 'Continue metformin. Review in two weeks with HbA1c and KFT.',
        lang: 'te',
      },
    },
  },
};

export const Approved: Story = {
  args: {
    ...ReadyToApprove.args,
    status: 'approved',
    approvedBy: 'Dr. K. Ramesh',
    approvedAt: '10:52 AM',
  },
};
