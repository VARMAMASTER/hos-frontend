// @vitest-environment node
// The AiButton's keyframes and utilities live in theme.css, in the animation area beside the
// heartbeat. Their timing is made from the motion tokens, never a literal, and the light band that
// sweeps over the fill is proven to keep white text legible.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, mixColours } from '../../theme/contrast';
import { resolvePalette } from '../../theme/legibility';
import { AI_SHEEN_PEAK } from '../../tokens/scale';

const css = readFileSync(
  fileURLToPath(new URL('../../styles/theme.css', import.meta.url)),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

function body(header: string): string {
  const at = css.search(new RegExp(`${header}\\s*\\{`));
  if (at === -1) throw new Error(`theme.css declares no "${header}" block`);
  const open = css.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) {
      return squash(css.slice(open + 1, i));
    }
  }
  throw new Error(`theme.css has an unclosed "${header}" block`);
}

const ANIMATIONS = [
  'twinkle',
  'sheen',
  'breathe',
  'orbit-x',
  'orbit-y',
  'shimmer',
  'burst',
  'settle',
  'draw',
] as const;

describe('theme.css AiButton motion', () => {
  it.each(ANIMATIONS)('declares the nova-ai-%s keyframes', (name) => {
    expect(body(`@keyframes nova-ai-${name}`).length).toBeGreaterThan(0);
  });

  it.each(ANIMATIONS)(
    'animate-ai-%s runs those keyframes on motion tokens only',
    (name) => {
      const utility = body(`@utility animate-ai-${name}`);
      expect(utility).toContain(`animation: nova-ai-${name} `);
      // The duration is a token (or a multiple of one) and the curve is a token or a keyword.
      expect(utility).toMatch(/var\(--nova-duration-(fast|base|slow)\)/);
      expect(utility).not.toMatch(/(?<![\w.-])\d+(?:\.\d+)?m?s\b/);
      expect(utility).toMatch(
        /var\(--nova-ease-(spring|standard|emphasized)\)|ease-in-out|linear/,
      );
    },
  );

  it('twinkles: the mark grows and turns, then settles', () => {
    const frames = body('@keyframes nova-ai-twinkle');
    expect(frames).toMatch(/scale\(1\.[1-9]/);
    expect(frames).toMatch(/rotate\(\d+deg\)/);
    expect(frames).toMatch(/100% \{[^}]*scale\(1\)/);
  });

  it('sweeps the sheen once, across the whole button', () => {
    const frames = body('@keyframes nova-ai-sheen');
    expect(frames).toMatch(/from \{[^}]*translateX\(-\d+%\)/);
    expect(frames).toMatch(/to \{[^}]*translateX\(\d{3,}%\)/);
    // Once: neither the hover sheen nor the burst repeats.
    expect(body('@utility animate-ai-sheen')).not.toContain('infinite');
    expect(body('@utility animate-ai-burst')).not.toContain('infinite');
  });

  it('loops the thinking motion: breathe, orbit and shimmer repeat', () => {
    for (const name of ['breathe', 'orbit-x', 'orbit-y', 'shimmer']) {
      expect(body(`@utility animate-ai-${name}`), name).toContain('infinite');
    }
  });

  it('circles the label: x and y alternate a quarter turn apart', () => {
    const x = body('@utility animate-ai-orbit-x');
    const y = body('@utility animate-ai-orbit-y');
    expect(x).toContain('alternate');
    expect(y).toContain('alternate');
    // The y motion starts a quarter of the x period in: a negative delay makes it an ellipse.
    expect(y).toMatch(/-\s*\d|calc\(-1 \*/);
    expect(body('@keyframes nova-ai-orbit-x')).toMatch(
      /left: 0%;[\s\S]*left: 100%/,
    );
    expect(body('@keyframes nova-ai-orbit-y')).toMatch(
      /top: 0%;[\s\S]*top: 100%/,
    );
  });

  it('bursts outward and leaves: the particle ends transparent', () => {
    const frames = body('@keyframes nova-ai-burst');
    expect(frames).toMatch(/opacity: 1/);
    expect(frames).toMatch(/100% \{[^}]*opacity: 0/);
    expect(frames).toContain('var(--nova-ai-angle)');
    expect(frames).toContain('var(--nova-ai-reach)');
  });

  it('settles the check after the burst, holding its first frame until then', () => {
    const settle = body('@utility animate-ai-settle');
    expect(settle).toMatch(/animation-delay: calc\(/);
    expect(settle).toContain('both');
    expect(settle).toContain('var(--nova-ease-spring)');
    expect(body('@keyframes nova-ai-draw')).toContain('stroke-dashoffset');
  });

  it('breathes between the still halo and the hover glow, from the AI tokens', () => {
    expect(body('@keyframes nova-ai-breathe')).toContain('box-shadow');
    for (const name of ['nova-ai-halo', 'nova-ai-glow']) {
      const utility = body(`@utility ${name}`);
      expect(utility).toContain('box-shadow');
      expect(utility).toContain('var(--nova-color-ai-bright)');
      expect(utility).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
    }
  });

  it('paints the sheen band from tokens, no hex, as a gradient only theme.css may draw', () => {
    const sheen = body('@utility nova-ai-sheen');
    expect(sheen).toContain('linear-gradient(');
    expect(sheen).toContain('var(--nova-color-on-primary)');
    expect(sheen).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });

  // The band passes over the text while it sweeps, so the lightened fill must still hold white text
  // at 4.5:1. It only moves over the hover fill (the button is hovered or focused, or thinking), which
  // is darker than the idle fill: the idle fill itself has no room for a veil in the dark scheme.
  it('keeps white text at 4.5:1 where the sheen band is at its peak, in both schemes', () => {
    const percent = /var\(--nova-color-on-primary\) (\d+(?:\.\d+)?)%/.exec(
      body('@utility nova-ai-sheen'),
    );
    expect(percent).not.toBeNull();
    const alpha = Number(percent?.[1]) / 100;
    // The legibility proof for every brand reads this constant, so the CSS must paint exactly it.
    expect(alpha).toBe(AI_SHEEN_PEAK);
    for (const scheme of ['light', 'dark'] as const) {
      const palette = resolvePalette(scheme);
      const lit = mixColours(
        palette['--nova-color-on-primary'],
        alpha,
        palette['--nova-color-ai-hover'],
      );
      expect(
        contrastRatio(palette['--nova-color-on-primary'], lit),
        scheme,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
