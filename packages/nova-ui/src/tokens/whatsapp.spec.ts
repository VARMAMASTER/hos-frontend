// @vitest-environment node
// Reads theme.css (and, where present, the prototype's CSS) from disk; see semantic.spec.ts for why
// this runs under node.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, mixColours } from '../theme/contrast';
import { withLuminance } from '../theme/colour';
import { deriveNovaPalette, suggestNovaBrand } from '../theme/derive';
import { resolvePalette, type ResolvedPalette } from '../theme/legibility';
import {
  WHATSAPP_COLOURS,
  WHATSAPP_HELD_BY_A_PROOF,
  type WhatsAppColour,
} from './whatsapp';

const css = readFileSync(
  fileURLToPath(new URL('../styles/theme.css', import.meta.url)),
  'utf8',
);

const START = '/* ===== WhatsApp brand colours (begin) =====';
const END = '/* ===== WhatsApp brand colours (end) ===== */';

function markedBlock(): string {
  const start = css.indexOf(START);
  const end = css.indexOf(END);
  if (start === -1 || end === -1) throw new Error('no WhatsApp block');
  return css.slice(start, end + END.length);
}

function declarations(text: string): Record<string, string> {
  return Object.fromEntries(
    [...text.matchAll(/([\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      // Prettier may wrap a long value; the line breaks are formatting, not content.
      match[2]
        .replace(/\s+/g, ' ')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .trim(),
    ]),
  );
}

// The body of the first `header {` … `}` after `from` (one level of nesting, for @supports).
function body(text: string, header: RegExp): string {
  const match = header.exec(text);
  if (!match) throw new Error(`no ${header} block`);
  let depth = 0;
  const open = match.index + match[0].length - 1;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return text.slice(open + 1, i);
  }
  throw new Error('unclosed block');
}

const names = Object.keys(WHATSAPP_COLOURS) as WhatsAppColour[];

describe('the WhatsApp brand colours in the token layer', () => {
  it('are WhatsApp’s own colours, named, never a Nova or hospital colour', () => {
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toMatch(/^--nova-wa-[a-z0-9-]+$/);
      expect(WHATSAPP_COLOURS[name].light).toMatch(/^#[0-9A-F]{6}$/);
      expect(WHATSAPP_COLOURS[name].dark).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('sit in one clearly marked block at the very end of theme.css', () => {
    expect(css.indexOf(START)).toBeGreaterThan(0);
    expect(css.indexOf(START)).toBe(css.lastIndexOf(START));
    expect(css.trimEnd().endsWith(END)).toBe(true);
    // Nothing outside the block names a WhatsApp token.
    const outside = css.replace(markedBlock(), '');
    expect(outside).not.toMatch(/--nova-wa-|--color-wa-|nova-wa-/);
  });

  it('declare exactly WHATSAPP_COLOURS: light on :root, light-dark() where supported', () => {
    const block = markedBlock();
    const light = declarations(body(block, /(?<![\w-]):root\s*\{/));
    const supported = declarations(
      body(block, /@supports \(color: light-dark\(#000, #fff\)\)\s*\{/),
    );
    expect(light).toEqual(
      Object.fromEntries(names.map((n) => [n, WHATSAPP_COLOURS[n].light])),
    );
    expect(supported).toEqual(
      Object.fromEntries(
        names.map((n) => [
          n,
          `light-dark(${WHATSAPP_COLOURS[n].light}, ${WHATSAPP_COLOURS[n].dark})`,
        ]),
      ),
    );
  });

  it('reach Tailwind as bg-wa-* / text-wa-* through @theme inline', () => {
    const theme = declarations(body(markedBlock(), /@theme inline\s*\{/));
    expect(theme).toEqual(
      Object.fromEntries(
        names.map((n) => [n.replace('--nova-wa-', '--color-wa-'), `var(${n})`]),
      ),
    );
  });

  it('draw the phone wall with its dotted texture as a utility, from the tokens', () => {
    const wall = declarations(
      body(markedBlock(), /@utility nova-wa-wall\s*\{/),
    );
    expect(wall['background-color']).toBe('var(--nova-wa-wall)');
    expect(wall['background-image']).toBe(
      'radial-gradient(var(--nova-wa-wall-dot) 1px, transparent 1px)',
    );
    expect(wall['background-size']).toBe('18px 18px');
  });
});

// The prototype (hos.css .phone, .phone-h, .phone-b, .wa-in, .wa-out, .wa-time, .wa-btn and its
// hover in the polish layer; sim.css .wa-typing dots). Its light values are binding unless a proof
// holds them (WHATSAPP_HELD_BY_A_PROOF).
const PROTOTYPE_LIGHT: Record<WhatsAppColour, string> = {
  '--nova-wa-wall': '#EFE7DC',
  '--nova-wa-wall-dot': '#E4DACB',
  '--nova-wa-header': '#075E54',
  '--nova-wa-header-ink': '#FFFFFF',
  '--nova-wa-in': '#FFFFFF',
  '--nova-wa-out': '#D9FDD3',
  // The prototype's bubbles inherit its --ink; the phone keeps that colour whatever the hospital's
  // theme, because the phone is WhatsApp's, not the hospital's.
  '--nova-wa-ink': '#1A1730',
  '--nova-wa-ink-2': '#5A6B63',
  '--nova-wa-accent': '#027EB5',
  '--nova-wa-hover': '#F0F7FF',
  '--nova-wa-dot': '#9AA79F',
};

describe('the WhatsApp colours against the prototype', () => {
  it('match the prototype in light, except the values a proof holds', () => {
    for (const name of names) {
      const held = WHATSAPP_HELD_BY_A_PROOF[name];
      if (held?.prototype) {
        expect(held.prototype).toBe(PROTOTYPE_LIGHT[name]);
        expect(WHATSAPP_COLOURS[name].light).not.toBe(held.prototype);
      } else {
        expect(WHATSAPP_COLOURS[name].light, name).toBe(PROTOTYPE_LIGHT[name]);
      }
    }
  });

  // The prototype lives beside the product in the HOS workspace, found as semantic.spec.ts finds it.
  const prototypeFile = (file: string) =>
    [1, 2, 3, 4, 5, 6, 7]
      .map((up) =>
        fileURLToPath(
          new URL(
            `${'../'.repeat(up)}os/public/assets/${file}`,
            import.meta.url,
          ),
        ),
      )
      .find((path) => existsSync(path));
  const hosCss = prototypeFile('hos.css');
  const simCss = prototypeFile('sim.css');

  it.runIf(hosCss !== undefined && simCss !== undefined)(
    'are the literal colours the prototype writes for the phone',
    () => {
      const hos = readFileSync(hosCss ?? '', 'utf8').toUpperCase();
      const sim = readFileSync(simCss ?? '', 'utf8').toUpperCase();
      const rule = (source: string, selector: string) => {
        const at = source.indexOf(`${selector.toUpperCase()} {`);
        expect(at, selector).toBeGreaterThan(-1);
        return source.slice(at, source.indexOf('}', at));
      };
      expect(rule(hos, '.phone')).toContain('#EFE7DC');
      expect(hos).toContain('--INK: #1A1730');
      expect(rule(hos, '.phone-h')).toContain('#075E54');
      expect(rule(hos, '.phone-b')).toContain('#E4DACB');
      expect(rule(hos, '.wa-out')).toContain('#D9FDD3');
      expect(rule(hos, '.wa-time')).toContain('#5A6B63');
      expect(rule(hos, '.wa-btn')).toContain('#027EB5');
      expect(rule(hos, '.wa-btn:hover')).toContain('#F0F7FF');
      expect(rule(sim, '.wa-typing .dots i')).toContain('#9AA79F');
    },
  );
});

// Every pairing the WhatsApp thread paints, in both schemes. Text holds 4.5:1 (the time stamp is
// 9.5px, the smallest text in the product); the focus ring and the failed mark hold 3:1.
const TEXT = 4.5;
const MARK = 3;
const SCHEMES = ['light', 'dark'] as const;
type Scheme = (typeof SCHEMES)[number];

const wa = (name: WhatsAppColour, scheme: Scheme) =>
  WHATSAPP_COLOURS[name][scheme];

type Ground = (scheme: Scheme, palette: ResolvedPalette) => string;
const token =
  (name: WhatsAppColour): Ground =>
  (scheme) =>
    wa(name, scheme);
const nova =
  (name: keyof ResolvedPalette): Ground =>
  (_scheme, palette) =>
    palette[name];

const PAIRINGS: ReadonlyArray<readonly [string, Ground, Ground, number]> = [
  [
    'message text on an incoming bubble',
    token('--nova-wa-ink'),
    token('--nova-wa-in'),
    TEXT,
  ],
  [
    'message text on an outgoing bubble',
    token('--nova-wa-ink'),
    token('--nova-wa-out'),
    TEXT,
  ],
  [
    'time, gloss and speaker on an incoming bubble',
    token('--nova-wa-ink-2'),
    token('--nova-wa-in'),
    TEXT,
  ],
  [
    'time, gloss and speaker on an outgoing bubble',
    token('--nova-wa-ink-2'),
    token('--nova-wa-out'),
    TEXT,
  ],
  [
    'the after-hours notice on its pill',
    token('--nova-wa-ink-2'),
    token('--nova-wa-in'),
    TEXT,
  ],
  [
    'a quick reply on its button',
    token('--nova-wa-accent'),
    token('--nova-wa-in'),
    TEXT,
  ],
  [
    'a quick reply under the pointer',
    token('--nova-wa-accent'),
    token('--nova-wa-hover'),
    TEXT,
  ],
  [
    'a locked quick reply',
    token('--nova-wa-ink-2'),
    token('--nova-wa-in'),
    TEXT,
  ],
  [
    '"Read" beside the ticks',
    token('--nova-wa-accent'),
    token('--nova-wa-out'),
    TEXT,
  ],
  [
    '"Read" beside the ticks, incoming',
    token('--nova-wa-accent'),
    token('--nova-wa-in'),
    TEXT,
  ],
  [
    'the header name',
    token('--nova-wa-header-ink'),
    token('--nova-wa-header'),
    TEXT,
  ],
  [
    'the focus ring on the wall',
    token('--nova-wa-accent'),
    token('--nova-wa-wall'),
    MARK,
  ],
  [
    'the focus ring on an incoming bubble',
    token('--nova-wa-accent'),
    token('--nova-wa-in'),
    MARK,
  ],
  [
    'the focus ring on an outgoing bubble',
    token('--nova-wa-accent'),
    token('--nova-wa-out'),
    MARK,
  ],
  [
    '"Not sent" under a bubble, on the wall',
    nova('--nova-color-crit-deep'),
    token('--nova-wa-wall'),
    TEXT,
  ],
  [
    'the failed mark on an outgoing bubble',
    nova('--nova-color-crit-deep'),
    token('--nova-wa-out'),
    MARK,
  ],
  [
    'the failed mark on an incoming bubble',
    nova('--nova-color-crit-deep'),
    token('--nova-wa-in'),
    MARK,
  ],
  [
    'the header status tag',
    nova('--nova-color-chrome-ink'),
    nova('--nova-color-chrome-1'),
    TEXT,
  ],
  [
    'the header avatar initials (chrome ink over its 15% wash on the header)',
    nova('--nova-color-chrome-ink'),
    (scheme, palette) =>
      mixColours(
        palette['--nova-color-chrome-ink'],
        0.15,
        wa('--nova-wa-header', scheme),
      ),
    TEXT,
  ],
];

function failures(palette: ResolvedPalette, scheme: Scheme): string[] {
  return PAIRINGS.flatMap(([usedBy, fg, bg, minimum]) => {
    const f = fg(scheme, palette);
    const b = bg(scheme, palette);
    const ratio = contrastRatio(f, b);
    return ratio < minimum
      ? [`${scheme} ${usedBy}: ${f} on ${b} ${ratio.toFixed(2)}:1 < ${minimum}`]
      : [];
  });
}

describe('the WhatsApp pairings', () => {
  it.each(SCHEMES)('hold for HOS Violet in the %s scheme', (scheme) => {
    expect(failures(resolvePalette(scheme), scheme)).toEqual([]);
  });

  it('would fail with the prototype values the proof holds', () => {
    const accent = WHATSAPP_HELD_BY_A_PROOF['--nova-wa-accent'];
    expect(accent).toBeDefined();
    expect(
      contrastRatio(accent?.prototype ?? '', wa('--nova-wa-out', 'light')),
    ).toBeLessThan(TEXT);
    expect(
      contrastRatio(accent?.prototype ?? '', wa('--nova-wa-hover', 'light')),
    ).toBeLessThan(TEXT);
    // WhatsApp's own dark secondary ink and link blue, on its own dark outgoing bubble.
    for (const [name, theirs] of [
      ['--nova-wa-ink-2', '#8696A0'],
      ['--nova-wa-accent', '#53BDEB'],
    ] as const) {
      expect(WHATSAPP_HELD_BY_A_PROOF[name]?.dark).toBe(theirs);
      expect(contrastRatio(theirs, wa('--nova-wa-out', 'dark'))).toBeLessThan(
        TEXT,
      );
    }
  });

  // The hospital's theme moves the chrome ink and the header tag; the 480-brand sweep of
  // legibility.spec.ts, in both schemes.
  it('hold for 480 hospital brands, in both schemes', () => {
    const found: string[] = [];
    for (let hue = 0; hue < 360; hue += 15) {
      for (const chroma of [0, 0.05, 0.12, 0.2, 0.3]) {
        for (const y of [0.04, 0.1, 0.142, 0.18]) {
          const primary = withLuminance(hue, chroma, y, 'darker');
          const palette = deriveNovaPalette({
            ...suggestNovaBrand(primary),
            primary,
          });
          for (const scheme of SCHEMES) {
            found.push(
              ...failures(resolvePalette(scheme, palette), scheme).map(
                (failure) => `${primary} ${failure}`,
              ),
            );
          }
        }
      }
    }
    expect(found).toEqual([]);
  }, 60_000);
});
