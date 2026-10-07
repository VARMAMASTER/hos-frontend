import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Chip } from '../components/chip/chip';
import { HeroBand } from '../components/hero-band/hero-band';
import { NovaThemeProvider } from '../theme/theme-provider';
import type { NovaScheme } from '../tokens/scheme';
import { EXAMPLE_THEMES } from './example-themes';

const meta = { title: 'Themes/Side by side' } satisfies Meta;

export default meta;

// Each preset as its own subtree: its top bar, its sidebar, its hero and its canvas, which all follow
// the brand, and a card whose status and AI colours stay the same for every hospital.
function Preset({
  theme,
  scheme,
}: {
  theme: (typeof EXAMPLE_THEMES)[keyof typeof EXAMPLE_THEMES];
  scheme?: NovaScheme;
}) {
  return (
    <NovaThemeProvider
      theme={theme}
      scheme={scheme}
      className="nova-canvas flex flex-col gap-s5 rounded-overlay p-s6 text-ink motion-safe:transition-colors motion-safe:duration-base motion-safe:ease-standard"
    >
      <div className="nova-chrome flex items-center justify-between rounded-card px-s6 py-s4">
        <span className="text-control font-semibold">{theme.name}</span>
        <span className="text-label text-(color:--nova-chrome-ink-2)">
          Top bar
        </span>
      </div>
      <div className="flex gap-s5">
        <div className="nova-sidebar flex w-rail shrink-0 flex-col gap-s1 rounded-card p-s5">
          <span className="text-label font-semibold">Sidebar</span>
          <span className="text-meta text-(color:--nova-chrome-ink-2)">
            Patients
          </span>
        </div>
        <HeroBand
          className="flex-1"
          title="Hero"
          description="The brand's hero band"
        />
      </div>
      <Card>
        <CardHeader
          title="Same components"
          description="This hospital's brand"
          actions={<Chip tone="ai">AI draft</Chip>}
        />
        <CardBody className="flex flex-wrap gap-s3">
          <Button size="sm">Approve</Button>
          <Button size="sm" variant="ghost">
            Edit
          </Button>
          <Chip tone="crit">Critical stays red</Chip>
        </CardBody>
      </Card>
    </NovaThemeProvider>
  );
}

export const SideBySide: StoryObj = {
  render: () => (
    <div className="grid gap-s6 md:grid-cols-2 xl:grid-cols-3">
      {Object.values(EXAMPLE_THEMES).map((theme) => (
        <Preset key={theme.name} theme={theme} />
      ))}
    </div>
  ),
};

// Every preset in both schemes at once, whatever the toolbar says: a scheme is a subtree setting,
// independent of the theme and the material.
export const LightAndDark: StoryObj = {
  render: () => (
    <div className="grid gap-s6 lg:grid-cols-2">
      {Object.values(EXAMPLE_THEMES).flatMap((theme) =>
        (['light', 'dark'] as const).map((scheme) => (
          <Preset
            key={`${theme.name}-${scheme}`}
            theme={theme}
            scheme={scheme}
          />
        )),
      )}
    </div>
  ),
};
