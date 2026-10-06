import { GLASS, MATERIAL_LEVELS, type NovaMaterial } from '../tokens/material';
import { NOVA_DARK } from '../tokens/scheme';
import { NOVA_DEFAULTS } from '../tokens/semantic';
import { contrastRatio, isHexColour, mixColours } from './contrast';
import { rgbChannels, rgbToHex } from './colour';
import type { NovaPalette } from './derive';

export type NovaSchemeName = 'light' | 'dark';

// Every token's value in one scheme, for a hospital's palette (or HOS Violet's, with none).
export type ResolvedPalette = Record<keyof typeof NOVA_DEFAULTS, string>;

export function resolvePalette(
  scheme: NovaSchemeName,
  palette?: NovaPalette,
): ResolvedPalette {
  return {
    ...NOVA_DEFAULTS,
    ...(scheme === 'dark' ? NOVA_DARK : {}),
    ...palette?.[scheme],
  };
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

// Every pairing Nova draws, measured for one scheme and one material: text at 4.5:1, control edges,
// marks and the focus ring at 3:1 (WCAG 1.4.3 and 1.4.11). The backdrops are built from the same
// numbers theme.css paints with (MATERIAL_LEVELS, GLASS). A component that introduces a new pairing
// adds it here, and every brand, scheme and material is then proven for it.
export function legibilityChecks(
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
  const hex = (token: keyof ResolvedPalette): string => {
    const value = p[token];
    if (!isHexColour(value)) {
      throw new TypeError(`${token} is not a hex colour: ${value}`);
    }
    return value;
  };

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

  // Status and AI: fixed for every hospital, proven in both schemes on the brand's panels.
  for (const status of ['good', 'warn', 'crit', 'info', 'ai'] as const) {
    const base = hex(`--nova-color-${status}`);
    const deep = hex(`--nova-color-${status}-deep`);
    const tinted = hex(`--nova-color-${status}-soft`);
    check(`${status} text on its tint`, deep, tinted, TEXT, false);
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
    false,
  );
  check('AI button text', onPrimary, hex('--nova-color-ai'), TEXT, false);
  check(
    'AI button hover fill',
    onPrimary,
    hex('--nova-color-ai-hover'),
    TEXT,
    false,
  );

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

export function legibilityFailures(
  p: ResolvedPalette,
  scheme: NovaSchemeName,
  material: NovaMaterial,
): LegibilityCheck[] {
  return legibilityChecks(p, scheme, material).filter(
    (check) => check.ratio < check.minimum,
  );
}
