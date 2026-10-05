import { createNovaTheme, type NovaTheme } from '../theme/create-theme';

export const EXAMPLE_THEMES: Record<
  'hosViolet' | 'tealCare' | 'clinicalBlue',
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
};
