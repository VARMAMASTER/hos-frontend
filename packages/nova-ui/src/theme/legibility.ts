import { GLASS, MATERIAL_LEVELS, type NovaMaterial } from '../tokens/material';
import { AI_SHEEN_PEAK } from '../tokens/scale';
import { NOVA_DARK } from '../tokens/scheme';
import { NOVA_DEFAULTS } from '../tokens/semantic';
import { WHATSAPP_PAIRINGS } from '../tokens/whatsapp';
import { contrastRatio, isHexColour, mixColours } from './contrast';
import { rgbChannels, rgbToHex } from './colour';
import type { NovaPalette } from './derive';

export type NovaSchemeName = 'light' | 'dark';

// Every token's value in one scheme, for a hospital's palette (or HOS Violet's, with none).
export type ResolvedPalette = Record<keyof typeof NOVA_DEFAULTS, string>;

// Resolved once per palette and scheme, and frozen: the theme engine, the provider and the proofs ask
// for the same brand's palette again and again, and the checks below are remembered per resolved
// palette, so handing back the same object lets every material share the work.
const HOS_VIOLET_RESOLVED: Readonly<Record<NovaSchemeName, ResolvedPalette>> = {
  light: Object.freeze({ ...NOVA_DEFAULTS }),
  dark: Object.freeze({ ...NOVA_DEFAULTS, ...NOVA_DARK }),
};
const resolved = new WeakMap<
  NovaPalette,
  Partial<Record<NovaSchemeName, ResolvedPalette>>
>();

export function resolvePalette(
  scheme: NovaSchemeName,
  palette?: NovaPalette,
): ResolvedPalette {
  if (palette === undefined) return HOS_VIOLET_RESOLVED[scheme];
  const build = () =>
    Object.freeze({
      ...NOVA_DEFAULTS,
      ...(scheme === 'dark' ? NOVA_DARK : {}),
      ...palette[scheme],
    });
  // Only a frozen palette (deriveNovaPalette's) can be remembered: anything else might change.
  if (!Object.isFrozen(palette)) return build();
  const known = resolved.get(palette) ?? {};
  const value = known[scheme] ?? build();
  resolved.set(palette, { ...known, [scheme]: value });
  return value;
}

export interface LegibilityCheck {
  usedBy: string;
  foreground: string;
  background: string;
  // A human name for a composite backdrop ("the brand-tinted canvas"); the hex when it is a token.
  backgroundName: string;
  ratio: number;
  minimum: number;
  // True when the hospital's own brand colours take part, so a failure is the brand's to fix.
  brand: boolean;
}

const WHITE = '#FFFFFF';
const TEXT = 4.5;
const MARK = 3;

// A colour seen through CSS `screen` blending at `opacity` over `backdrop` (the sidebar's lift is a
// screened layer): screen lightens each channel to 1 - (1 - a)(1 - b), then the layer's alpha mixes.
export function screenColours(
  colour: string,
  opacity: number,
  backdrop: string,
): string {
  const top = rgbChannels(colour);
  const screened = rgbChannels(backdrop).map(
    (value, index) => 255 - ((255 - value) * (255 - top[index])) / 255,
  );
  return mixColours(rgbToHex(screened), opacity, backdrop);
}

// The checks of a frozen palette (resolvePalette's), remembered per scheme and material: the theme
// engine and the proofs measure the same palette more than once. Each caller gets its own array.
const remembered = new WeakMap<
  ResolvedPalette,
  Map<string, LegibilityCheck[]>
>();

