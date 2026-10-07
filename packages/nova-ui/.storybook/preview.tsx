import type { Decorator, Preview } from '@storybook/react-vite';
import {
  EXAMPLE_THEME_TITLES,
  EXAMPLE_THEMES,
} from '../src/stories/example-themes';
import { NovaThemeProvider } from '../src/theme/theme-provider';
import {
  isNovaMaterial,
  NOVA_DEFAULT_MATERIAL,
  NOVA_MATERIALS,
} from '../src/tokens/material';
import {
  isNovaScheme,
  NOVA_DEFAULT_SCHEME,
  NOVA_SCHEMES,
} from '../src/tokens/scheme';
import './storybook.css';

type ThemeKey = keyof typeof EXAMPLE_THEMES;

const MATERIAL_TITLES = {
  glass: 'Glass (default)',
  frost: 'Frost',
  solid: 'Solid',
} as const;

const SCHEME_TITLES = {
  light: 'Light (default)',
  dark: 'Dark',
  system: 'System',
} as const;

// Glass only shows over something to frost, so every story sits on nova-canvas, the brand-tinted
// aurora. The three toolbar axes are independent: the hospital theme, the material and the scheme.
// A stale or hand-edited value in the URL falls back to the product default instead of reaching an
// attribute.
const withHospitalTheme: Decorator = (Story, context) => {
  const material: unknown = context.globals['material'];
  const scheme: unknown = context.globals['scheme'];
  const themeKey = context.globals['hospitalTheme'] as ThemeKey;
  return (
    <NovaThemeProvider
      theme={EXAMPLE_THEMES[themeKey] ?? EXAMPLE_THEMES.hosViolet}
      material={isNovaMaterial(material) ? material : NOVA_DEFAULT_MATERIAL}
      scheme={isNovaScheme(scheme) ? scheme : NOVA_DEFAULT_SCHEME}
      className="nova-canvas min-h-screen p-s8 font-sans text-ink"
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
        items: (Object.keys(EXAMPLE_THEMES) as ThemeKey[]).map((value) => ({
          value,
          title: EXAMPLE_THEME_TITLES[value],
        })),
      },
    },
    material: {
      description: 'Design-system material, product-wide',
      toolbar: {
        title: 'Material',
        icon: 'mirror',
        dynamicTitle: true,
        items: NOVA_MATERIALS.map((value) => ({
          value,
          title: MATERIAL_TITLES[value],
        })),
      },
    },
    scheme: {
      description: 'Colour scheme: light, dark, or the operating system’s',
      toolbar: {
        title: 'Scheme',
        icon: 'contrast',
        dynamicTitle: true,
        items: NOVA_SCHEMES.map((value) => ({
          value,
          title: SCHEME_TITLES[value],
        })),
      },
    },
  },
  initialGlobals: {
    hospitalTheme: 'hosViolet',
    material: NOVA_DEFAULT_MATERIAL,
    scheme: NOVA_DEFAULT_SCHEME,
  },
  decorators: [withHospitalTheme],
};

export default preview;
