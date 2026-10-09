import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { AiBadge } from '../components/ai-badge/ai-badge';
import { AiButton } from '../components/ai-button/ai-button';
import { AiCopilotDock } from '../components/ai-copilot-dock/ai-copilot-dock';
import { AiPanel } from '../components/ai-panel/ai-panel';
import { Button } from '../components/button/button';
import { Chip } from '../components/chip/chip';
import { AiMark } from '../primitives/ai-mark';
import { NovaThemeProvider } from '../theme/theme-provider';
import { EXAMPLE_THEMES } from './example-themes';

const meta = { title: 'Design language/The AI mark' } satisfies Meta;

export default meta;

// The Care spark is the one AI mark of Nova (owner decision, 2026-10-10): a four-point spark with a
// small medical cross cut out of its heart and one twinkle. It has exactly two presentations, bare in
// the colour of its text, or white inside the AI tile, and every use sits beside a text label: the
// mark is decoration (aria-hidden), the words are what is read. At 12px the cross drops away and it
// reads as an AI spark; from about 22px up the care cross shows. The tile is painted with the HOS AI
// gradient (cyan into the brand), so it follows each hospital's theme.

const THEMES = [
  EXAMPLE_THEMES.hosViolet,
  EXAMPLE_THEMES.tealCare,
  EXAMPLE_THEMES.rose,
] as const;

// A caption under a specimen: the size, in words and pixels.
function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-s2">
      <div className="flex h-(--nova-copilot-orb) items-end justify-center">
        {children}
      </div>
      <span className="text-caption text-ink-2">{label}</span>
    </div>
  );
}

// The sizes: the shared vocabulary (xs 12px, sm 14px, md 16px, lg 20px), the tile (22px), and the two
// large specimens that show the care cross (32px and 54px), drawn in a box so only the glyph scales.
function Sizes() {
  return (
    <div className="flex flex-wrap items-end gap-s8">
      <Specimen label="xs · 12 px">
        <AiMark size="xs" className="text-ai" />
      </Specimen>
      <Specimen label="md · 16 px">
        <AiMark size="md" className="text-ai" />
      </Specimen>
      <Specimen label="lg · 20 px">
        <AiMark size="lg" className="text-ai" />
      </Specimen>
      <Specimen label="tile · 22 px">
        <AiMark tile />
      </Specimen>
      <Specimen label="32 px">
        <span className="inline-flex size-s9 text-ai [&_svg]:size-full">
          <AiMark />
        </span>
      </Specimen>
      <Specimen label="54 px">
        <span className="inline-flex size-(--nova-copilot-orb) text-ai [&_svg]:size-full">
          <AiMark />
        </span>
      </Specimen>
    </div>
  );
}

// The components that carry it, each with its label beside the mark.
function InUse() {
  return (
    <div className="flex flex-col gap-s6">
      <div className="flex flex-wrap items-center gap-s4">
        <AiBadge />
        <AiBadge label="AI summary" variant="glow" />
        <Chip tone="ai" icon={<AiMark />}>
          From 412 transcripts
        </Chip>
        <Button variant="ai">Draft summary</Button>
        <Button variant="ai" size="sm">
          Ask the panel
        </Button>
        <AiButton>Draft discharge note</AiButton>
      </div>
      <AiPanel title="Discharge summary">
        Patient stable on oral antibiotics; review in two weeks.
      </AiPanel>
      <AiPanel title="Discharge summary" state="approved">
        Patient stable on oral antibiotics; review in two weeks.
      </AiPanel>
    </div>
  );
}

function Panel({
  theme,
  scheme,
}: {
  theme: (typeof THEMES)[number];
  scheme: 'light' | 'dark';
}) {
  return (
    <NovaThemeProvider
      theme={theme}
      scheme={scheme}
      className="nova-canvas flex flex-col gap-s6 rounded-overlay p-s6 text-ink"
    >
      <p className="text-control font-semibold">
        {theme.name}, {scheme}
      </p>
      <Sizes />
      <InUse />
    </NovaThemeProvider>
  );
}

// Flip Theme, Scheme and Material in the toolbar to compare; these panels pin three hospitals in light
// and dark at once, so the tile's gradient is seen following the theme.
export const OnHospitalThemes: StoryObj = {
  name: 'Three hospital themes, light and dark',
  render: () => (
    <div className="grid gap-s6 p-s3 lg:grid-cols-2">
      {THEMES.flatMap((theme) =>
        (['light', 'dark'] as const).map((scheme) => (
          <Panel
            key={`${theme.name}-${scheme}`}
            theme={theme}
            scheme={scheme}
          />
        )),
      )}
    </div>
  ),
};

export const WithTheToolbarTheme: StoryObj = {
  name: 'Sizes and components, under the toolbar theme',
  render: () => (
    <div className="flex flex-col gap-s8 p-s3">
      <Sizes />
      <InUse />
    </div>
  ),
};

// The copilot orb carries the same glyph on its dark hero fill. A transformed frame is the
// containing block for the dock's fixed corner, so the orb stays inside the story.
export const CopilotOrb: StoryObj = {
  name: 'The copilot orb',
  render: () => (
    <div className="relative h-(--nova-measure-xs) overflow-hidden rounded-overlay border border-border [transform:translateZ(0)]">
      <AiCopilotDock onAsk={() => undefined} />
    </div>
  ),
};