// Every pairing Nova draws, measured for one scheme and one material: text at 4.5:1, control edges,
// marks and the focus ring at 3:1 (WCAG 1.4.3 and 1.4.11). The backdrops are built from the same
// numbers theme.css paints with (MATERIAL_LEVELS, GLASS). A component that introduces a new pairing
// adds it here (the component pairings below, or this list when it depends on the material), and
// every brand, scheme and material is then proven for it.
export function legibilityChecks(
  p: ResolvedPalette,
  scheme: NovaSchemeName,
  material: NovaMaterial,
): LegibilityCheck[] {
  if (!Object.isFrozen(p)) {
    return [
      ...materialChecks(p, scheme, material),
      ...componentChecks(p, scheme),
    ];
  }
  const byPalette = remembered.get(p) ?? new Map<string, LegibilityCheck[]>();
  remembered.set(p, byPalette);
  // The component pairings sit on opaque grounds, so they are measured once per scheme and shared
  // by every material.
  const shared = byPalette.get(scheme) ?? componentChecks(p, scheme);
  byPalette.set(scheme, shared);
  const key = `${scheme}|${material}`;
  const checks = byPalette.get(key) ?? [
    ...materialChecks(p, scheme, material),
    ...shared,
  ];
  byPalette.set(key, checks);
  return [...checks];
}

const hexOf =
  (p: ResolvedPalette) =>
  (token: keyof ResolvedPalette): string => {
    const value = p[token];
    if (!isHexColour(value)) {
      throw new TypeError(`${token} is not a hex colour: ${value}`);
    }
    return value;
  };

