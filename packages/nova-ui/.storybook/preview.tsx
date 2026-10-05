import type { Decorator, Preview } from '@storybook/react-vite';
import { EXAMPLE_THEMES } from '../src/stories/example-themes';
import { NovaThemeProvider } from '../src/theme/theme-provider';
import './storybook.css';

type ThemeKey = keyof typeof EXAMPLE_THEMES;

const withHospitalTheme: Decorator = (Story, context) => (
  <NovaThemeProvider
    theme={
      EXAMPLE_THEMES[
        (context.globals['hospitalTheme'] as ThemeKey) ?? 'hosViolet'
      ]
    }
    className="bg-bg p-6 font-sans text-ink"
  >
    <Story />
  </NovaThemeProvider>
);

const preview: Preview = {
  globalTypes: {
    hospitalTheme: {
      description: 'Hospital (tenant) theme',
      toolbar: {
        title: 'Hospital theme',
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          { value: 'hosViolet', title: 'HOS Violet (default)' },
          { value: 'tealCare', title: 'Teal Care (example tenant)' },
          { value: 'clinicalBlue', title: 'Clinical Blue (example tenant)' },
        ],
      },
    },
  },
  initialGlobals: { hospitalTheme: 'hosViolet' },
  decorators: [withHospitalTheme],
};

export default preview;
