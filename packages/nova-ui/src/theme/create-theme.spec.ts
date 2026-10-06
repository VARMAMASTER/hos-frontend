import { describe, expect, it } from 'vitest';
import { NOVA_DEFAULTS } from '../tokens/semantic';
import {
  createNovaTheme,
  NOVA_THEME_VARIABLES,
  NovaThemeError,
} from './create-theme';
import { BRAND_SCHEME_TOKENS, deriveNovaPalette } from './derive';

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
    ).toMatchObject({
      '--nova-color-primary': '#0F766E',
      '--nova-color-primary-strong': '#115E59',
      '--nova-color-primary-soft': '#CCFBF1',
    });
  });

  // The owner's report, "the theme presets are not working": Teal Care set only the primary family,
  // so the sidebar, the top bar, the hero and the canvas stayed the prototype's violet.
  it('derives the whole brand-dependent palette, light and dark, so the chrome, hero and canvas follow the brand', () => {
    const theme = createNovaTheme({ name: 'Teal Care', brand: tealCare });
    const palette = deriveNovaPalette(tealCare);
    expect(theme.cssVariables).toEqual(palette.light);
    expect(Object.keys(theme.cssVariables).sort()).toEqual(
      NOVA_THEME_VARIABLES.filter((v) => v !== '--nova-font-body').sort(),
    );
    for (const token of [
      '--nova-color-chrome-1',
      '--nova-color-chrome-2',
      '--nova-color-chrome-3',
      '--nova-color-sidebar-1',
      '--nova-color-sidebar-lift',
      '--nova-color-chrome-accent',
      '--nova-color-bg',
      '--nova-color-border',
      '--nova-color-ink',
      '--nova-color-primary-ghost',
    ] as const) {
      expect(theme.cssVariables[token], token).not.toBe(NOVA_DEFAULTS[token]);
    }
    expect(theme.darkVariables).toEqual(
      Object.fromEntries(
        BRAND_SCHEME_TOKENS.map((token) => [token, palette.dark[token]]),
      ),
    );
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

  // AI follows the brand now (ai.spec.ts), but only as the engine derives it: a row's own AI colour
  // is ignored like its own status colour.
  it('never lets a theme recolour status tokens, or set an AI colour of its own, even straight from a database row', () => {
    const row = JSON.parse(
      JSON.stringify({
        name: 'Sneaky',
        crit: '#00FF00',
        brand: { ...tealCare, crit: '#00FF00', ai: '#FF00FF', good: '#FF0000' },
      }),
    );
    const theme = createNovaTheme(row);
    for (const name of [
      ...Object.keys(theme.cssVariables),
      ...Object.keys(theme.darkVariables ?? {}),
    ]) {
      expect(name).not.toMatch(/-(good|warn|crit|info)(-|$)|chart/);
      expect(NOVA_THEME_VARIABLES).toContain(name);
    }
    expect(theme.cssVariables['--nova-color-ai']).not.toBe('#FF00FF');
    expect(theme.cssVariables['--nova-color-ai']).toBe(
      createNovaTheme({ name: 'Teal', brand: tealCare }).cssVariables[
        '--nova-color-ai'
      ],
    );
  });

  describe('material (glass, frost or solid)', () => {
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
      expect(
        createNovaTheme({ name: 'Frosted', material: 'frost' }).material,
      ).toBe('frost');
    });

    it('rejects any other material, naming the value', () => {
      expect(() =>
        createNovaTheme({
          name: 'Typo',
          material: 'frosted' as unknown as 'glass',
        }),
      ).toThrow(
        new NovaThemeError(
          'Theme "Typo": material must be "glass", "frost" or "solid" (got "frosted").',
        ),
      );
    });

    // The hero band is the prototype's fixed violet-to-sky glass (.glass-hero), not the brand, and
    // material.spec.ts proves its white text for every hospital. A brand that only clears the button
    // gate is therefore fine on glass.
    it('needs no hero gate for a brand: the hero does not take the brand colours', () => {
      const nearLimit = {
        primary: '#6C57E0',
        primaryStrong: '#5636B8',
        primarySoft: '#EFEAFC',
      };
      expect(
        createNovaTheme({ name: 'Near Limit', brand: nearLimit }).cssVariables[
          '--nova-color-primary'
        ],
      ).toBe('#6C57E0');
    });

    // Breadcrumb links, ghost buttons and outline tags put primary-strong straight on the canvas,
    // which the brand itself tints.
    it('rejects a brand whose own text (primary-strong) falls below 4.5:1 on the canvas its glass tint makes', () => {
      const grey = {
        primary: '#686868',
        primaryStrong: '#686868',
        primarySoft: '#FFFFFF',
      };
      const glassy = () => createNovaTheme({ name: 'Grey', brand: grey });
      expect(glassy).toThrow(NovaThemeError);
      expect(glassy).toThrow(
        /#686868 on the brand-tinted canvas gives 4\.1\d:1 for brand text on the canvas/,
      );
      expect(glassy).toThrow(/set material to "solid"/);
      expect(() =>
        createNovaTheme({ name: 'Grey', brand: grey, material: 'solid' }),
      ).not.toThrow();
    });

    // A rejection names the colours, the ratio, what the pairing is for and where (scheme and
    // material when it is not light glass), and suggests a brand that passes: the same hue at HOS
    // Violet's lightness.
    it('rejects with the ratio and a suggestion that itself passes', () => {
      let message = '';
      try {
        createNovaTheme({
          name: 'Sunrise',
          brand: {
            primary: '#FDE68A',
            primaryStrong: '#B45309',
            primarySoft: '#FEF3C7',
          },
        });
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).toMatch(
        /^Theme "Sunrise": #FFFFFF on #FDE68A gives 1\.\d\d:1 for primary button text — needs at least 4\.5:1\./,
      );
      const suggestion =
        /Try primary (#\w{6}), primaryStrong (#\w{6}) and primarySoft (#\w{6})/.exec(
          message,
        );
      expect(suggestion).not.toBeNull();
      const [, primary, primaryStrong, primarySoft] = suggestion ?? [];
      expect(() =>
        createNovaTheme({
          name: 'Sunrise, suggested',
          brand: { primary, primaryStrong, primarySoft },
        }),
      ).not.toThrow();
    });

    it('checks every material when the hospital leaves it to the product, and only its own otherwise', () => {
      const grey = {
        primary: '#686868',
        primaryStrong: '#686868',
        primarySoft: '#FFFFFF',
      };
      expect(() =>
        createNovaTheme({ name: 'Grey', brand: grey, material: 'frost' }),
      ).toThrow(/brand text on the canvas \(light scheme, frost\)/);
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