function materialChecks(
  p: ResolvedPalette,
  scheme: NovaSchemeName,
  material: NovaMaterial,
): LegibilityCheck[] {
  const m = MATERIAL_LEVELS[material];
  const checks: LegibilityCheck[] = [];
  const check = (
    usedBy: string,
    foreground: string,
    background: string,
    minimum: number,
    brand: boolean,
    backgroundName = background,
  ) => {
    checks.push({
      usedBy,
      foreground,
      background,
      backgroundName,
      ratio: contrastRatio(foreground, background),
      minimum,
      brand,
    });
  };
  const hex = hexOf(p);

  const primary = hex('--nova-color-primary');
  const strong = hex('--nova-color-primary-strong');
  const soft = hex('--nova-color-primary-soft');
  const hover = hex('--nova-color-primary-hover');
  const onPrimary = hex('--nova-color-on-primary');
  const bg = hex('--nova-color-bg');
  const surface = hex('--nova-color-surface');
  const surface2 = hex('--nova-color-surface-2');
  const chrome1 = hex('--nova-color-chrome-1');
  const chrome2 = hex('--nova-color-chrome-2');
  const chrome3 = hex('--nova-color-chrome-3');
  const chromeInk = hex('--nova-color-chrome-ink');
  const accent = hex('--nova-color-chrome-accent');
  const sky = hex('--nova-color-chrome-glow-2');
  const sidebarTop = hex('--nova-color-sidebar-1');
  const sidebarBase = hex('--nova-color-sidebar-3');

  // The brand family (the old theme gate, kept word for word: these are the hospital's to fix).
  check('primary button text', onPrimary, primary, TEXT, true);
  if (scheme === 'light') {
    check('primary button hover text', onPrimary, strong, TEXT, true);
  }
  check('primary button hover fill', onPrimary, hover, TEXT, true);
  check('ghost button hover text', strong, soft, TEXT, true);

  // The canvas: on glass and frost the aurora tints the background with the two brand blobs (primary
  // and primary-hover, which is primary-strong in the light scheme) at GLASS.canvasTint, each at full
  // strength over a fixed accent hue at full strength; solid shows the plain background.
  const tint = GLASS.canvasTint * m.glass;
  const accentTint = GLASS.canvasAccentTint * m.glass;
  const canvases = [bg];
  if (m.glass) {
    for (const hue of GLASS.canvasAccents) {
      const under = mixColours(hue, accentTint, bg);
      canvases.push(mixColours(primary, tint, under));
      canvases.push(mixColours(hover, tint, under));
    }
  }
  const canvasName = m.glass ? 'the brand-tinted canvas' : 'the canvas';
  // Brand text (breadcrumb links, ghost buttons, outline tags) sits straight on the canvas.
  for (const canvas of canvases) {
    check('brand text on the canvas', strong, canvas, TEXT, true, canvasName);
  }
  check('brand text on a panel', strong, surface, TEXT, true);

  // Panels, as the material paints them over each canvas: the panel (or the frosted panel-2 tint)
  // at its opacity. The overlay is also anchored in the sidebar, over its darkest stop.
  const panelOver = (alpha: number, share: number, backdrop: string) =>
    mixColours(mixColours(surface2, share, surface), alpha, backdrop);
  const panels = canvases.flatMap((canvas) => [
    panelOver(m.surfaceAlpha, m.surfaceTint, canvas),
    panelOver(m.overlayAlpha, m.overlayTint, canvas),
  ]);
  const sidebarMenu = panelOver(m.overlayAlpha, m.overlayTint, sidebarBase);
  const rail = mixColours(chrome2, GLASS.tabbarTint, bg);

  const inks = [
    ['primary text (ink)', hex('--nova-color-ink')],
    ['secondary text (ink-2)', hex('--nova-color-ink-2')],
    ['small text (ink-3)', hex('--nova-color-ink-3')],
  ] as const;
  for (const [usedBy, ink] of inks) {
    for (const canvas of canvases) {
      check(`${usedBy} on the canvas`, ink, canvas, TEXT, true, canvasName);
    }
    for (const panel of panels) {
      check(`${usedBy} on a ${material} panel`, ink, panel, TEXT, true);
    }
    check(`${usedBy} on a menu in the sidebar`, ink, sidebarMenu, TEXT, true);
    check(`${usedBy} on panel-2`, ink, surface2, TEXT, true);
    check(`${usedBy} on the tab rail`, ink, rail, TEXT, true);
  }

  // Control edges (WCAG 1.4.11) and the primary focus ring, against everything a control sits on.
  const grounds = [surface, surface2, ...canvases, ...panels];
  for (const ground of grounds) {
    check(
      'a form control edge (border-control)',
      hex('--nova-color-border-control'),
      ground,
      MARK,
      true,
    );
    check(
      'the primary focus ring and outline edge',
      primary,
      ground,
      MARK,
      true,
    );
  }

  // The highlight, through the brand's own gates. Its marks (a gauge fill, the active tab's underline,
  // a selected edge, a selected row's rail, a milestone node, an avatar ring) and its hovered edge at
  // 3:1 on every ground a control sits on. Its deep ink at 4.5:1 on its tint, across the wash (the
  // brand's tint into the highlight's) and on the panels. And the gradient figure, brand into
  // highlight, at 3:1 as large display text on an opaque tile, point by point along the gradient.
  const highlight = hex('--nova-color-highlight');
  const highlightDeep = hex('--nova-color-highlight-deep');
  const highlightSoft = hex('--nova-color-highlight-soft');
  for (const ground of grounds) {
    check(
      'a highlight mark (a fill, an underline, an edge or a ring)',
      highlight,
      ground,
      MARK,
      true,
    );
    check(
      'a hovered highlight edge',
      hex('--nova-color-highlight-hover'),
      ground,
      MARK,
      true,
    );
  }
  check('highlight text on its tint', highlightDeep, highlightSoft, TEXT, true);
  for (let step = 0; step <= 4; step++) {
    check(
      'highlight text on the highlight wash',
      highlightDeep,
      mixColours(highlightSoft, step / 4, soft),
      TEXT,
      true,
    );
  }
  for (const ground of [surface, surface2]) {
    check('highlight text on a panel', highlightDeep, ground, TEXT, true);
    for (let step = 0; step <= 10; step++) {
      check(
        'the highlight gradient as large display text',
        mixColours(highlight, step / 10, primary),
        ground,
        MARK,
        true,
      );
    }
  }

  // The top bar at its lightest: its light end over white, which is what a sticky bar has under it
  // when it scrolls over the lightest thing there is. Then its search field, lifted by the field fill.
  const topbar = mixColours(chrome3, m.chromeEndAlpha, WHITE);
  const field = mixColours(WHITE, GLASS.chromeFieldAlpha, topbar);
  for (const ground of [topbar, field]) {
    check('white text on the top bar', WHITE, ground, TEXT, true);
    check(
      'secondary ink on the top bar',
      mixColours(WHITE, GLASS.chromeInk2Alpha, ground),
      ground,
      TEXT,
      true,
    );
  }

  // The sidebar: the brand lift screened over the top stop is its lightest point.
  const lift = screenColours(
    hex('--nova-color-sidebar-lift'),
    GLASS.sidebarBrandShare,
    sidebarTop,
  );
  check('chrome ink on the sidebar', chromeInk, lift, TEXT, true);
  check(
    'secondary ink on the sidebar',
    mixColours(chromeInk, GLASS.sidebarInk2Alpha, lift),
    lift,
    TEXT,
    true,
  );
  for (const ground of [lift, sidebarTop, sidebarBase]) {
    check(
      'the chrome-accent focus ring on the sidebar',
      accent,
      ground,
      MARK,
      true,
    );
  }

  // The hero at its lightest: its far end (the sky glow on glass, chrome-3 on solid) over its base
  // over white.
  const heroEnd = m.glass ? sky : chrome3;
  const heroBase = m.glass ? chrome1 : chrome2;
  const hero = mixColours(
    heroEnd,
    m.heroEndAlpha,
    mixColours(heroBase, m.heroBaseAlpha, WHITE),
  );
  check('white text on the hero', WHITE, hero, TEXT, true);
  check(
    'secondary ink on the hero',
    mixColours(WHITE, GLASS.heroInk2Alpha, hero),
    hero,
    TEXT,
    true,
  );

  // Status (fixed for every hospital) and AI (derived from the brand), proven in both schemes on the
  // brand's panels. An AI failure is the brand's to fix.
  for (const status of ['good', 'warn', 'crit', 'info', 'ai'] as const) {
    const base = hex(`--nova-color-${status}`);
    const deep = hex(`--nova-color-${status}-deep`);
    const tinted = hex(`--nova-color-${status}-soft`);
    check(`${status} text on its tint`, deep, tinted, TEXT, status === 'ai');
    for (const ground of [surface, surface2]) {
      check(`${status} text on a panel`, deep, ground, TEXT, true);
      check(`a ${status} mark on a panel`, base, ground, MARK, true);
    }
  }
  check(
    'AI text on the AI wash',
    hex('--nova-color-ai-deep'),
    hex('--nova-color-ai-ghost'),
    TEXT,
    true,
  );
  check('AI button text', onPrimary, hex('--nova-color-ai'), TEXT, true);
  check(
    'AI button hover fill',
    onPrimary,
    hex('--nova-color-ai-hover'),
    TEXT,
    true,
  );
  check(
    'AI button label under the sheen peak',
    onPrimary,
    mixColours(onPrimary, AI_SHEEN_PEAK, hex('--nova-color-ai-hover')),
    TEXT,
    true,
  );
  // The AI line (the AI block's edge) holds no contrast of its own: the block is told apart by its
  // gradient rail, the spark and its label. The AI mark is the one AI edge, at 3:1 above.

  // The data palette: a thin line or a small mark at 3:1 on the card a chart sits in.
  for (const slot of [1, 2, 3, 4, 5, 6] as const) {
    check(
      `chart series ${slot} on a card`,
      hex(`--nova-chart-${slot}`),
      surface,
      MARK,
      true,
    );
  }

  return checks;
}

