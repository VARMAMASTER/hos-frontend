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

  describe('material (glass or solid)', () => {
    // White text on this primary passes the solid gate (5.15:1), but on the 92% glass hero over
    // the lightest canvas it drops to 4.499:1.
    const nearLimit = {
      primary: '#6C57E0',
      primaryStrong: '#5636B8',
      primarySoft: '#EFEAFC',
    };

    it('leaves material unset when the hospital does not choose, so the product default applies', () => {
      expect(createNovaTheme({ name: 'HOS Violet' })).not.toHaveProperty(
        'material',
      );
      expect(
        createNovaTheme({ name: 'Row', material: null }),
      ).not.toHaveProperty('material');
    });

    it("carries a hospital's override", () => {
      expect(
        createNovaTheme({ name: 'Old PCs', material: 'solid' }).material,
      ).toBe('solid');
      expect(
        createNovaTheme({ name: 'Glassy', material: 'glass' }).material,
      ).toBe('glass');
    });

    it('rejects any other material, naming the value', () => {
      expect(() =>
        createNovaTheme({
          name: 'Typo',
          material: 'frosted' as unknown as 'glass',
        }),
      ).toThrow(
        new NovaThemeError(
          'Theme "Typo": material must be "glass" or "solid" (got "frosted").',
        ),
      );
    });

    it('rejects a brand whose white hero text would fall below 4.5:1 on glass, rounding the ratio down', () => {
      const glassy = () =>
        createNovaTheme({ name: 'Near Limit', brand: nearLimit });
      expect(glassy).toThrow(NovaThemeError);
      expect(glassy).toThrow(
        /#FFFFFF on #6C57E0 at 92% glass gives 4\.49:1 for hero text on glass/,
      );
      expect(glassy).toThrow(/set material to "solid"/);
    });

    it('accepts the same brand when the hospital chooses solid, where the hero is opaque', () => {
      expect(
        createNovaTheme({
          name: 'Near Limit',
          brand: nearLimit,
          material: 'solid',
        }).cssVariables['--nova-color-primary'],
      ).toBe('#6C57E0');
    });

    it('accepts the HOS default and both example hospitals on glass', () => {
      expect(() =>
        createNovaTheme({ name: 'Teal Care', brand: tealCare }),
      ).not.toThrow();
      expect(() =>
        createNovaTheme({
          name: 'Clinical Blue',
          brand: {
            primary: '#1D4ED8',
            primaryStrong: '#1E40AF',
            primarySoft: '#DBEAFE',
          },
        }),
      ).not.toThrow();
    });
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
