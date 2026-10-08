import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid } from './grid';
import { Box } from '../box/box';

const meta = {
  title: 'Layout/Grid',
  component: Grid,
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ResponsiveCards: Story = {
  render: () => (
    <Grid columns={4} gap="s4" className="p-s4">
      <Box surface="base" border padding="s4" radius="md">Grid Tile 1</Box>
      <Box surface="base" border padding="s4" radius="md">Grid Tile 2</Box>
      <Box surface="base" border padding="s4" radius="md">Grid Tile 3</Box>
      <Box surface="base" border padding="s4" radius="md">Grid Tile 4</Box>
    </Grid>
  ),
};

export const TwoColumns: Story = {
  render: () => (
    <Grid columns={2} gap="s6" className="p-s4">
      <Box surface="inset" padding="s6" radius="md">Left Panel</Box>
      <Box surface="inset" padding="s6" radius="md">Right Panel</Box>
    </Grid>
  ),
};
