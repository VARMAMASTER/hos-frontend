// The spacing scale and the radius grammar (docs/design-language/README.md, "Spacing and radius"),
// as data. theme.css declares the same values for the browser and conventions.spec.ts derives its
// allow-lists from here, so the rule, the CSS and the components cannot drift apart (scale.spec.ts).

// Tailwind's --spacing unit. theme.css pins it to this value.
export const SPACING_UNIT_PX = 4;

// Every padding, margin and gap sits on this scale.
export const SPACING_PX = [2, 4, 8, 12, 16, 20, 24, 32, 48, 64] as const;

// The same scale as Tailwind utility steps (p-3 is 12px), plus 0 and px, the 1px hairline that
// separates adjacent boxes. These are the only steps a spacing utility may use.
export const SPACING_STEPS: readonly string[] = [
  '0',
  'px',
  ...SPACING_PX.map((px) => String(px / SPACING_UNIT_PX)),
];

// The named radii, in px. theme.css declares them as --nova-radius-* and maps them to rounded-*.
export const RADIUS_PX = { sm: 6, md: 10, lg: 14, xl: 20 } as const;

// The only rounded-* utilities. Pills and true circles are rounded-full; no per-side or per-corner
// form, and no arbitrary value, exists in the grammar.
export const RADIUS_UTILITIES = [
  'rounded-none',
  ...Object.keys(RADIUS_PX).map((name) => `rounded-${name}`),
  'rounded-full',
] as const;
