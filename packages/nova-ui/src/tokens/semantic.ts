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
  '--nova-radius-sm': '8px',
  '--nova-radius-md': '12px',
  '--nova-radius-lg': '18px',
  '--nova-sidebar-w': '248px',
  '--nova-font-body':
    '"Google Sans Flex", system-ui, -apple-system, sans-serif',
  '--nova-font-mono':
    '"IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace',
} as const satisfies Record<NovaVariable, string>;
