import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './text';

const meta = {
  title: 'Typography/Text',
  component: Text,
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-s2 p-s4">
      <Text variant="body">Body text for clinical notes and general descriptions.</Text>
      <Text variant="caption">Caption text for footnotes, hints, and subtle helpers.</Text>
      <Text variant="meta">Metadata text for timestamps, audits, and table subtotals.</Text>
      <Text variant="code">MRN-90214-X-EMERGENCY</Text>
      <Text variant="label">Form Field Label</Text>
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-s1 p-s4">
      <Text tone="default">Default primary ink text</Text>
      <Text tone="muted">Muted secondary text</Text>
      <Text tone="faint">Faint tertiary text</Text>
      <Text tone="good">Operational normal vital sign (Good)</Text>
      <Text tone="warn">Elevated observation alert (Warn)</Text>
      <Text tone="crit">Critical emergency triage alert (Crit)</Text>
    </div>
  ),
};
