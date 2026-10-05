import type { Decorator, Preview } from '@storybook/react-vite';
import { EXAMPLE_THEMES } from '../src/stories/example-themes';
import { NovaThemeProvider } from '../src/theme/theme-provider';
import { isNovaMaterial, NOVA_DEFAULT_MATERIAL } from '../src/tokens/material';
import './storybook.css';

type ThemeKey = keyof typeof EXAMPLE_THEMES;

// Glass only shows over something to frost, so every story sits on nova-canvas, the brand-tinted
// aurora. The material global flips data-nova-material on this wrapper; a stale or hand-edited
// value in the URL falls back to the product default instead of reaching the attribute.
const withHospitalTheme: Decorator = (Story, context) => {
  const material: unknown = context.globals['material'];
  return (
    <NovaThemeProvider
      theme={
        EXAMPLE_THEMES[
          (context.globals['hospitalTheme'] as ThemeKey) ?? 'hosViolet'
        ]
      }
      material={isNovaMaterial(material) ? material : NOVA_DEFAULT_MATERIAL}
      className="nova-canvas p-6 font-sans text-ink"
    >
      <Story />
    </NovaThemeProvider>
  );
};

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
    material: {
      description: 'Design-system material, product-wide',
      toolbar: {
        title: 'Material',
        icon: 'mirror',
        dynamicTitle: true,
        items: [
          { value: 'glass', title: 'Glass (default)' },
          { value: 'solid', title: 'Solid' },
        ],
      },
    },
  },
  initialGlobals: {
    hospitalTheme: 'hosViolet',
    material: NOVA_DEFAULT_MATERIAL,
  },
  decorators: [withHospitalTheme],
};

export default preview;