// The pairings individual components draw on opaque grounds (the AI wash, the approved wash, a card,
// a bubble, the chrome-1 pill, the WhatsApp phone), the same under every material. Each is a named
// check with the component that draws it, proven with everything above for every brand, in both
// schemes. They were held in the components' own specs until 2026-10 (W3-1 moved them here).
type Token = keyof ResolvedPalette;
type Pairing = readonly [usedBy: string, fg: Token, bg: Token, minimum: number];

// AiDraftBlock, AiSourceLine / WhyTrail, AiClassChip / TierCard and ApprovalBar (the AI trust batch):
// the draft block's wash, the approved block's green wash, the status and tier chips, a card.
export const AI_TRUST_PAIRINGS: readonly Pairing[] = [
  [
    'draft body text (ink) on the AI wash',
    '--nova-color-ink',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'notices and Why trail reasons (ink-2) on the AI wash',
    '--nova-color-ink-2',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'Why trail sources (ink-3) on the AI wash',
    '--nova-color-ink-3',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the source line (ai-deep) on the AI wash',
    '--nova-color-ai-deep',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the rejection note and the required mark (crit-deep) on the AI wash',
    '--nova-color-crit-deep',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the reason field edge on the AI wash',
    '--nova-color-border-control',
    '--nova-color-ai-ghost',
    MARK,
  ],
  [
    'the focus ring on the AI wash',
    '--nova-color-primary',
    '--nova-color-ai-ghost',
    MARK,
  ],
  [
    'the progress fill on its track',
    '--nova-color-ai',
    '--nova-color-ai-soft',
    MARK,
  ],
  [
    'approved body text (ink) on the green wash',
    '--nova-color-ink',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'approved notices (ink-2) on the green wash',
    '--nova-color-ink-2',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'the audit record and source line (good-deep) on the green wash',
    '--nova-color-good-deep',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'the focus ring on the green wash',
    '--nova-color-primary',
    '--nova-color-good-soft',
    MARK,
  ],
  [
    'the low-confidence and blocked chips',
    '--nova-color-warn-deep',
    '--nova-color-warn-soft',
    TEXT,
  ],
  [
    'the rejected and RED tier chips',
    '--nova-color-crit-deep',
    '--nova-color-crit-soft',
    TEXT,
  ],
  [
    'the RED "why blocked" reason on a card',
    '--nova-color-crit-deep',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'a tier rail on a card (green)',
    '--nova-color-good',
    '--nova-color-surface',
    MARK,
  ],
  [
    'a tier rail on a card (amber)',
    '--nova-color-warn',
    '--nova-color-surface',
    MARK,
  ],
  [
    'a tier rail on a card (red)',
    '--nova-color-crit',
    '--nova-color-surface',
    MARK,
  ],
];

