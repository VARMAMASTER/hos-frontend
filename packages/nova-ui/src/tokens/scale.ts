// The HOS prototype's scales (os/public/assets/hos.css, "HOS Design System v3"), as data. theme.css
// declares the same values for the browser and conventions.spec.ts derives its allow-lists from
// here, so the prototype, the CSS and the components cannot drift apart (scale.spec.ts).

// hos.css --space-0 … --space-10: every padding, margin and gap sits on this scale, declared as
// --nova-space-0 … --nova-space-10 and named s0 … s10 in Tailwind (p-s5 is --space-5, 12px). The
// names are the prototype's own step numbers, so they can never be read as Tailwind's 4px steps:
// p-4 does not exist, p-s4 is 10px. s0 is 2px; zero is p-0 and the 1px hairline p-px.
export const SPACING_PX = [2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48] as const;

export const SPACE_NAMES = SPACING_PX.map((_, step) => `s${step}`);

// hos.css --r-sm, --r-md, --r-lg, --r-xl, in px: the radius scale, which stays inside the token
// layer (--nova-radius-*). --r-full (999px) is the pill and the circle.
export const RADIUS_PX = { sm: 8, md: 12, lg: 18, xl: 22 } as const;

// Radius roles: what a corner belongs to, each pointing at a step of the scale. A component writes
// rounded-control, never rounded-sm, so the controls' corner is one token.
export const RADIUS_ROLES = {
  // Buttons that are not pills, fields, menu items, icon tiles (the prototype's 7-9px corners).
  control: 'sm',
  // Cards, tiles and the tab rail (.card).
  card: 'md',
  // Floating layers: menus, popovers, dialogs, the copilot panel.
  overlay: 'lg',
  // The page-top hero band and other large glass panels (.glass-hero).
  hero: 'xl',
  // A chip (.chip is a pill).
  chip: 'full',
  // A tag (.tag-*: a small rectangle).
  tag: 'sm',
  // Anything drawn as a pill on purpose.
  pill: 'full',
} as const;

export type RadiusRole = keyof typeof RADIUS_ROLES;

// The only rounded-* utilities a component may write: the roles, the true circle (rounded-full)
// and the square (rounded-none). Per-side and per-corner forms take the same names
// (rounded-t-card); no scale name (rounded-md) and no arbitrary value compiles.
export const RADIUS_UTILITIES = [
  'rounded-none',
  ...Object.keys(RADIUS_ROLES).map((name) => `rounded-${name}`),
  'rounded-full',
] as const;

// Every font-size hos.css declares, in px (each `font-size: Npx` in the file, deduplicated; body
// text is 14px, h1 23px, h2 17px, h3 14px, .kpi-v 26px, the smallest .wa-time and .ws-group 9.5px).
// Each is a type role below; a component writes the role (text-label), never the size.
export const PROTOTYPE_TYPE_SIZES = [
  9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 20, 23, 26,
] as const;

// The type roles: every prototype size, named by where hos.css uses it. Each is --nova-text-<role>
// (the size) and --nova-text-<role>-leading (its line height, the body's 1.55 by default) and
// reaches Tailwind as text-<role>. Letter-spacing is its own token (TRACKING_EM), because the same
// size is set with and without it (a 17px h2 is tracked, a 17px glyph is not).
export const TYPE_ROLES = {
  micro: {
    px: 9.5,
    source: '.wa-time, .ws-group, .sb-aside-l, the .tb-dot count',
  },
  badge: {
    px: 10,
    source: '.tab-badge and the nav count pill, .ic monogram, .bed .b-no',
  },
  overline: {
    px: 10.5,
    source: '.nav-label, .sf-role, .sb-aside-n, .tag-offline, .token .t-l',
  },
  meta: {
    px: 11,
    source: '.feed-t, .tl-date, thead th, .brand-sub, .bed',
  },
  caption: {
    px: 11.5,
    source: '.chip, .kpi-d, .ai-src, .role-badge, .crumb-bar (narrow)',
  },
  label: {
    px: 12,
    source: 'label.f-label, .kpi-l, .tiny, .legend, .chart text, .btn-sm',
  },
  'body-sm': {
    px: 12.5,
    source:
      '.wa-msg, .sf-name, .tabbar.sub .tab, .chart .dl, .ai-approved-note',
  },
  control: {
    px: 13,
    source: '.btn, .tab, table, .feed-item, .page-head p, .phone-h',
  },
  input: {
    px: 13.5,
    source: '.f-input, .nav a, .ai-block-h b, .ws-cur-n',
  },
  body: { px: 14, source: 'body, h3, .topbar .hospital' },
  lead: { px: 15, source: '.ws-chev' },
  subtitle: { px: 16, source: '.brand-name' },
  title: { px: 17, source: 'h2' },
  headline: { px: 20, source: '.token .t-no' },
  display: { px: 23, source: 'h1' },
  kpi: { px: 26, source: '.kpi-v' },
} as const;

export type TypeRole = keyof typeof TYPE_ROLES;

// Line heights (hos.css: 1 for glyph rows, 1.3 .brand-sub, 1.4 the crumb bar, 1.45 .sb-aside-n,
// 1.55 the body; 1.62 is Nova's reading measure for AI prose).
export const LEADING = {
  none: 1,
  tight: 1.3,
  snug: 1.4,
  normal: 1.45,
  body: 1.55,
  relaxed: 1.62,
} as const;

// Letter-spacing, in em (hos.css: h1 -0.015, h2 -0.01, h3 -0.005; .01 the .ic and avatar initials,
// .04 .tl-date, .06 thead th, .08 .nav-label, .09 .ws-group and .sb-aside-l).
export const TRACKING_EM = {
  h1: -0.015,
  h2: -0.01,
  h3: -0.005,
  normal: 0,
  initials: 0.01,
  label: 0.04,
  caps: 0.06,
  eyebrow: 0.08,
  group: 0.09,
} as const;

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

// How far the AiButton's sheen band lightens the AI hover fill at its peak (theme.css paints exactly
// this; ai-button-motion.spec.ts compares them). The legibility proof holds white label text at 4.5:1
// on the lightened fill for every hospital's AI colour.
export const AI_SHEEN_PEAK = 0.14;

// The halo behind the white glyph of the AI tile (AiMark tile): a tight dark shadow, `--nova-ai-spark-
// glyph-shadow` in theme.css. The legibility proof models the glyph's edge as the halo ink over each
// stop of the AI gradient at `alpha`; utilities.spec.ts holds theme.css at least that strong.
export const AI_SPARK_HALO = { ink: '#001923', alpha: 0.3 } as const;

export const MOTION_DURATIONS_MS = { fast: 150, base: 200, slow: 240 } as const;

export const EASE_UTILITIES = Object.keys(MOTION_EASINGS).map(
  (name) => `ease-${name}`,
);

export const DURATION_UTILITIES = Object.keys(MOTION_DURATIONS_MS).map(
  (name) => `duration-${name}`,
);
