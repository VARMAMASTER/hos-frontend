import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from '../components/heading/heading';
import { Text } from '../components/text/text';
import { Box } from '../components/box/box';
import { Stack } from '../components/stack/stack';
import { Grid } from '../components/grid/grid';
import { Chip } from '../components/chip/chip';
import { StatusDot } from '../components/status-dot/status-dot';
import { NOVA_FONTS, type NovaFontPreset } from '../tokens/semantic';

const meta = {
  title: 'Typography/FontSwitcher',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function FontSwitcher() {
  const [selectedFont, setSelectedFont] =
    useState<NovaFontPreset>('googleSans');

  return (
    <Stack gap="s6" className="max-w-4xl">
      <Box className="rounded-card border border-border bg-surface p-s6">
        <Stack gap="s4">
          <div className="flex flex-wrap items-center justify-between gap-s3">
            <div>
              <Heading level="h2">Nova UI Multi-Font System</Heading>
              <Text tone="muted" className="mt-s1">
                Switch the active font preset below to preview real-time font
                rendering, or use the <strong>Font (T)</strong> dropdown in the
                Storybook top toolbar.
              </Text>
            </div>
            <div className="flex items-center gap-s2">
              {(
                [
                  'googleSans',
                  'ibmPlexSans',
                  'ibmPlexMono',
                  'inter',
                ] as NovaFontPreset[]
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedFont(preset)}
                  className={`rounded-control px-s3 py-s2 text-control transition-colors ${
                    selectedFont === preset
                      ? 'border border-primary bg-primary text-on-primary'
                      : 'border border-border bg-surface-2 text-ink hover:bg-primary-ghost'
                  }`}
                >
                  {preset === 'googleSans'
                    ? 'Google Sans Flex'
                    : preset === 'ibmPlexSans'
                      ? 'IBM Plex Sans'
                      : preset === 'ibmPlexMono'
                        ? 'IBM Plex Mono'
                        : 'Inter'}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-card border border-border bg-bg p-s6 transition-all"
            style={{
              fontFamily: NOVA_FONTS[selectedFont],
              ['--nova-font-body' as string]: NOVA_FONTS[selectedFont],
              ['--nova-font-display' as string]: NOVA_FONTS[selectedFont],
            }}
          >
            <Stack gap="s4">
              <div className="flex items-center gap-s3">
                <Chip tone="info">
                  Active:{' '}
                  {selectedFont === 'googleSans'
                    ? 'Google Sans Flex'
                    : selectedFont === 'ibmPlexSans'
                      ? 'IBM Plex Sans'
                      : 'IBM Plex Mono'}
                </Chip>
                <StatusDot tone="good" label="Variable Web Font Loaded" pulse />
              </div>

              <div>
                <Heading level="h1">
                  Emergency Department Triage &amp; Clinical Overview
                </Heading>
                <Heading level="h3" tone="muted" className="mt-s1">
                  AI-Assisted Patient Intake and Real-Time Observation
                </Heading>
              </div>

              <Text variant="body">
                Patient presented at 14:32 IST with acute thoracic discomfort
                and elevated heart rate. Initial vitals recorded by triage
                nurse: SpO2 96%, blood pressure 138/88 mmHg, pulse 104 bpm.
                Ambient scribe captured doctor consultation and generated
                preliminary differential diagnosis for immediate attending
                review.
              </Text>

              <Grid columns={3} gap="s4" className="pt-s2">
                <Box className="rounded-control border border-border bg-surface p-s3">
                  <Text variant="label" tone="muted">
                    Vitals: Blood Pressure
                  </Text>
                  <Heading level="h3" className="mt-s1">
                    138 / 88{' '}
                    <Text as="span" variant="caption" tone="muted">
                      mmHg
                    </Text>
                  </Heading>
                </Box>
                <Box className="rounded-control border border-border bg-surface p-s3">
                  <Text variant="label" tone="muted">
                    Pulse / Rhythm
                  </Text>
                  <Heading level="h3" className="mt-s1">
                    104{' '}
                    <Text as="span" variant="caption" tone="muted">
                      bpm (Sinus)
                    </Text>
                  </Heading>
                </Box>
                <Box className="rounded-control border border-border bg-surface p-s3">
                  <Text variant="label" tone="muted">
                    Oxygen Saturation
                  </Text>
                  <Heading level="h3" tone="good" className="mt-s1">
                    96%{' '}
                    <Text as="span" variant="caption" tone="good">
                      Normal
                    </Text>
                  </Heading>
                </Box>
              </Grid>
            </Stack>
          </div>
        </Stack>
      </Box>

      {/* Side-by-Side Typography Comparison */}
      <div>
        <Heading level="h3" className="mb-s3">
          Side-by-Side Typography Comparison
        </Heading>
        <Grid columns={2} gap="s4">
          {/* Google Sans Flex */}
          <Box
            className="rounded-card border border-border bg-surface p-s5"
            style={{ fontFamily: NOVA_FONTS.googleSans }}
          >
            <Stack gap="s2">
              <Chip tone="neutral">Google Sans Flex</Chip>
              <Heading level="h3">
                The quick brown fox jumps over the lazy dog
              </Heading>
              <Text variant="body">
                Modern geometric sans designed for human readability, responsive
                variable axes, and clean digital interfaces.
              </Text>
              <Text variant="code" tone="muted">
                0123456789 • ₹45,290.00
              </Text>
            </Stack>
          </Box>

          {/* IBM Plex Sans */}
          <Box
            className="rounded-card border border-border bg-surface p-s5"
            style={{ fontFamily: NOVA_FONTS.ibmPlexSans }}
          >
            <Stack gap="s2">
              <Chip tone="neutral">IBM Plex Sans</Chip>
              <Heading level="h3">
                The quick brown fox jumps over the lazy dog
              </Heading>
              <Text variant="body">
                Engineered grotesque sans-serif with industrial precision, clear
                letter distinction, and clinical authority.
              </Text>
              <Text variant="code" tone="muted">
                0123456789 • ₹45,290.00
              </Text>
            </Stack>
          </Box>

          {/* IBM Plex Mono */}
          <Box
            className="rounded-card border border-border bg-surface p-s5"
            style={{ fontFamily: NOVA_FONTS.ibmPlexMono }}
          >
            <Stack gap="s2">
              <Chip tone="neutral">IBM Plex Mono</Chip>
              <Heading level="h3">
                The quick brown fox jumps over the lazy dog
              </Heading>
              <Text variant="body">
                Monospaced companion for tabular clinical numbers, financial
                ledgers, and technical identifiers.
              </Text>
              <Text variant="code" tone="muted">
                0123456789 • ₹45,290.00
              </Text>
            </Stack>
          </Box>

          {/* Inter */}
          <Box
            className="rounded-card border border-border bg-surface p-s5"
            style={{ fontFamily: NOVA_FONTS.inter }}
          >
            <Stack gap="s2">
              <Chip tone="neutral">Inter</Chip>
              <Heading level="h3">
                The quick brown fox jumps over the lazy dog
              </Heading>
              <Text variant="body">
                Highly legible screen-optimized modern neutral sans-serif with
                tall x-height and exceptional clarity.
              </Text>
              <Text variant="code" tone="muted">
                0123456789 • ₹45,290.00
              </Text>
            </Stack>
          </Box>
        </Grid>
      </div>
    </Stack>
  );
}

export const InteractiveFontSwitcher: Story = {
  render: () => <FontSwitcher />,
};