// ChatAnswer, AiStreamText and AiCopilotDock (the AI conversation batch).
export const AI_CONVERSATION_PAIRINGS: readonly Pairing[] = [
  [
    'answer text on the AI wash (ChatAnswer)',
    '--nova-color-ink',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'gloss and small print on the AI wash (ChatAnswer, the dock header)',
    '--nova-color-ink-2',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the streaming caret on the AI wash (AiStreamText)',
    '--nova-color-ai',
    '--nova-color-ai-ghost',
    MARK,
  ],
  [
    'the dock pill label on chrome-1 (AiCopilotDock)',
    '--nova-color-chrome-ink',
    '--nova-color-chrome-1',
    TEXT,
  ],
];

// AmbientScribeRecorder, SoapDraftBlock and VoiceEntryCapture (the AI voice batch). The recording
// pill is the dark chrome; a SOAP section is the panel at SOAP_SECTION_ALPHA over the block's wash.
export const SOAP_SECTION_ALPHA = 0.55;

export const AI_VOICE_PAIRINGS: readonly Pairing[] = [
  [
    'the recording pill text (chrome-ink) on chrome-1',
    '--nova-color-chrome-ink',
    '--nova-color-chrome-1',
    TEXT,
  ],
  [
    'the waveform bars (chrome-accent) on chrome-1',
    '--nova-color-chrome-accent',
    '--nova-color-chrome-1',
    MARK,
  ],
  [
    'the live dot (good) on chrome-1',
    '--nova-color-good',
    '--nova-color-chrome-1',
    MARK,
  ],
  [
    'the caret (ai) on the AI wash',
    '--nova-color-ai',
    '--nova-color-ai-ghost',
    MARK,
  ],
  ['the caret (ai) on a card', '--nova-color-ai', '--nova-color-surface', MARK],
  [
    'the AI-filled field edge (ai) on its AI fill',
    '--nova-color-ai',
    '--nova-color-ai-ghost',
    MARK,
  ],
  [
    'the out-of-range flag (warn-deep) on the AI wash',
    '--nova-color-warn-deep',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the out-of-range flag (warn-deep) on the approved wash',
    '--nova-color-warn-deep',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'the pane headings (ai-deep) on the approved wash',
    '--nova-color-ai-deep',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'the last value (ink-3) on the approved wash',
    '--nova-color-ink-3',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'the empty-plan edge (warn) on the AI wash',
    '--nova-color-warn',
    '--nova-color-ai-ghost',
    MARK,
  ],
];

