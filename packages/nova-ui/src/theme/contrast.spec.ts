import { describe, expect, it } from 'vitest';
import { contrastRatio, isHexColour } from './contrast';

describe('contrastRatio', () => {
  it('is 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 2);
  });

  it('is 1:1 for identical colours', () => {
    expect(contrastRatio('#6D4FE0', '#6D4FE0')).toBeCloseTo(1, 5);
  });

  it("matches the prototype's measured 5.36:1 for white on the AI cyan", () => {
    expect(contrastRatio('#FFFFFF', '#0E7490')).toBeCloseTo(5.36, 1);
  });

  it('does not depend on argument order', () => {
    expect(contrastRatio('#6D4FE0', '#FFFFFF')).toBe(
      contrastRatio('#FFFFFF', '#6D4FE0'),
    );
  });

  it('refuses anything that is not a 6-digit hex colour', () => {
    expect(() => contrastRatio('teal', '#FFFFFF')).toThrow(TypeError);
  });
});

describe('isHexColour', () => {
  it('accepts #RRGGBB in either case and rejects everything else', () => {
    expect(isHexColour('#6d4fe0')).toBe(true);
    expect(isHexColour('#6D4FE0')).toBe(true);
    expect(isHexColour('#FFF')).toBe(false);
    expect(isHexColour('6D4FE0')).toBe(false);
    expect(isHexColour(42)).toBe(false);
  });
});
