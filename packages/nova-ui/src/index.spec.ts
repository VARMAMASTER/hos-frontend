import { describe, expect, it } from 'vitest';
import * as nova from './index';

describe('@hos/nova-ui public API', () => {
  it.each([
    'Button',
    'Chip',
    'Card',
    'CardHeader',
    'CardBody',
    'NovaThemeProvider',
    'applyNovaTheme',
    'createNovaTheme',
    'NovaThemeError',
    'contrastRatio',
    'isHexColour',
    'primitives',
    'NOVA_DEFAULTS',
  ])('exports %s from the barrel', (name) => {
    expect(nova).toHaveProperty(name);
  });
});