// The SOAP sections, in the draft (over the AI wash) and once approved (over the green wash):
// [used by, foreground, the wash the section sits on, minimum].
export const SOAP_SECTION_PAIRINGS: readonly Pairing[] = [
  [
    'SOAP text (ink) on a draft section',
    '--nova-color-ink',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'SOAP gloss (ink-2) on a draft section',
    '--nova-color-ink-2',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'SOAP heading (ai-deep) on a draft section',
    '--nova-color-ai-deep',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'SOAP text (ink) on a approved section',
    '--nova-color-ink',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'SOAP gloss (ink-2) on a approved section',
    '--nova-color-ink-2',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'SOAP heading (ai-deep) on a approved section',
    '--nova-color-ai-deep',
    '--nova-color-good-soft',
    TEXT,
  ],
  [
    'the empty-plan flag (warn-deep) on a draft section',
    '--nova-color-warn-deep',
    '--nova-color-ai-ghost',
    TEXT,
  ],
];

// CallTranscriptConsole and AiDraftReply (the messaging batch), on the product's own tokens. The
// WhatsApp phone's pairings (tokens/whatsapp.ts) are measured with them.
export const MESSAGING_PAIRINGS: readonly Pairing[] = [
  [
    'an AI turn (ink) on its bubble',
    '--nova-color-ink',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'a caller turn (ink) on its bubble',
    '--nova-color-ink',
    '--nova-color-primary-soft',
    TEXT,
  ],
  [
    'the gloss (ink-2) on an AI turn',
    '--nova-color-ink-2',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'the gloss (ink-2) on a caller turn',
    '--nova-color-ink-2',
    '--nova-color-primary-soft',
    TEXT,
  ],
  [
    'speaker and time (ink-3) on an AI turn',
    '--nova-color-ink-3',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'speaker and time (ink-3) on a caller turn',
    '--nova-color-ink-3',
    '--nova-color-primary-soft',
    TEXT,
  ],
  [
    'a system pill (ink-2) on the panel',
    '--nova-color-ink-2',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'the escalation pill (crit-deep) on its tint',
    '--nova-color-crit-deep',
    '--nova-color-crit-soft',
    TEXT,
  ],
  [
    'the escalation edge on the transcript',
    '--nova-color-crit',
    '--nova-color-surface-2',
    MARK,
  ],
  [
    'the typing dots (ink-3) on a bubble',
    '--nova-color-ink-3',
    '--nova-color-primary-soft',
    MARK,
  ],
  [
    'the transcript’s focus ring on panel-2',
    '--nova-color-primary',
    '--nova-color-surface-2',
    MARK,
  ],
  [
    'write-back detail (ink-2) on the footer',
    '--nova-color-ink-2',
    '--nova-color-surface',
    TEXT,
  ],
  [
    'the write-back tick (good) on the footer',
    '--nova-color-good',
    '--nova-color-surface',
    MARK,
  ],
  [
    'the reply’s recipient and consent (ink-2) on the AI wash',
    '--nova-color-ink-2',
    '--nova-color-ai-ghost',
    TEXT,
  ],
  [
    'the reply’s message (ink) on the AI wash',
    '--nova-color-ink',
    '--nova-color-ai-ghost',
    TEXT,
  ],
];

