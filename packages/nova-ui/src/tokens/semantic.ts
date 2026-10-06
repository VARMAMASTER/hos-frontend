import { primitives as p } from './primitives';

export type NovaVariable = `--nova-${string}`;

export const NOVA_DEFAULTS = {
  '--nova-color-bg': p.lavender[100],
  '--nova-color-surface': p.white,
  '--nova-color-surface-2': p.lavender[50],
  '--nova-color-border': p.lavender[200],
  '--nova-color-border-strong': p.lavender[300],
  // The edge of a form control or a secondary button: 3:1 against its fill and its backdrop.
  '--nova-color-border-control': p.ink[400],
  '--nova-color-ink': p.ink[900],
  '--nova-color-ink-2': p.ink[600],
  '--nova-color-ink-3': p.ink[500],
  '--nova-color-primary': p.violet[600],
  '--nova-color-primary-strong': p.violet[700],
  '--nova-color-primary-soft': p.violet[100],
  '--nova-color-on-primary': p.white,
  '--nova-color-ai': p.cyan[700],
  '--nova-color-ai-deep': p.cyan[800],
  '--nova-color-ai-soft': p.cyan[100],
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
  // The data palette: six series colours, fixed for every hospital like status and AI, so the same
  // chart reads the same everywhere (never in the theme allow-list). Built with the dataviz method
  // (OKLab/OKLCH, Machado 2009 colour-vision simulation): neighbouring slots at least 12.8 apart
  // under protanopia and deuteranopia and 23 apart with full colour vision; at least 3:1 against
  // white; and at least 11 (OKLab x 100) from every status colour, its deep ink, the brand violet and
  // the AI cyan, so a series never reads as a judgement. palette.spec.ts checks these.
  '--nova-chart-1': p.data.sky,
  '--nova-chart-2': p.data.gold,
  '--nova-chart-3': p.data.rose,
  '--nova-chart-4': p.data.olive,
  '--nova-chart-5': p.data.lavender,
  '--nova-chart-6': p.data.plum,
  // The radius grammar (docs/design-language/README.md): sm inline and compact, md inputs and small
  // tiles, lg cards and dialogs, xl large hero surfaces; anything that reads as an action is a pill
  // (rounded-full). Nothing in between.
  '--nova-radius-sm': '6px',
  '--nova-radius-md': '10px',
  '--nova-radius-lg': '14px',
  '--nova-radius-xl': '20px',
  '--nova-sidebar-w': '248px',
  '--nova-font-body': '"Inter", system-ui, -apple-system, sans-serif',
  '--nova-font-mono':
    '"IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace',
  // The type ramp. Body reading text and form input text are 17px; dense data (table cells, chips,
  // meta lines) uses callout or caption, so tables stay scannable. Paired with the weight ladder
  // 400 / 600 / 700 (500 is banned) and, from headline up, the tight tracking below.
  '--nova-text-micro': '11px',
  '--nova-text-micro--line-height': '14px',
  '--nova-text-caption': '13px',
  '--nova-text-caption--line-height': '18px',
  '--nova-text-callout': '15px',
  '--nova-text-callout--line-height': '20px',
  '--nova-text-body': '17px',
  '--nova-text-body--line-height': '24px',
  '--nova-text-headline': '20px',
  '--nova-text-headline--line-height': '26px',
  '--nova-text-title3': '28px',
  '--nova-text-title3--line-height': '34px',
  '--nova-text-title2': '40px',
  '--nova-text-title2--line-height': '46px',
  '--nova-text-title1': '56px',
  '--nova-text-title1--line-height': '60px',
  '--nova-tracking-tight': '-0.01em',
} as const satisfies Record<NovaVariable, string>;
