import { describe, expect, it } from 'vitest';
import { contrastRatio, isHexColour, mixColours } from './contrast';

describe('mixColours', () => {
  it('composites a colour at an opacity over a backdrop, channel by channel (CSS color-mix in srgb)', () => {
    expect(mixColours('#FFFFFF', 0.5, '#000000')).toBe('#808080');
    expect(mixColours('#6D4FE0', 0.26, '#F0EFF9')).toBe('#CEC5F3');
  });

  it('returns the colour itself at full opacity and the backdrop at zero', () => {
    expect(mixColours('#6D4FE0', 1, '#F0EFF9')).toBe('#6D4FE0');
    expect(mixColours('#6D4FE0', 0, '#F0EFF9')).toBe('#F0EFF9');
  });

  it('refuses an opacity outside 0..1 and anything that is not a 6-digit hex colour', () => {
    expect(() => mixColours('#FFFFFF', 1.2, '#000000')).toThrow(RangeError);
    expect(() => mixColours('white', 0.5, '#000000')).toThrow(TypeError);
  });
});

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