// ExtractedValuesReview (the extraction batch): what the review sets on a resting row and on the row
// Table tints primary-ghost under the pointer.
const EXTRACTION_GROUNDS: ReadonlyArray<readonly [string, Token]> = [
  ['a resting row', '--nova-color-surface'],
  ['a hovered row', '--nova-color-primary-ghost'],
];
const EXTRACTION_INKS: ReadonlyArray<readonly [string, Token, number]> = [
  ['the test name and value (ink)', '--nova-color-ink', TEXT],
  ['the unit, "AI read" and "Not filed" (ink-2)', '--nova-color-ink-2', TEXT],
  ['the source line (ai-deep)', '--nova-color-ai-deep', TEXT],
  ['the "Filed" mark (good-deep)', '--nova-color-good-deep', TEXT],
  ['the empty-value error (crit-deep)', '--nova-color-crit-deep', TEXT],
  ['the focus ring', '--nova-color-primary', MARK],
];
export const EXTRACTION_PAIRINGS: readonly Pairing[] =
  EXTRACTION_GROUNDS.flatMap(([ground, bg]) =>
    EXTRACTION_INKS.map(
      ([usedBy, fg, minimum]) =>
        [`${usedBy} on ${ground}`, fg, bg, minimum] as const,
    ),
  );

// Fixed for every hospital (status on status), so a failure there is never the brand's to fix.
const FIXED_TOKEN = /^--nova-(?:color-(?:good|warn|crit|info)(?:-|$)|chart-)/;

function componentChecks(
  p: ResolvedPalette,
  scheme: NovaSchemeName,
): LegibilityCheck[] {
  const hex = hexOf(p);
  const pairing = ([usedBy, fg, bg, minimum]: Pairing): LegibilityCheck => ({
    usedBy,
    foreground: hex(fg),
    background: hex(bg),
    backgroundName: hex(bg),
    ratio: contrastRatio(hex(fg), hex(bg)),
    minimum,
    brand: !(FIXED_TOKEN.test(fg) && FIXED_TOKEN.test(bg)),
  });
  // A SOAP section is the panel at SOAP_SECTION_ALPHA over the wash in its pairing.
  const section = ([usedBy, fg, wash, minimum]: Pairing): LegibilityCheck => {
    const ground = mixColours(
      hex('--nova-color-surface'),
      SOAP_SECTION_ALPHA,
      hex(wash),
    );
    return {
      usedBy,
      foreground: hex(fg),
      background: ground,
      backgroundName: ground,
      ratio: contrastRatio(hex(fg), ground),
      minimum,
      brand: true,
    };
  };
  const whatsapp = WHATSAPP_PAIRINGS.map(
    ([usedBy, fg, bg, minimum]): LegibilityCheck => {
      const foreground = fg(scheme, p);
      const background = bg(scheme, p);
      return {
        usedBy: `WhatsApp: ${usedBy}`,
        foreground,
        background,
        backgroundName: background,
        ratio: contrastRatio(foreground, background),
        minimum,
        brand: true,
      };
    },
  );
  return [
    ...AI_TRUST_PAIRINGS.map(pairing),
    ...AI_CONVERSATION_PAIRINGS.map(pairing),
    ...AI_VOICE_PAIRINGS.map(pairing),
    ...SOAP_SECTION_PAIRINGS.map(section),
    ...MESSAGING_PAIRINGS.map(pairing),
    ...whatsapp,
    ...EXTRACTION_PAIRINGS.map(pairing),
  ];
}

export function legibilityFailures(
  p: ResolvedPalette,
  scheme: NovaSchemeName,
  material: NovaMaterial,
): LegibilityCheck[] {
  return legibilityChecks(p, scheme, material).filter(
    (check) => check.ratio < check.minimum,
  );
}
