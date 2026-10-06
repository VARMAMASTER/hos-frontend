import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiChatThread } from '../components/ai-chat-thread/ai-chat-thread';
import { AiThinking } from '../components/ai-chat-thread/ai-thinking';
import { ChatAnswer } from '../components/ai-chat-thread/chat-answer';
import { ChatComposer } from '../components/ai-chat-thread/chat-composer';
import { ChatQuestion } from '../components/ai-chat-thread/chat-question';
import { AiCopilotDock } from '../components/ai-copilot-dock/ai-copilot-dock';
import { AiProgressSteps } from '../components/ai-progress-steps/ai-progress-steps';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { KpiTile } from '../components/kpi-tile/kpi-tile';
import { TopBar } from '../components/top-bar/top-bar';
import { Surface } from '../primitives/surface';
import type { NovaScheme } from '../tokens/scheme';
import { NovaThemeProvider } from '../theme/theme-provider';
import { EXAMPLE_THEMES } from './example-themes';

// The AI conversation batch, in the light and the dark scheme side by side, under the toolbar's
// hospital theme and material. Sample data only: a fictional patient and hospital.
const meta = { title: 'AI/Conversation' } satisfies Meta;

export default meta;

type ThemeKey = keyof typeof EXAMPLE_THEMES;

function BothSchemes({
  themeKey,
  children,
}: {
  themeKey: unknown;
  children: (scheme: NovaScheme) => ReactNode;
}) {
  const theme =
    EXAMPLE_THEMES[themeKey as ThemeKey] ?? EXAMPLE_THEMES.hosViolet;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {(['light', 'dark'] as const).map((scheme) => (
        <NovaThemeProvider
          key={scheme}
          theme={theme}
          scheme={scheme}
          className="nova-canvas flex flex-col gap-4 rounded-lg p-4 font-sans text-ink"
        >
          <p className="text-[12px] font-semibold text-ink-2">
            {scheme === 'light' ? 'Light' : 'Dark'}
          </p>
          {children(scheme)}
        </NovaThemeProvider>
      ))}
    </div>
  );
}

function State({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Surface material="card" radius="md" className="flex flex-col">
      <p className="border-b border-border px-4 py-2 text-[12px] font-semibold text-ink-2">
        {title}
      </p>
      {children}
    </Surface>
  );
}

const QUESTION = 'When was her last HbA1c?';
const ANSWER =
  'Her last **HbA1c was 8.4%** on 12 Sep, up from 7.9% in June. She is on **Metformin 1000mg BD** since 2022.';

// A doctor's patient-history Q&A, state by state.
export const PatientHistory: StoryObj = {
  render: (_args, { globals }) => (
    <BothSchemes themeKey={globals['hospitalTheme']}>
      {() => (
        <>
          <State title="Empty">
            <AiChatThread
              logClassName="px-4 py-3"
              suggestions={[QUESTION, 'Any allergies?', 'Kidney function?']}
              onSuggestion={() => undefined}
            />
            <ChatComposer
              className="border-t border-border px-4 pb-4 pt-2.5"
              onSend={() => undefined}
            />
          </State>
          <State title="Thinking">
            <AiChatThread logClassName="px-4 py-3" busy>
              <ChatQuestion>{QUESTION}</ChatQuestion>
              <AiThinking label="Reading her record" />
            </AiChatThread>
          </State>
          <State title="Streaming (Stop in the composer, or Escape)">
            <AiChatThread logClassName="px-4 py-3" busy>
              <ChatQuestion>{QUESTION}</ChatQuestion>
              <ChatAnswer
                status="streaming"
                text="Her last **HbA1c was 8.4%** on 12 Sep, up from"
              />
            </AiChatThread>
            <ChatComposer
              className="border-t border-border px-4 pb-4 pt-2.5"
              onSend={() => undefined}
              busy
              onStop={() => undefined}
            />
          </State>
          <State title="Done, with follow-ups">
            <AiChatThread logClassName="px-4 py-3">
              <ChatQuestion>{QUESTION}</ChatQuestion>
              <ChatAnswer
                text={ANSWER}
                source="From the hospital lab report of 12 Sep"
                followups={[
                  'Is the Metformin dose safe for her kidneys?',
                  'Any allergies?',
                ]}
                onFollowup={() => undefined}
              />
            </AiChatThread>
          </State>
          <State title="Error, with Retry">
            <AiChatThread logClassName="px-4 py-3">
              <ChatQuestion>Any imaging on file?</ChatQuestion>
              <ChatAnswer status="error" onRetry={() => undefined} />
            </AiChatThread>
          </State>
          <State title="Telugu, with an English gloss">
            <AiChatThread logClassName="px-4 py-3">
              <ChatQuestion lang="te">ఆమె షుగర్ ఎలా ఉంది?</ChatQuestion>
              <ChatAnswer
                lang="te"
                text="ఆమె చివరి **HbA1c 8.4%** — జూన్‌లో 7.9% నుండి పెరిగింది."
                gloss="Her last HbA1c is 8.4%, up from 7.9% in June."
              />
            </AiChatThread>
          </State>
        </>
      )}
    </BothSchemes>
  ),
};

