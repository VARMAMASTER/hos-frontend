import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './heading';

const meta = {
  title: 'Typography/Heading',
  component: Heading,
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Levels: Story = {
  render: () => (
    <div className="flex flex-col gap-s3 p-s4">
      <Heading level="h1">Display Heading (H1)</Heading>
      <Heading level="h2">Section Title (H2)</Heading>
      <Heading level="h3">Card Title (H3)</Heading>
      <Heading level="h4">Subhead (H4)</Heading>
      <Heading level="h5">Small Header (H5)</Heading>
      <Heading level="h6">Tiny Header (H6)</Heading>
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-s2 p-s4">
      <Heading level="h3" tone="default">Default Ink</Heading>
      <Heading level="h3" tone="muted">Muted Tone</Heading>
      <Heading level="h3" tone="accent">Accent Tone</Heading>
      <Heading level="h3" tone="good">Operational / Good Tone</Heading>
      <Heading level="h3" tone="warn">Warning Tone</Heading>
      <Heading level="h3" tone="crit">Critical Tone</Heading>
    </div>
  ),
};

export const Truncated: Story = {
  render: () => (
    <div className="max-w-xs border border-border p-s3">
      <Heading level="h3" truncate>
        A Very Long Clinical Department Title That Exceeds Width
      </Heading>
    </div>
  ),
};
