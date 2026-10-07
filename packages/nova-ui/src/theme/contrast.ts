const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/;

export function isHexColour(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOUR.test(value);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// The colour you see when `colour` is painted at `opacity` over `backdrop`: CSS
// `color-mix(in srgb, colour <opacity>, backdrop)`, which is how a glass fill composites.
export function mixColours(
  colour: string,
  opacity: number,
  backdrop: string,
): string {
  if (!(opacity >= 0 && opacity <= 1)) {
    throw new RangeError(`Expected an opacity between 0 and 1, got ${opacity}`);
  }
  const top = channels(colour);
  const bottom = channels(backdrop);
  return `#${top
    .map((value, index) =>
      Math.round(value * opacity + bottom[index] * (1 - opacity))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

function channels(hex: string): number[] {
  if (!isHexColour(hex)) {
    throw new TypeError(
      `Expected a 6-digit hex colour like #6D4FE0, got "${hex}"`,
    );
  }
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

// The legibility proof measures the same few hundred colours tens of thousands of times (every brand,
// scheme and material), so each colour's luminance is worked out once. A colour's luminance never
// changes; the cache is bounded so a long-lived page cannot grow it without limit.
const LUMINANCE_CACHE_LIMIT = 50_000;
const luminances = new Map<string, number>();

function relativeLuminance(hex: string): number {
  const known = luminances.get(hex);
  if (known !== undefined) return known;
  const [r, g, b] = channels(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (luminances.size >= LUMINANCE_CACHE_LIMIT) luminances.clear();
  luminances.set(hex, luminance);
  return luminance;
}
