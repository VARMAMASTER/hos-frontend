import { primitives as p } from './primitives';

export type NovaVariable = `--nova-${string}`;

// The HOS prototype's :root (os/public/assets/hos.css, "HOS Design System v3"), under Nova's
// semantic names. Every value is the prototype's, verbatim, except the two an accessibility proof
// holds (ink-3 and border-control, below); semantic.spec.ts compares the two files token by token.
export const NOVA_DEFAULTS = {
  // content canvas and ink (--bg, --panel, --panel-2, --line, --line-strong, --ink, --ink-2, --ink-3)
  '--nova-color-bg': p.lavender[100],
  '--nova-color-surface': p.white,
  '--nova-color-surface-2': p.lavender[50],
  '--nova-color-border': p.lavender[200],
  '--nova-color-border-strong': p.lavender[300],
  // The edge of a form control: 3:1 against its fill and its backdrop (WCAG 1.4.11). The prototype's
  // .f-input edge is --line-strong (#CFC9E6), 1.6:1 on white, so the proven edge stays.
  '--nova-color-border-control': p.ink[400],
  '--nova-color-ink': p.ink[900],
  '--nova-color-ink-2': p.ink[600],
  // The prototype's --ink-3 is #6A6584 (4.84:1 on the bare canvas). The aurora tints the canvas, and
  // small print must hold 4.5:1 on the darkest tint (material.spec.ts), so this stays darkened.
  '--nova-color-ink-3': p.ink[500],
  // brand (--teal, --teal-strong, --teal-soft, --teal-ghost): a hospital theme may set the first three
  '--nova-color-primary': p.violet[600],
  '--nova-color-primary-strong': p.violet[700],
  '--nova-color-primary-soft': p.violet[100],
  '--nova-color-primary-ghost': p.violet[50],
  // The fill a primary button hovers to, under white text: the prototype's .btn-primary:hover is
  // --teal-strong. Its own token because in the dark scheme primary-strong turns light (it is text on
  // a dark panel there) while this stays a fill white text holds 4.5:1 on.
  '--nova-color-primary-hover': p.violet[700],
  '--nova-color-on-primary': p.white,
  // The highlight: a second accent, used deliberately beside the brand (a gauge fill, the active
  // tab's underline, a KPI's gradient figure, a "New" chip). For HOS Violet it is the prototype's sky,
  // --chrome-glow-2, the far stop of every prototype brand gradient (the hero, .sb-bar, the aurora).
  // Each member is the sky pinned to its brand twin's luminance, so it passes the brand's proofs: the
  // highlight is a 3:1 mark on every ground (2.5:1 for #60A5FA itself on white, so it is held at the
  // lightest value that passes), deep is text at 4.5:1 on soft, on the wash and on a panel, and hover
  // is the mark one step further from the ground. The highlight carries no text of its own and never
  // carries state alone. A hospital theme derives its own (theme/derive.ts).
  '--nova-color-highlight': p.sky[600],
  '--nova-color-highlight-soft': p.sky[50],
  '--nova-color-highlight-deep': p.sky[800],
  '--nova-color-highlight-hover': p.sky[800],
  // AI signature (--ai, --ai-bright, --ai-deep, --ai-soft, --ai-ghost, --ai-line). These are HOS
  // Violet's; a hospital theme derives its own (theme/derive.ts): the prototype's cyan while it sits
  // far enough from the brand and every status, otherwise a hue chosen to keep clear of them, always
  // at these luminances, so every AI contrast holds.
  '--nova-color-ai': p.cyan[700],
  '--nova-color-ai-bright': p.cyan[400],
  '--nova-color-ai-deep': p.cyan[800],
  '--nova-color-ai-soft': p.cyan[100],
  '--nova-color-ai-ghost': p.cyan[50],
  '--nova-color-ai-line': p.cyan[200],
  // The AI button's hover fill under white text (ai-deep in the prototype), for the same reason as
  // primary-hover: ai-deep is AI text, and turns light in the dark scheme.
  '--nova-color-ai-hover': p.cyan[800],
  // The AI mark's four tints (--ai-mark's conic stops), moved with the AI hue in a hospital theme.
  '--nova-color-ai-mark-1': p.aiMark[1],
  '--nova-color-ai-mark-2': p.aiMark[2],
  '--nova-color-ai-mark-3': p.aiMark[3],
  '--nova-color-ai-mark-4': p.aiMark[4],
  // status, with the "-deep" text-on-tint pairing for each -soft fill
  '--nova-color-good': p.green[600],
  '--nova-color-good-soft': p.green[100],
  '--nova-color-good-deep': p.green[800],
  '--nova-color-warn': p.amber[700],
  '--nova-color-warn-soft': p.amber[100],
  '--nova-color-warn-deep': p.amber[800],
  '--nova-color-crit': p.red[700],
  '--nova-color-crit-soft': p.red[100],
  '--nova-color-crit-deep': p.red[800],
  '--nova-color-info': p.blue[700],
  '--nova-color-info-soft': p.blue[100],
  '--nova-color-info-deep': p.blue[800],
  // chrome: the deep indigo-violet app frame (--chrome-*). These are HOS Violet's; a hospital theme
  // derives its own from its brand (theme/derive.ts), at the same luminance, so the frame recolours
  // and every proof made on these values still holds.
  '--nova-color-chrome-1': p.chrome[1],
  '--nova-color-chrome-2': p.chrome[2],
  '--nova-color-chrome-3': p.chrome[3],
  '--nova-color-chrome-glass': 'rgba(23, 15, 48, 0.60)',
  '--nova-color-chrome-line': 'rgba(255, 255, 255, 0.12)',
  '--nova-color-chrome-ink': p.chrome.ink,
  '--nova-color-chrome-ink-2': 'rgba(241, 238, 251, 0.66)',
  '--nova-color-chrome-accent': p.chrome.accent,
  '--nova-color-chrome-accent-soft': 'rgba(167, 139, 250, 0.18)',
  '--nova-color-chrome-glow-2': p.chrome.glow2,
  // The dark ring around a top-bar badge (.tb-ico .tb-dot border, a literal in the prototype).
  '--nova-color-chrome-ring': p.chrome.ring,
  // The sidebar's base gradient, top to bottom (.sidebar: #26185A 0%, #1A0F42 42%, #150C34 100%).
  '--nova-color-sidebar-1': p.chrome.sidebar[1],
  '--nova-color-sidebar-2': p.chrome.sidebar[2],
  '--nova-color-sidebar-3': p.chrome.sidebar[3],
  // The violet lift behind the brand mark (.sidebar's radial rgba(109,79,224,.42), screened over the
  // base): the brand primary for HOS Violet. A theme derives its own from this one at the same
  // luminance, so the lift is the brand's hue and the sidebar inks stay proven in both schemes.
  '--nova-color-sidebar-lift': p.violet[600],
  // The light that catches a glass edge: the white of .glass-panel's rim and top highlight. The dark
  // scheme dims it (tokens/scheme.ts), so glass keeps a rim without a glaring white line.
  '--nova-color-sheen': p.white,
  // The data palette: six series colours, fixed for every hospital like status and AI, so the same
  // chart reads the same everywhere (never in the theme allow-list). Built with the dataviz method
  // (OKLab/OKLCH, Machado 2009 colour-vision simulation): neighbouring slots at least 12.8 apart
  // under protanopia and deuteranopia and 23 apart with full colour vision; at least 3:1 against
  // white; and at least 11 (OKLab x 100) from every status colour, its deep ink, the brand violet and
  // the AI cyan, so a series never reads as a judgement. palette.spec.ts checks these. (The
  // prototype's three-colour triad reuses the good and info hues, which that proof forbids.)
  '--nova-chart-1': p.data.sky,
  '--nova-chart-2': p.data.gold,
  '--nova-chart-3': p.data.rose,
  '--nova-chart-4': p.data.olive,
  '--nova-chart-5': p.data.lavender,
  '--nova-chart-6': p.data.plum,
  // The AI signature gradient (--ai-grad) and the multicolour AI mark (--ai-mark, the mark only:
  // never a chip, button, panel tint or anything that carries state). As in the prototype, the
  // gradient ends in the brand (var(--teal)): the AI follows the hospital theme (owner decision,
  // 2026-10-07). theme.css declares both here and again on every theme scope, so they re-resolve.
  '--nova-gradient-ai':
    'linear-gradient(135deg, var(--nova-color-ai-bright) 0%, var(--nova-color-ai) 48%, var(--nova-color-primary) 105%)',
  '--nova-ai-mark':
    'conic-gradient(from 0deg at 50% 50%, var(--nova-color-ai-mark-1) 0deg, var(--nova-color-ai-mark-2) 92deg, var(--nova-color-ai-mark-3) 184deg, var(--nova-color-ai-mark-4) 272deg, var(--nova-color-ai-mark-1) 360deg)',
  // radii (--r-sm, --r-md, --r-lg, --r-xl, --r-full)
  '--nova-radius-sm': '8px',
  '--nova-radius-md': '12px',
  '--nova-radius-lg': '18px',
  '--nova-radius-xl': '22px',
  '--nova-radius-full': '999px',
  // spacing (--space-0 … --space-10)
  '--nova-space-0': '2px',
  '--nova-space-1': '4px',
  '--nova-space-2': '6px',
  '--nova-space-3': '8px',
  '--nova-space-4': '10px',
  '--nova-space-5': '12px',
  '--nova-space-6': '16px',
  '--nova-space-7': '20px',
  '--nova-space-8': '24px',
  '--nova-space-9': '32px',
  '--nova-space-10': '48px',
  // shadows, hue-tinted to violet, never neutral black (--shadow-hue, --shadow-sm|md|lg|glass)
  '--nova-shadow-hue': '262deg 45% 27%',
  '--nova-shadow-sm':
    '0 1px 2px hsl(var(--nova-shadow-hue) / .07), 0 2px 6px -1px hsl(var(--nova-shadow-hue) / .07)',
  '--nova-shadow-md':
    '0 2px 4px hsl(var(--nova-shadow-hue) / .06), 0 8px 16px -4px hsl(var(--nova-shadow-hue) / .09), 0 20px 32px -10px hsl(var(--nova-shadow-hue) / .10)',
  '--nova-shadow-lg':
    '0 4px 8px -2px hsl(var(--nova-shadow-hue) / .07), 0 12px 24px -6px hsl(var(--nova-shadow-hue) / .11), 0 28px 48px -14px hsl(var(--nova-shadow-hue) / .14)',
  '--nova-shadow-glass':
    '0 8px 24px -8px hsl(var(--nova-shadow-hue) / .45), 0 2px 10px hsl(var(--nova-shadow-hue) / .28)',
  '--nova-sidebar-w': '248px',
  // The collapsed sidebar: the icon rail (W2-S; the prototype has no rail).
  '--nova-sidebar-rail-w': '68px',
  // motion (tokens/scale.ts MOTION_EASINGS and MOTION_DURATIONS_MS)
  '--nova-ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  '--nova-ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  '--nova-ease-emphasized': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  '--nova-duration-fast': '150ms',
  '--nova-duration-base': '200ms',
  '--nova-duration-slow': '240ms',
  // fonts (--f-display, --f-body, --f-mono): Google Sans Flex, one variable family for display and
  // body; IBM Plex Mono for tabular clinical and financial figures.
  '--nova-font-display':
    '"Google Sans Flex", system-ui, -apple-system, sans-serif',
  '--nova-font-body':
    '"Google Sans Flex", system-ui, -apple-system, sans-serif',
  '--nova-font-mono':
    '"IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace',
} as const satisfies Record<NovaVariable, string>;

export const NOVA_FONTS = {
  googleSans: '"Google Sans Flex", system-ui, -apple-system, sans-serif',
  ibmPlexSans: '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
  ibmPlexMono: '"IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace',
  inter: '"Inter", system-ui, -apple-system, sans-serif',
} as const;

export type NovaFontPreset = keyof typeof NOVA_FONTS;
