// The scheme axis: light (the prototype, and the default), dark, or system, which follows the
// operating system's prefers-color-scheme. Independent of the hospital theme and of the material:
// any brand, in any material, in either scheme.
export type NovaScheme = 'light' | 'dark' | 'system';

export const NOVA_SCHEMES: readonly NovaScheme[] = ['light', 'dark', 'system'];

export const NOVA_DEFAULT_SCHEME: NovaScheme = 'light';

export function isNovaScheme(value: unknown): value is NovaScheme {
  return value === 'light' || value === 'dark' || value === 'system';
}

// The dark scheme's value of every token that changes with the scheme, for HOS Violet. A token not
// listed keeps its light value in the dark (white text, the AI bright stop, two chart colours, and the
// whole chrome, which is dark in both schemes). theme.css
// pairs each with its light value as light-dark(light, dark); scheme.spec.ts compares the two files.
//
// The values are built, not picked: each is its light colour's hue pinned to a WCAG luminance chosen
// for the proofs (theme/derive.ts and the generator in scheme.spec.ts), so the same proofs that hold
// in the light scheme hold here.
//   - canvas 0.008, panel 0.014, panel-2 0.019, lines 0.045 and 0.075;
//   - the control edge 0.19 (3:1 on every dark panel), inks 0.82, 0.42 and 0.30 (4.5:1 or more);
//   - status, AI and brand fills 0.175 (white text 4.5:1, and 3:1 as a mark on a dark panel);
//   - their soft tints 0.022 and their deep inks 0.42 (6.5:1 on the tint);
//   - the brand's strong (text) 0.42, its hover fill 0.11.
// The status colours keep their hues: a dark good is still green, a dark crit still red.
export const NOVA_DARK = {
  '--nova-color-bg': '#161424',
  '--nova-color-surface': '#1F1E2E',
  '--nova-color-surface-2': '#252436',
  '--nova-color-border': '#3B3951',
  '--nova-color-border-strong': '#4D4A66',
  '--nova-color-border-control': '#787693',
  '--nova-color-ink': '#E9E8F7',
  '--nova-color-ink-2': '#ADABC4',
  '--nova-color-ink-3': '#9493AE',
  '--nova-color-primary': '#775BEC',
  '--nova-color-primary-strong': '#ABA3FF',
  '--nova-color-primary-soft': '#282446',
  '--nova-color-primary-ghost': '#212033',
  '--nova-color-primary-hover': '#6241D1',
  // The highlight in the dark is the prototype's sky itself (#60A5FA, 6.4:1 on a dark panel), its tint
  // and ink pinned as the brand's are (0.022 and 0.42), and its hover a step lighter (0.5).
  '--nova-color-highlight': '#60A5FA',
  '--nova-color-highlight-soft': '#122946',
  '--nova-color-highlight-deep': '#7AB1F5',
  '--nova-color-highlight-hover': '#8CBFFF',
  '--nova-color-ai': '#1F7D9A',
  '--nova-color-ai-deep': '#75B7CE',
  '--nova-color-ai-soft': '#022D3A',
  '--nova-color-ai-ghost': '#0D222A',
  '--nova-color-ai-line': '#184B5C',
  '--nova-color-ai-hover': '#00617A',
  '--nova-color-good': '#008463',
  '--nova-color-good-soft': '#072F23',
  '--nova-color-good-deep': '#6EBD9F',
  '--nova-color-warn': '#BA5814',
  '--nova-color-warn-soft': '#3D2212',
  '--nova-color-warn-deep': '#EC9A6C',
  '--nova-color-crit': '#CE4337',
  '--nova-color-crit-soft': '#3F201C',
  '--nova-color-crit-deep': '#FF8E7E',
  '--nova-color-info': '#3976BC',
  '--nova-color-info-soft': '#162941',
  '--nova-color-info-deep': '#7FB1EC',
  // The data palette, retuned for the dark panel on the same hues (within 12 degrees): each series
  // 3:1 on a dark card, neighbours 15 apart and every series 10 from each dark status, brand and AI
  // colour (OKLab x 100), the light palette's own rules (components/chart/palette.spec.ts).
  '--nova-chart-1': '#1792FF',
  '--nova-chart-4': '#7B6F46',
  '--nova-chart-5': '#C675FF',
  '--nova-chart-6': '#A849A9',
  '--nova-color-sheen': 'rgb(255 255 255 / 0.16)',
} as const;

export type NovaDarkToken = keyof typeof NOVA_DARK;
