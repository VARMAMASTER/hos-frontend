// Colour arithmetic for the theme engine: sRGB hex, WCAG relative luminance and OKLCH (Björn
// Ottosson's OKLab in polar form). A hospital theme moves the prototype's palette to its own hue in
// OKLCH, then re-pins every colour to the WCAG luminance it had in the prototype, so every contrast
// ratio the prototype was proven at survives the move (contrast is a function of luminance alone).

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/;

export function rgbChannels(hex: string): [number, number, number] {
  if (!HEX_COLOUR.test(hex)) {
    throw new TypeError(
      `Expected a 6-digit hex colour like #6D4FE0, got "${hex}"`,
    );
  }
  return [1, 3, 5].map((offset) =>
    parseInt(hex.slice(offset, offset + 2), 16),
  ) as [number, number, number];
}

export function rgbToHex(channels: readonly number[]): string {
  return `#${channels
    .map((value) =>
      Math.min(255, Math.max(0, Math.round(value)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

const toLinear = (channel: number): number => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (linear: number): number =>
  255 *
  (linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055);

// A colour's luminance and OKLCH never change, and the theme engine and its proofs ask for the same
// colours again and again (every brand is moved from one template), so each is worked out once. The
// caches are bounded so a long-lived page cannot grow them without limit.
const CACHE_LIMIT = 50_000;

function remember<T>(cache: Map<string, T>, key: string, value: T): T {
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, value);
  return value;
}

const luminances = new Map<string, number>();
const oklchs = new Map<string, Readonly<Oklch>>();

// WCAG 2.x relative luminance.
export function relativeLuminance(hex: string): number {
  const known = luminances.get(hex);
  if (known !== undefined) return known;
  const [r, g, b] = rgbChannels(hex).map(toLinear);
  return remember(luminances, hex, 0.2126 * r + 0.7152 * g + 0.0722 * b);
}

function linearToOklch([r, g, b]: readonly number[]): Oklch {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h };
}

function oklchToLinear({ l: L, c, h }: Oklch): [number, number, number] {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// Frozen, because one object is shared by every caller that asks for the same colour.
export function toOklch(hex: string): Readonly<Oklch> {
  const known = oklchs.get(hex);
  if (known !== undefined) return known;
  return remember(
    oklchs,
    hex,
    Object.freeze(linearToOklch(rgbChannels(hex).map(toLinear))),
  );
}

const inGamut = (linear: readonly number[]) =>
  linear.every((value) => value >= -1e-6 && value <= 1 + 1e-6);

// The nearest sRGB colour at this lightness and hue: chroma is reduced until it fits.
export function fromOklch(colour: Oklch): string {
  let { c } = colour;
  if (!inGamut(oklchToLinear(colour))) {
    let low = 0;
    let high = c;
    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinear({ ...colour, c: mid }))) low = mid;
      else high = mid;
    }
    c = low;
  }
  return rgbToHex(oklchToLinear({ ...colour, c }).map(fromLinear));
}

// The colour at this hue and chroma (or the most chroma that fits) whose WCAG luminance is `target`.
// Luminance rises with OKLCH lightness at a fixed hue, so a bisection on lightness finds it; the
// last step keeps whichever neighbouring 8-bit colour lies on the side `round` asks for, so a colour
// pinned for contrast never rounds across the line it was pinned to.
export function withLuminance(
  hue: number,
  chroma: number,
  target: number,
  round: 'darker' | 'lighter' | 'nearest' = 'nearest',
): string {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (relativeLuminance(fromOklch({ l: mid, c: chroma, h: hue })) < target)
      low = mid;
    else high = mid;
  }
  const below = fromOklch({ l: low, c: chroma, h: hue });
  const above = fromOklch({ l: high, c: chroma, h: hue });
  if (round === 'darker') {
    return relativeLuminance(above) <= target ? above : below;
  }
  if (round === 'lighter') {
    return relativeLuminance(below) >= target ? below : above;
  }
  return Math.abs(relativeLuminance(below) - target) <=
    Math.abs(relativeLuminance(above) - target)
    ? below
    : above;
}

// Hue difference a → b, in (-180, 180].
export function hueDelta(from: number, to: number): number {
  const delta = ((((to - from) % 360) + 540) % 360) - 180;
  return delta === -180 ? 180 : delta;
}