// Its own themed root, transformed: the dock portals its panel into the nearest themed root, and
// the transform makes that root the containing block for the fixed orb and panel, so both stay
// inside the mock page.
function MockPage({
  open,
  themeKey,
  scheme,
}: {
  open: boolean;
  themeKey: unknown;
  scheme: NovaScheme;
}) {
  return (
    <NovaThemeProvider
      theme={EXAMPLE_THEMES[themeKey as ThemeKey] ?? EXAMPLE_THEMES.hosViolet}
      scheme={scheme}
      className="nova-canvas relative h-[560px] overflow-hidden rounded-lg border border-border font-sans text-ink [transform:translateZ(0)]"
    >
      <TopBar>
        <span className="font-display text-[15px] font-semibold">
          Doctor’s desk
        </span>
      </TopBar>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <KpiTile label="OPD today" value={86} tone="good" trend="up" />
        <KpiTile label="Beds free" value={12} tone="warn" trend="down" />
        <Card className="sm:col-span-2">
          <CardHeader title="Today’s list" headingLevel={2} />
          <CardBody className="text-[13.5px] text-ink-2">
            14 patients waiting, 3 reviews due before noon.
          </CardBody>
        </Card>
      </div>
      <AiCopilotDock
        defaultOpen={open}
        shortcut={false}
        onAsk={() => undefined}
        suggestions={[
          'Any STAT orders?',
          'Bed occupancy right now?',
          'Pending follow-ups?',
        ]}
      >
        {open ? (
          <>
            <ChatQuestion>Bed occupancy right now?</ChatQuestion>
            <ChatAnswer
              text="IPD occupancy is **78%** (42 of 54 beds). ICU is at **8 of 8**, at capacity."
              followups={['Who can be discharged today?']}
              onFollowup={() => undefined}
            />
          </>
        ) : null}
      </AiCopilotDock>
    </NovaThemeProvider>
  );
}

// The copilot dock on a mock page, closed (the orb and its pill) and open.
export const CopilotDock: StoryObj = {
  render: (_args, { globals }) => (
    <BothSchemes themeKey={globals['hospitalTheme']}>
      {(scheme) => (
        <>
          <MockPage
            open={false}
            themeKey={globals['hospitalTheme']}
            scheme={scheme}
          />
          <MockPage open themeKey={globals['hospitalTheme']} scheme={scheme} />
        </>
      )}
    </BothSchemes>
  ),
};

const STEPS = [
  'Reading 12 nursing notes',
  'Reading 8 vitals',
  'Reading the lab report',
  'Drafting the course in hospital',
];

// Progress steps at each stage.
export const ProgressSteps: StoryObj = {
  render: (_args, { globals }) => (
    <BothSchemes themeKey={globals['hospitalTheme']}>
      {() => (
        <Surface
          material="card"
          radius="md"
          className="grid gap-6 p-4 sm:grid-cols-3"
        >
          <AiProgressSteps steps={STEPS} currentIndex={0} />
          <AiProgressSteps steps={STEPS} currentIndex={2} />
          <AiProgressSteps
            steps={STEPS}
            currentIndex={STEPS.length}
            summary="Done in 1.8 s"
          />
        </Surface>
      )}
    </BothSchemes>
  ),
};
