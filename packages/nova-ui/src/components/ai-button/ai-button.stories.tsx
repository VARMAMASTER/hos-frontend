import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NovaThemeProvider } from '../../theme/theme-provider';
import type { NovaMaterial } from '../../tokens/material';
import type { NovaScheme } from '../../tokens/scheme';
import { Button } from '../button/button';
import { AiButton, type AiButtonState } from './ai-button';

const meta = {
  title: 'Components/AiButton',
  component: AiButton,
  args: { children: 'Draft summary' },
  argTypes: {
    state: {
      control: 'select',
      options: [undefined, 'idle', 'thinking', 'done'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The AI action: animated and playful, so it is easy to find and feels alive, while an ordinary Button stays plain and solid. Hover or Tab to it and the ✦ twinkles, one band of light sweeps across and the edge glows; press and it squashes and springs back. `loading` (or state="thinking") shows "Thinking…" with a sparkle circling the label and a gentle shimmer; state="done" bursts a few sparkles and settles a check into the label. `idle` adds a slow breathing glow and is off by default so a clinical screen stays calm. Every movement is motion-safe: under prefers-reduced-motion nothing moves and each state is still told apart by its fill, its label, the ✦ and the check. The ✦ and a text label are always drawn, so AI is never marked by colour alone. The caller owns the state: AiButton never starts or finishes the work.',
      },
    },
  },
} satisfies Meta<typeof AiButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Breathing: Story = { args: { idle: true } };
export const Thinking: Story = { args: { state: 'thinking' } };
export const Done: Story = { args: { state: 'done' } };
export const Disabled: Story = { args: { disabled: true } };
export const FullWidth: Story = {
  args: { fullWidth: true },
  render: (args) => (
    <div className="max-w-sm">
      <AiButton {...args} />
    </div>
  ),
};

const DRAFT_MS = 1800;
const DONE_MS = 2400;

// idle -> thinking -> done on click, on timers (no network): "Draft summary" is requested, the draft
// "arrives" after DRAFT_MS, and the button rests as done before it goes back to idle.
function DraftSummary({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [state, setState] = useState<AiButtonState>('idle');
  const timers = useRef<number[]>([]);
  useEffect(
    () => () => timers.current.forEach((timer) => window.clearTimeout(timer)),
    [],
  );
  const start = () => {
    setState('thinking');
    timers.current.push(
      window.setTimeout(() => setState('done'), DRAFT_MS),
      window.setTimeout(() => setState('idle'), DRAFT_MS + DONE_MS),
    );
  };
  return (
    <AiButton size={size} state={state} onClick={start}>
      Draft summary
    </AiButton>
  );
}

export const Interactive: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <DraftSummary />
      <p className="max-w-md text-[12px] text-ink-2">
        Press it: idle, then thinking for about two seconds, then done, then
        back to idle. A timer stands in for the real work.
      </p>
    </div>
  ),
};

const STATES: { name: string; state: AiButtonState; idle?: boolean }[] = [
  { name: 'Idle', state: 'idle' },
  { name: 'Idle, breathing', state: 'idle', idle: true },
  { name: 'Thinking', state: 'thinking' },
  { name: 'Done', state: 'done' },
];

function Grid({
  scheme,
  material,
}: {
  scheme?: NovaScheme;
  material?: NovaMaterial;
}) {
  return (
    <NovaThemeProvider
      scheme={scheme}
      material={material}
      className="nova-canvas flex flex-col gap-4 rounded-lg p-4 text-ink"
    >
      <div className="grid grid-cols-[auto_repeat(2,max-content)_max-content] items-center gap-x-4 gap-y-3">
        <span />
        <span className="text-[11px] font-semibold text-ink-2">md</span>
        <span className="text-[11px] font-semibold text-ink-2">sm</span>
        <span className="text-[11px] font-semibold text-ink-2">Disabled</span>
        {STATES.map(({ name, state, idle }) => (
          <div key={name} className="contents">
            <span className="text-[12px] text-ink-2">{name}</span>
            <AiButton state={state} idle={idle}>
              Draft summary
            </AiButton>
            <AiButton size="sm" state={state} idle={idle}>
              Draft summary
            </AiButton>
            <AiButton state={state} idle={idle} disabled>
              Draft summary
            </AiButton>
          </div>
        ))}
      </div>
      <DraftSummary />
    </NovaThemeProvider>
  );
}

// Every state and size, and the disabled button, in light and in dark (each a subtree, whatever the
// toolbar says).
export const AllStates: StoryObj = {
  render: () => (
    <div className="grid gap-4 lg:grid-cols-2">
      <Grid scheme="light" />
      <Grid scheme="dark" />
    </div>
  ),
};

// The same button under each material, in both schemes: glass, frost and solid.
export const Materials: StoryObj = {
  render: () => (
    <div className="grid gap-4 lg:grid-cols-2">
      {(['glass', 'frost', 'solid'] as const).flatMap((material) =>
        (['light', 'dark'] as const).map((scheme) => (
          <Grid
            key={`${material}-${scheme}`}
            scheme={scheme}
            material={material}
          />
        )),
      )}
    </div>
  ),
};

// An ordinary Button beside the AI one: only the AI button moves.
export const BesidePlainButtons: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Register patient</Button>
      <Button variant="outline">Edit</Button>
      <AiButton>Draft summary</AiButton>
      <Button variant="ghost">Cancel</Button>
    </div>
  ),
};

// Telugu and Hindi labels: the words are the caller's, and so are the fixed labels.
export const Multilingual: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <AiButton lang="te" thinkingLabel="ఆలోచిస్తోంది…" doneLabel="పూర్తయింది">
        సారాంశం రూపొందించండి
      </AiButton>
      <AiButton
        lang="hi"
        state="thinking"
        thinkingLabel="सोच रहा है…"
        doneLabel="हो गया"
      >
        सारांश बनाएँ
      </AiButton>
      <AiButton lang="hi" state="done" doneLabel="हो गया">
        सारांश बनाएँ
      </AiButton>
    </div>
  ),
};
