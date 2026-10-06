import { createNovaTheme, type NovaTheme } from '../theme/create-theme';

// The hospital presets the Storybook toolbar offers. Each is three brand colours; the engine derives
// the rest (the chrome, the sidebar, the top bar, the hero, the canvas, the lines and the inks, light
// and dark) and proves every pairing, so a preset recolours the whole frame, not only its buttons.
export const EXAMPLE_THEMES: Record<
  'hosViolet' | 'tealCare' | 'clinicalBlue' | 'rose' | 'slate',
  NovaTheme
> = {
  hosViolet: createNovaTheme({ name: 'HOS Violet' }),
  tealCare: createNovaTheme({
    name: 'Teal Care',
    brand: {
      primary: '#0F766E',
      primaryStrong: '#115E59',
      primarySoft: '#CCFBF1',
    },
  }),
  clinicalBlue: createNovaTheme({
    name: 'Clinical Blue',
    brand: {
      primary: '#1D4ED8',
      primaryStrong: '#1E40AF',
      primarySoft: '#DBEAFE',
    },
  }),
  rose: createNovaTheme({
    name: 'Rose',
    brand: {
      primary: '#9D174D',
      primaryStrong: '#831843',
      primarySoft: '#FCE7F3',
    },
  }),
  // A near-neutral brand, for a hospital that wants a quiet, high-contrast frame.
  slate: createNovaTheme({
    name: 'Slate',
    brand: {
      primary: '#475569',
      primaryStrong: '#334155',
      primarySoft: '#E2E8F0',
    },
  }),
};

export const EXAMPLE_THEME_TITLES: Record<keyof typeof EXAMPLE_THEMES, string> =
  {
    hosViolet: 'HOS Violet (default)',
    tealCare: 'Teal Care',
    clinicalBlue: 'Clinical Blue',
    rose: 'Rose',
    slate: 'Slate (high contrast)',
  };
