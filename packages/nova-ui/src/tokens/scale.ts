// The HOS prototype's scales (os/public/assets/hos.css, "HOS Design System v3"), as data. theme.css
// declares the same values for the browser and conventions.spec.ts derives its allow-lists from
// here, so the prototype, the CSS and the components cannot drift apart (scale.spec.ts).

// Tailwind's --spacing unit. theme.css pins it to this value.
export const SPACING_UNIT_PX = 4;

// hos.css --space-0 … --space-10: every padding, margin and gap sits on this scale.
export const SPACING_PX = [2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48] as const;

// The same scale as Tailwind utility steps (p-3 is 12px, p-2.5 is 10px), plus 0 and px, the 1px
// hairline that separates adjacent boxes. These are the only steps a spacing utility may use.
export const SPACING_STEPS: readonly string[] = [
  '0',
  'px',
  ...SPACING_PX.map((px) => String(px / SPACING_UNIT_PX)),
];

// hos.css --r-sm, --r-md, --r-lg, --r-xl, in px. theme.css declares them as --nova-radius-* and maps
// them to rounded-*; --r-full (999px) is rounded-full.
export const RADIUS_PX = { sm: 8, md: 12, lg: 18, xl: 22 } as const;

// The only rounded-* utilities. Pills and true circles are rounded-full; no per-side or per-corner
// form, and no arbitrary value, exists in the grammar.
export const RADIUS_UTILITIES = [
  'rounded-none',
  ...Object.keys(RADIUS_PX).map((name) => `rounded-${name}`),
  'rounded-full',
] as const;

// Every font-size hos.css declares, in px (each `font-size: Npx` in the file, deduplicated; body
// text is 14px, h1 23px, h2 17px, h3 14px, .kpi-v 26px, the smallest .wa-time and .ws-group 9.5px).
// A component writes one as text-[12.5px]; Tailwind's stock text-xs|sm|… sizes are not used.
export const PROTOTYPE_TYPE_SIZES = [
  9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 20, 23, 26,
] as const;

// hos.css --shadow-sm | md | lg | glass, as Tailwind utilities. The only shadows a component casts.
export const SHADOW_UTILITIES = [
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
  'shadow-glass',
] as const;

// The weights hos.css uses (400 by inheritance, then 500, 600 and 700), as Tailwind utilities.
export const FONT_WEIGHT_UTILITIES = [
  'font-normal',
  'font-medium',
  'font-semibold',
  'font-bold',
] as const;

// Motion. The prototype moves quietly and quickly (120-200ms, ease-out); these are the named curves
// and durations every transition takes, declared as --nova-ease-* and --nova-duration-* (semantic.ts,
// theme.css) and reached as ease-spring | standard | emphasized and duration-fast | base | slow.
// Components apply them under motion-safe, so prefers-reduced-motion still turns motion off.
export const MOTION_EASINGS = {
  // A slight overshoot, for something that lands: a switch thumb, a chip toggling on.
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  // Hover, focus and colour changes.
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  // A surface entering: a dialog, a menu, a toast.
  emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
} as const;

export const MOTION_DURATIONS_MS = { fast: 150, base: 200, slow: 240 } as const;

export const EASE_UTILITIES = Object.keys(MOTION_EASINGS).map(
  (name) => `ease-${name}`,
);

export const DURATION_UTILITIES = Object.keys(MOTION_DURATIONS_MS).map(
  (name) => `duration-${name}`,
);
