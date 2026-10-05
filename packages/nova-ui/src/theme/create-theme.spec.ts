import { describe, expect, it } from 'vitest';
import { createNovaTheme, NovaThemeError } from './create-theme';

const tealCare = {
  primary: '#0F766E',
  primaryStrong: '#115E59',
  primarySoft: '#CCFBF1',
};

describe('createNovaTheme', () => {
  it('returns no overrides for a theme with no brand (the HOS default)', () => {
    expect(createNovaTheme({ name: 'HOS Violet' })).toEqual({
      name: 'HOS Violet',
      cssVariables: {},
    });
  });

  it('maps brand colours onto the --nova-color-primary family', () => {
    expect(
      createNovaTheme({ name: 'Teal Care', brand: tealCare }).cssVariables,
    ).toEqual({
      '--nova-color-primary': '#0F766E',
      '--nova-color-primary-strong': '#115E59',
      '--nova-color-primary-soft': '#CCFBF1',
    });
  });

  it('rejects a primary too pale for white button text, naming the colour and the ratio', () => {
    const pale = () =>
      createNovaTheme({
        name: 'Sunrise',
        brand: {
          primary: '#FDE68A',
          primaryStrong: '#B45309',
          primarySoft: '#FEF3C7',
        },
      });
    expect(pale).toThrow(NovaThemeError);
    expect(pale).toThrow(/#FDE68A gives 1\.2\d:1/);
  });

  it('rejects a malformed hex colour', () => {
    expect(() =>
      createNovaTheme({ name: 'Bad', brand: { ...tealCare, primary: 'teal' } }),
    ).toThrow(/brand\.primary must be a 6-digit hex colour/);
  });

  it('requires all three brand colours together, so hover states never fall back to the default violet', () => {
    expect(() =>
      createNovaTheme({ name: 'Half', brand: { primary: '#0F766E' } }),
    ).toThrow(/all three/);
  });

  it('never lets a theme recolour status or AI tokens, even straight from a database row', () => {
    const row = JSON.parse(
      JSON.stringify({
        name: 'Sneaky',
        crit: '#00FF00',
        brand: { ...tealCare, crit: '#00FF00', ai: '#FF00FF', good: '#FF0000' },
      }),
    );
    expect(Object.keys(createNovaTheme(row).cssVariables).sort()).toEqual([
      '--nova-color-primary',
      '--nova-color-primary-soft',
      '--nova-color-primary-strong',
    ]);
  });

  it('accepts a plain font stack and rejects anything that could smuggle CSS', () => {
    expect(
      createNovaTheme({
        name: 'Font',
        brand: { fontBody: '"Inter", sans-serif' },
      }).cssVariables,
    ).toEqual({
      '--nova-font-body': '"Inter", sans-serif',
    });
    expect(() =>
      createNovaTheme({
        name: 'Inject',
        brand: { fontBody: 'Inter; background: url(x)' },
      }),
    ).toThrow(/brand\.fontBody must be a plain font stack/);
  });
});
