// @vitest-environment node
// Reads theme.css (and, where present, the prototype's CSS) from disk; see semantic.spec.ts for why
// this runs under node.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../theme/contrast';
import { resolvePalette } from '../theme/legibility';
import {
  WHATSAPP_COLOURS,
  WHATSAPP_HELD_BY_A_PROOF,
  WHATSAPP_TEXT_MINIMUM,
  whatsappLegibilityFailures,
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
      'radial-gradient(var(--nova-wa-wall-dot) var(--nova-phone-wall-dot-r), transparent var(--nova-phone-wall-dot-r))',
    );
    expect(wall['background-size']).toBe(
      'var(--nova-phone-wall-grid) var(--nova-phone-wall-grid)',
    );
    // The prototype's 18px grid of 1px dots, as tokens outside the WhatsApp block (they are sizes,
    // not WhatsApp's colours).
    expect(css).toContain('--nova-phone-wall-dot-r: 1px;');
    expect(css).toContain('--nova-phone-wall-grid: 18px;');
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

const TEXT = WHATSAPP_TEXT_MINIMUM;
const SCHEMES = ['light', 'dark'] as const;
const wa = (name: WhatsAppColour, scheme: (typeof SCHEMES)[number]) =>
  WHATSAPP_COLOURS[name][scheme];
const failures = whatsappLegibilityFailures;

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

  // The hospital's theme moves the chrome ink and the header tag: the 480-brand sweep is in
  // theme/legibility.spec.ts, where every WhatsApp pairing is a named check in legibilityChecks(), so each brand
  // is derived once for every pairing.
  it('would catch a failing pair', () => {
    const palette = {
      ...resolvePalette('light'),
      '--nova-color-chrome-ink': '#3A3A3A',
    };
    expect(failures(palette, 'light').join(' | ')).toContain(
      'the header status tag',
    );
  });
});
