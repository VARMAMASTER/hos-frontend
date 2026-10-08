import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from './box';

const meta = {
  title: 'Layout/Box',
  component: Box,
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Surfaces: Story = {
  render: () => (
    <div className="flex flex-col gap-s3 p-s4">
      <Box surface="base" padding="s4" border radius="md">
        Base Surface Box
      </Box>
      <Box surface="elevated" padding="s4" border radius="md">
        Elevated Surface Box
      </Box>
      <Box surface="inset" padding="s4" radius="md">
        Inset Surface Box
      </Box>
      <Box surface="sunken" padding="s4" radius="md">
        Sunken Surface Box
      </Box>
    </div>
  ),
};

export const PaddingAndBorders: Story = {
  render: () => (
    <div className="flex flex-col gap-s3 p-s4">
      <Box padding="s6" border="bottom" surface="base">
        Box with bottom border and s6 padding
      </Box>
      <Box paddingX="s8" paddingY="s2" border surface="inset" radius="full">
        Pill Box with px-s8 and py-s2
      </Box>
    </div>
  ),
};
