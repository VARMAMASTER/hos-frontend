import {
  LEADING,
  RADIUS_ROLES,
  TRACKING_EM,
  TYPE_ROLES,
  type TypeRole,
} from './scale';
import type { NovaVariable } from './semantic';

// The design-token layer: every design value a component uses, as a named token. theme.css declares
// exactly these in its "Design tokens" :root block (design.spec.ts compares the two) and maps each to
// a Tailwind utility; a component names the utility (p-card, h-control-md, text-label,
// rounded-control) and never a number, so changing one value here and in theme.css restyles every
// component that uses it (token-reach.spec.tsx proves it).
//
// A component token points at the scale wherever the prototype's value is on it (--nova-control-px-md
// is var(--nova-space-6)), so editing the scale moves the components too. A value that is not on any
// scale (the 44px touch target, a 15px icon glyph) is a token of its own.
//
// Adding a value: add a token here and in theme.css (and its utility in theme.css's @theme inline
// block), never a literal in a component. See docs/design-language/README.md, "Design tokens".

const space = (step: number) => `var(--nova-space-${step})`;

// Type roles: the size, and its line height (the body's, so a role set on any element reads like
// the prototype's inherited 1.55).
export const TYPE_TOKENS = Object.fromEntries(
  (Object.keys(TYPE_ROLES) as TypeRole[]).flatMap((role) => [
    [`--nova-text-${role}`, `${TYPE_ROLES[role].px}px`],
    [`--nova-text-${role}-leading`, 'var(--nova-leading-body)'],
  ]),
) as Record<NovaVariable, string>;

export const LEADING_TOKENS = Object.fromEntries(
  Object.entries(LEADING).map(([name, value]) => [
    `--nova-leading-${name}`,
    String(value),
  ]),
) as Record<NovaVariable, string>;

export const TRACKING_TOKENS = Object.fromEntries(
  Object.entries(TRACKING_EM).map(([name, em]) => [
    `--nova-tracking-${name}`,
    `${em}em`,
  ]),
) as Record<NovaVariable, string>;

export const RADIUS_ROLE_TOKENS = Object.fromEntries(
  Object.entries(RADIUS_ROLES).map(([role, step]) => [
    `--nova-radius-${role}`,
    `var(--nova-radius-${step})`,
  ]),
) as Record<NovaVariable, string>;

// Component dimensions, so components that should match share one value.
export const DIMENSION_TOKENS = {
  // Edges: the hairline every border is, the emphasised (selected) edge, an accent rail (the AI rail,
  // a toast's status edge, a selected row's highlight rail), and the keyboard focus outline.
  '--nova-border-hairline': '1px',
  '--nova-border-emphasis': '2px',
  '--nova-border-rail': '3px',
  '--nova-focus-width': 'var(--nova-border-emphasis)',
  '--nova-focus-offset': space(0),
  // Controls, per size (.btn, .btn-sm): padding, the gap between a control's parts, and the height,
  // which is the prototype's padding + its line + its border, so it follows all three.
  '--nova-control-py-sm': space(2),
  '--nova-control-px-sm': space(4),
  '--nova-control-py-md': space(3),
  '--nova-control-px-md': space(6),
  '--nova-control-gap': space(3),
  '--nova-control-h-sm':
    'calc(var(--nova-control-py-sm) * 2 + var(--nova-text-label) * var(--nova-leading-body) + var(--nova-border-hairline) * 2)',
  '--nova-control-h-md':
    'calc(var(--nova-control-py-md) * 2 + var(--nova-text-control) * var(--nova-leading-body) + var(--nova-border-hairline) * 2)',
  // A field's inline inset (.f-input), and the inset past a leading or trailing icon.
  '--nova-field-px': space(4),
  '--nova-field-icon-inset':
    'calc(var(--nova-field-px) + var(--nova-icon-md) + var(--nova-space-2))',
  // Cards (.card-b, .card-h) and floating layers (a dialog's header, body and footer).
  '--nova-card-p': space(6),
  '--nova-card-bar-py': space(5),
  '--nova-card-gap': space(5),
  '--nova-overlay-px': space(7),
  '--nova-overlay-py': space(6),
  '--nova-overlay-bar-py': space(5),
  // Chips (.chip), tags (.tag-*) and count badges (the nav count, .tab-badge).
  '--nova-chip-px': space(3),
  '--nova-chip-py': space(0),
  '--nova-chip-gap': space(2),
  '--nova-tag-px': space(3),
  '--nova-tag-py': space(0),
  '--nova-badge-px': space(2),
  '--nova-badge-py': 'var(--nova-border-hairline)',
  // Rows of tables, lists and menus.
  '--nova-row-px': space(6),
  '--nova-row-py-comfortable': space(4),
  '--nova-row-py-compact': space(2),
  // Targets: 44px for a primary touch target, 24px the WCAG 2.5.8 minimum for a small one.
  '--nova-touch': '44px',
  '--nova-touch-sm': space(8),
  // Icons, dots and marks: the glyph sizes, the .ic glyph (15px), the status .dot (7px) and its small
  // sibling, the .ai-spark mark (22px), the .ic tile (24px), and a spinner that scales with its text.
  '--nova-icon-xs': space(5),
  '--nova-icon-sm': '14px',
  '--nova-icon-tile': '15px',
  '--nova-icon-md': space(6),
  '--nova-icon-lg': space(7),
  '--nova-dot-sm': '5px',
  '--nova-dot': '7px',
  '--nova-mark': '22px',
  '--nova-tile': space(8),
  '--nova-spinner': '1.1em',
  // Underline offsets for links.
  '--nova-underline-offset-tight': space(0),
  '--nova-underline-offset-loose': space(1),
} as const satisfies Record<NovaVariable, string>;

// The whole layer, in the order theme.css declares it.
export const NOVA_DESIGN_TOKENS: Readonly<Record<NovaVariable, string>> = {
  ...TYPE_TOKENS,
  ...LEADING_TOKENS,
  ...TRACKING_TOKENS,
  ...RADIUS_ROLE_TOKENS,
  ...DIMENSION_TOKENS,
};
