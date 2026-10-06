import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EXAMPLE_THEMES } from '../../stories/example-themes';
import { NovaThemeProvider } from '../../theme/theme-provider';
import { isNovaMaterial } from '../../tokens/material';
import { isNovaScheme } from '../../tokens/scheme';
import { Card, CardBody, CardHeader } from '../card/card';
import { KpiTile } from '../kpi-tile/kpi-tile';
import { TopBar } from '../top-bar/top-bar';
import {
  useDemoConversation,
  type DemoAnswer,
} from '../ai-chat-thread/ai-chat-thread.stories';
import { ChatAnswer } from '../ai-chat-thread/chat-answer';
import { ChatQuestion } from '../ai-chat-thread/chat-question';
import { AiCopilotDock } from './ai-copilot-dock';

// The prototype's global answer bank, abridged: a hospital's live numbers (sample data).
const HOSPITAL_BANK: readonly DemoAnswer[] = [
  {
    keywords: ['revenue', 'collection'],
    text: 'Today’s revenue is **₹3,84,600**, 8% above the 4-week average. IPD contributed ₹2,94,300, OPD ₹64,300, pharmacy ₹26,000.',
    followups: ['Which department earned most?', 'Any unbilled items?'],
  },
  {
    keywords: ['occupancy', 'bed'],
    text: 'IPD occupancy is **78%** (42 of 54 beds). ICU is at **8 of 8**, at capacity.',
  },
  {
    keywords: ['stat', 'lab'],
    text: '**3 STAT orders** are open: 2 troponin, 1 potassium. The oldest is 22 minutes old.',
  },
  {
    keywords: ['follow', 'pending'],
    text: '**34 patients** are overdue for follow-up. The Follow-up Agent can draft WhatsApp reminders for your approval.',
  },
  {
    keywords: [],
    text: 'I can answer from this hospital’s live data: try **“today’s revenue”**, **“bed occupancy”** or **“pending follow-ups”**.',
  },
];

const SUGGESTIONS = [
  'Any STAT orders?',
  'Bed occupancy right now?',
  'Pending follow-ups?',
];

type Globals = Record<string, unknown>;

// A mock page in a frame. The frame is its own themed root (the toolbar's theme, material and
// scheme), so the dock portals its panel into it, and it is transformed, so it is the containing
// block for the fixed orb and panel: both stay inside the story instead of the whole canvas.
function MockPage({
  globals,
  top,
  children,
}: {
  globals: Globals;
  top?: ReactNode;
  children: ReactNode;
}) {
  const material = globals['material'];
  const scheme = globals['scheme'];
  return (
    <NovaThemeProvider
      theme={
        EXAMPLE_THEMES[
          globals['hospitalTheme'] as keyof typeof EXAMPLE_THEMES
        ] ?? EXAMPLE_THEMES.hosViolet
      }
      material={isNovaMaterial(material) ? material : undefined}
      scheme={isNovaScheme(scheme) ? scheme : undefined}
      className="nova-canvas relative h-[640px] overflow-hidden rounded-lg border border-border font-sans text-ink [transform:translateZ(0)]"
    >
      <TopBar actions={top}>
        <span className="font-display text-[15px] font-semibold">
          Doctor’s desk
        </span>
      </TopBar>
      <div className="grid gap-4 p-6 md:grid-cols-3">
        <KpiTile label="OPD today" value={86} tone="good" trend="up" />
        <KpiTile label="Beds free" value={12} tone="warn" trend="down" />
        <KpiTile label="Pending labs" value={9} trend="flat" />
        <Card className="md:col-span-3">
          <CardHeader title="Today’s list" headingLevel={2} />
          <CardBody className="text-[13.5px] text-ink-2">
            14 patients waiting, 3 reviews due before noon.
          </CardBody>
        </Card>
      </div>
      {children}
    </NovaThemeProvider>
  );
}

const meta = {
  title: 'AI/AiCopilotDock',
  component: AiCopilotDock,
  args: { onAsk: () => undefined, suggestions: SUGGESTIONS },
  render: (args, { globals }) => (
    <MockPage globals={globals}>
      <AiCopilotDock {...args} />
    </MockPage>
  ),
} satisfies Meta<typeof AiCopilotDock>;

export default meta;
type Story = StoryObj<typeof meta>;

// The corner orb and its labelled pill, closed.
export const Closed: Story = {};

// Open on a fresh conversation: the page's suggestions and the composer.
export const Open: Story = { args: { defaultOpen: true } };

// Open after a question, with the answer's follow-ups.
export const WithConversation: Story = {
  args: {
    defaultOpen: true,
    children: [
      <ChatQuestion key="q">Today’s revenue?</ChatQuestion>,
      <ChatAnswer
        key="a"
        text={HOSPITAL_BANK[0]?.text}
        followups={HOSPITAL_BANK[0]?.followups}
        onFollowup={() => undefined}
      />,
    ],
  },
};

// Retracted to the orb alone, as it is after the first use.
export const Compact: Story = { args: { compact: true } };

// Live: ask, watch it think and stream, stop it with Stop or Escape. Ctrl/Cmd+K opens it.
export const Live: Story = {
  render: function Render(args, { globals }) {
    const demo = useDemoConversation(HOSPITAL_BANK, 'Checking live data');
    return (
      <MockPage globals={globals}>
        <AiCopilotDock
          {...args}
          onAsk={demo.ask}
          busy={demo.busy}
          onStop={demo.stop}
        >
          {demo.children}
        </AiCopilotDock>
      </MockPage>
    );
  },
};

// The app-bar pill (the prototype's .tb-ask), the panel docked under it.
export const InTheAppBar: Story = {
  render: function Render(args, { globals }) {
    const demo = useDemoConversation(HOSPITAL_BANK, 'Checking live data');
    return (
      <MockPage
        globals={globals}
        top={
          <AiCopilotDock
            {...args}
            placement="top"
            onAsk={demo.ask}
            busy={demo.busy}
            onStop={demo.stop}
          >
            {demo.children}
          </AiCopilotDock>
        }
      >
        {null}
      </MockPage>
    );
  },
  args: { defaultOpen: true },
};
