import { contrastRatio, mixColours } from '../theme/contrast';
import type { ResolvedPalette } from '../theme/legibility';

// WhatsApp's brand colours, for a thread drawn as the patient sees it on their phone (WhatsAppThread,
// ChatBubble's whatsapp palette). They are the one exception to "theme tokens only": another
// company's brand, so a hospital's theme never moves them. They live here and in one marked block at
// the end of theme.css (whatsapp.spec.ts compares the two), and reach components as bg-wa-* and
// text-wa-*, never as literals.
//
// Light is the prototype (hos.css .phone, .phone-h, .phone-b, .wa-in, .wa-out, .wa-time, .wa-btn;
// sim.css .wa-typing), except where a contrast proof holds a value (WHATSAPP_HELD_BY_A_PROOF). Dark
// is WhatsApp's own dark theme, with the same exceptions.

export type WhatsAppColour =
  | '--nova-wa-wall'
  | '--nova-wa-wall-dot'
  | '--nova-wa-header'
  | '--nova-wa-header-ink'
  | '--nova-wa-in'
  | '--nova-wa-out'
  | '--nova-wa-ink'
  | '--nova-wa-ink-2'
  | '--nova-wa-accent'
  | '--nova-wa-hover'
  | '--nova-wa-dot';

export interface SchemeColour {
  light: string;
  dark: string;
}

export const WHATSAPP_COLOURS: Readonly<Record<WhatsAppColour, SchemeColour>> =
  {
    // The chat wallpaper and its dot texture.
    '--nova-wa-wall': { light: '#EFE7DC', dark: '#0B141A' },
    '--nova-wa-wall-dot': { light: '#E4DACB', dark: '#172229' },
    // The header: WhatsApp's darker brand green (white reads about 7.7:1 on it; the brand teal
    // #128C7E only 4.1:1, which is why the prototype chose this one).
    '--nova-wa-header': { light: '#075E54', dark: '#202C33' },
    '--nova-wa-header-ink': { light: '#FFFFFF', dark: '#E9EDEF' },
    // Incoming and outgoing bubbles.
    '--nova-wa-in': { light: '#FFFFFF', dark: '#202C33' },
    '--nova-wa-out': { light: '#D9FDD3', dark: '#005C4B' },
    // Message text, and the secondary ink of the time stamp, gloss, speaker and notices.
    '--nova-wa-ink': { light: '#1A1730', dark: '#E9EDEF' },
    '--nova-wa-ink-2': { light: '#5A6B63', dark: '#C2CDC9' },
    // Quick-reply text, the "Read" mark and, inside the phone, the focus ring.
    '--nova-wa-accent': { light: '#0270A3', dark: '#8AD3F2' },
    // A quick reply under the pointer.
    '--nova-wa-hover': { light: '#F0F7FF', dark: '#2A3942' },
    // The typing dots (decoration: the words say who is typing).
    '--nova-wa-dot': { light: '#9AA79F', dark: '#8696A0' },
  };

// The values a contrast proof moved from the prototype (light) or from WhatsApp's own dark theme,
// and why. whatsapp.spec.ts proves each original fails and each held value passes.
export const WHATSAPP_HELD_BY_A_PROOF: Readonly<
  Partial<Record<WhatsAppColour, { prototype?: string; dark?: string }>>
> = {
  // The prototype's #027EB5 is 4.07:1 on the outgoing bubble and 4.18:1 on the hover fill.
  // WhatsApp's dark #53BDEB is 3.74:1 on its own dark outgoing bubble.
  '--nova-wa-accent': { prototype: '#027EB5', dark: '#53BDEB' },
  // WhatsApp's dark secondary ink #8696A0 is 2.61:1 on its own dark outgoing bubble.
  '--nova-wa-ink-2': { dark: '#8696A0' },
};

// Every pairing the WhatsApp thread paints, in both schemes. Text holds 4.5:1 (the time stamp is
// 9.5px, the smallest text in the product); the focus ring and the failed mark hold 3:1.
export const WHATSAPP_TEXT_MINIMUM = 4.5;
const TEXT = WHATSAPP_TEXT_MINIMUM;
const MARK = 3;
type Scheme = 'light' | 'dark';

const wa = (name: WhatsAppColour, scheme: Scheme) =>
  WHATSAPP_COLOURS[name][scheme];

export type Ground = (scheme: Scheme, palette: ResolvedPalette) => string;
const token =
  (name: WhatsAppColour): Ground =>
  (scheme) =>
    wa(name, scheme);
const nova =
  (name: keyof ResolvedPalette): Ground =>
  (_scheme, palette) =>
    palette[name];

export const WHATSAPP_PAIRINGS: ReadonlyArray<
  readonly [string, Ground, Ground, number]
> = [
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

// The pairings that fall below their minimum for one palette and scheme, as readable lines.
export function whatsappLegibilityFailures(
  palette: ResolvedPalette,
  scheme: Scheme,
): string[] {
  return WHATSAPP_PAIRINGS.flatMap(([usedBy, fg, bg, minimum]) => {
    const f = fg(scheme, palette);
    const b = bg(scheme, palette);
    const ratio = contrastRatio(f, b);
    return ratio < minimum
      ? [`${scheme} ${usedBy}: ${f} on ${b} ${ratio.toFixed(2)}:1 < ${minimum}`]
      : [];
  });
}
