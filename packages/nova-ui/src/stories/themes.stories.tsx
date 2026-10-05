import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Chip } from '../components/chip/chip';
import { NovaThemeProvider } from '../theme/theme-provider';
import { EXAMPLE_THEMES } from './example-themes';

const meta = { title: 'Themes/Side by side' } satisfies Meta;

export default meta;

export const SideBySide: StoryObj = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      {Object.values(EXAMPLE_THEMES).map((theme) => (
        <NovaThemeProvider
          key={theme.name}
          theme={theme}
          className="rounded-lg bg-bg p-4"
        >
          <Card>
            <CardHeader
              title={theme.name}
              description="Same components, this hospital's brand"
              actions={<Chip tone="ai">AI draft</Chip>}
            />
            <CardBody className="flex flex-wrap gap-2">
              <Button>Approve</Button>
              <Button variant="ghost">Edit</Button>
              <Chip tone="crit">Critical stays red</Chip>
            </CardBody>
          </Card>
        </NovaThemeProvider>
      ))}
    </div>
  ),
};
