import { describe, expect, it } from 'vitest';
import { EXAMPLE_THEMES } from './example-themes';

describe('EXAMPLE_THEMES', () => {
  it('all pass the contrast-checked theme engine', () => {
    expect(Object.values(EXAMPLE_THEMES).map((theme) => theme.name)).toEqual([
      'HOS Violet',
      'Teal Care',
      'Clinical Blue',
    ]);
  });
});
