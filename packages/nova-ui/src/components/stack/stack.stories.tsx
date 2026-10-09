import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from './stack';
import { Box } from '../box/box';

const meta = {
  title: 'Layout/Stack',
  component: Stack,
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => (
    <Stack gap="s3" className="max-w-md p-s4">
      <Box surface="inset" padding="s3" radius="control">
        Stack Item 1
      </Box>
      <Box surface="inset" padding="s3" radius="control">
        Stack Item 2
      </Box>
      <Box surface="inset" padding="s3" radius="control">
        Stack Item 3
      </Box>
    </Stack>
  ),
};

export const HorizontalSpaced: Story = {
  render: () => (
    <Stack
      direction="horizontal"
      gap="s4"
      align="center"
      justify="between"
      className="p-s4 border border-border"
    >
      <Box surface="base" padding="s2">
        Left Title
      </Box>
      <Stack direction="horizontal" gap="s2">
        <Box surface="inset" padding="s2" radius="control">
          Action 1
        </Box>
        <Box surface="inset" padding="s2" radius="control">
          Action 2
        </Box>
      </Stack>
    </Stack>
  ),
};
