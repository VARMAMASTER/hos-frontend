import { describe, expect, it } from 'vitest';
import { NOVA_DEFAULTS } from '../tokens/semantic';
import { EXAMPLE_THEME_TITLES, EXAMPLE_THEMES } from './example-themes';

describe('EXAMPLE_THEMES', () => {
  it('all pass the contrast-checked theme engine', () => {
    expect(Object.values(EXAMPLE_THEMES).map((theme) => theme.name)).toEqual([
      'HOS Violet',
      'Teal Care',
      'Clinical Blue',
      'Rose',
      'Slate',
    ]);
    expect(Object.keys(EXAMPLE_THEME_TITLES)).toEqual(
      Object.keys(EXAMPLE_THEMES),
    );
  });

  it('leaves HOS Violet as the prototype, with nothing to override', () => {
    expect(EXAMPLE_THEMES.hosViolet.cssVariables).toEqual({});
  });

  // "The theme presets are not working": each must visibly recolour the sidebar, the top bar, the
  // hero and the canvas, not only the buttons.
  it.each(['tealCare', 'clinicalBlue', 'rose', 'slate'] as const)(
    '%s recolours the sidebar, the top bar, the hero and the canvas',
    (key) => {
      const variables = EXAMPLE_THEMES[key].cssVariables;
      for (const token of [
        '--nova-color-sidebar-1',
        '--nova-color-sidebar-lift',
        '--nova-color-chrome-1',
        '--nova-color-chrome-2',
        '--nova-color-chrome-3',
        '--nova-color-bg',
      ] as const) {
        expect(variables[token], token).toBeDefined();
        expect(variables[token], token).not.toBe(NOVA_DEFAULTS[token]);
      }
    },
  );
});
