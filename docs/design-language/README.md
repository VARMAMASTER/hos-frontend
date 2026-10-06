# Nova design language: Apple refinements on violet glass

**This file is binding.** The Apple references in this folder supply the _craft_. Where they conflict with Nova, this file decides.

Owner decision (2026-10-06): "Apple refinements on Nova", with Inter as the typeface.

Nova keeps:

- its identity: violet brand, per-hospital themes, the glass/solid material axis, and the brand, chrome, aurora, edge and AI gradients;
- every accessibility rule.

Nova adopts Apple's typography, spacing, radius grammar, control shapes, flat elevation and motion.

## References (read for intent; this file wins on conflict)

These files are copies of the project skill `.claude/skills/apple-design-system` in the HOS folder:

- `apple-reference/apple-design-source.md`: the Apple visual philosophy (condensed DESIGN.md).
- `apple-reference/tokens.md`: the token set (colour, spacing, radius, borders, type).
- `apple-reference/components.md`: per-component specs. They are React Native; translate `View`→`div` but keep the tokens, radii, weights and border widths.
- `apple-reference/checklist.md`: the review checklist (read "Action Blue" as Nova `primary`).

## Typography

- **Inter** (variable) replaces Google Sans Flex as `--nova-font-body`. IBM Plex Mono stays for figures, IDs and tabular numbers. Update the Google Fonts links in Storybook (`.storybook/preview-head.html`) and the web app (`apps/web/index.html`).
- **Type ramp** becomes tokens, mapped into Tailwind's `@theme`:

  | Token      | Size |
  | ---------- | ---- |
  | `micro`    | 11px |
  | `caption`  | 13px |
  | `callout`  | 15px |
  | `body`     | 17px |
  | `headline` | 20px |
  | `title3`   | 28px |
  | `title2`   | 40px |
  | `title1`   | 56px |

  Components use the ramp, never ad-hoc `text-[13px]`.

- **Weights: 400 / 600 / 700 only. 500 is banned.** No `font-medium` anywhere. Labels and emphasis use 600, body 400, headlines 700.
- Headlines (≥ 20px) tighten tracking slightly, about -0.01em. Small text is never tightened.
- Body reading text and form input text are 17px. Dense data (table cells, chips, meta lines) uses `callout` (15) or `caption` (13). This is a clinical density decision: tables stay scannable.

## Spacing and radius

- Spacing scale: 2, 4, 8, 12, 16, 20, 24, 32, 48, 64. Prefer `gap` on flex containers over per-child margins. Card interior padding is 20, field padding 16 × 12, label-to-control gap 4, gap between stacked fields 16-20.
- **Radius grammar**, from `apple-reference-tokens.md` and replacing Nova's 8/12/18:

  | Token  | Value | Use                                                             |
  | ------ | ----- | --------------------------------------------------------------- |
  | `sm`   | 6px   | inline, compact                                                 |
  | `md`   | 10px  | inputs, small tiles                                             |
  | `lg`   | 14px  | cards, dialogs, sheets                                          |
  | `xl`   | 20px  | large hero surfaces                                             |
  | `pill` | full  | anything that reads as an action: buttons, filter chips, search |

  Nothing in between. Corners stay continuous (Nova's global `corner-shape: squircle`, the web equivalent of `borderCurve: 'continuous'`). True circles (avatars, switch thumbs, dots) opt out with `[corner-shape:round]`.

## Borders and elevation (flat, Apple-style)

- **No shadow on cards, buttons, inputs, chips, menus or dialogs.** Depth comes from surface change, 1px hairlines, the glass material's blur, and a scrim behind modals. Remove Nova's hue-tinted card and button shadows, and the glass surfaces' drop shadows. Glass keeps its frosted fill, its blur and its 1px white rim / top inset highlight; that highlight is a rim, not a shadow.
- Two border widths only:
  - 1px for default edges;
  - 2px `primary` only on a _selected_ card or option.
- Card and divider hairlines use a soft hairline token, as subtle as Apple's.
- **Interactive control edges are the exception.** Inputs, selects, checkboxes, radios and the switch track keep a boundary of at least 3:1 against their surface. Nova's proven `--nova-field-edge` stays: WCAG 1.4.11 applies, and clinicians must see a field. Focused uses 1px plus the focus ring in `primary`; error uses crit.

## Colour

- **One interactive accent: Nova `primary`.** It is violet by default and each hospital's own brand under its theme; it is the "Action Blue" role. Links, CTAs, focus and selected state all use it. No second interactive colour.
- Status colours stay Nova's accessible -soft / -deep pairs, not iOS system colours (`#ff9500` on white is about 2.2:1). Status is never decoration.
- AI stays the fixed cyan with the ✦ marker and the AI gradient.
- Gradients stay where Nova's identity lives: the hero band, the sidebar and top-bar chrome, the aurora canvas, the data-card edge, and AI accents. **No gradient on buttons**; the pill shape carries the emphasis.

## Controls (from the catalog, adapted)

- **Button = pill CTA.**
  - Shape: radius `pill`, padding 12 × 24 (md) and a compact sm size.
  - Label: `body` 17 at **400**. Do not bump the weight; the pill carries emphasis.
  - Variants:
    - `primary`: filled primary;
    - `outline`: the old `secondary`, renamed, with a 1px primary border and primary text;
    - `ghost`: primary text, no border;
    - `danger`: crit fill, white text;
    - `ai`: AI fill, ✦ marker.
  - States:
    - press: `scale(0.95)`;
    - disabled: opacity 0.5;
    - `loading`: a spinner replaces the label, keeping the width, with `aria-busy`;
    - `fullWidth`.
  - No shadow, no gradient.
- **Input:**
  - label 600 at `callout`;
  - field radius `md`, padding 16 × 12, text `body` 17, placeholder in muted ink;
  - optional leading and trailing icons at 18px;
  - helper line in `caption`; the error line in crit.
  - Edge: the 3:1 rule above. Selects follow the same spec.
- **Card:**
  - radius `lg`, 1px hairline, padding 20, gap 8, no shadow;
  - title 600 at `headline` 20, supporting copy at `callout` / `caption`;
  - optional footer row with `space-between`;
  - interactive cards press to `scale(0.98)`; a selected card gets a 2px primary border and nothing else.
  - On glass, the panel variant keeps its frosted fill.
- **Chip:** pill, padding 8 × 2, `caption` 13. Two kinds:
  - Status tone chips keep the -soft / -deep pairs and a leading icon or word. They are never colour-only.
  - Add `FilterChip`: a toggle with `aria-pressed`, parchment-like inactive, primary active, press `scale(0.96)`.
- **Avatar:** a circle with a soft surface fill and initials at 600 in muted ink. Sizes 20, 32, 40, 48. An optional `verified` glyph sits in primary.
- **Tabs, checkbox, radio, switch:** restyled to the grammar.
  - The switch is iOS-style: a pill track with a white circular thumb and primary when on.
  - Checkbox / radio rows get a 44px minimum touch target.
- **Motion:** quiet and quick.
  - Entrances: 150-240ms ease-out.
  - Press: `scale(0.95)` buttons, 0.96-0.99 chips and cards.
  - Dialogs: scale in from 0.94 with a fade.
  - All of it is disabled under `prefers-reduced-motion`.

## New components from the catalog

- **Toast (`Toaster` + `showToast(message, variant)`):**
  - top-centred, radius `lg`, no shadow;
  - variants: `info` on near-black, `success` on primary, `error` on crit;
  - white `callout` text, auto-dismiss at 3500ms, tap to dismiss, `role="status"` / `aria-live`.
- **OtpInput:**
  - six square boxes with a hidden real input (`autocomplete="one-time-code"`, numeric);
  - digits 600 at `title3`;
  - the active box gets a primary edge; error gets a crit edge plus the shake animation (reduced-motion: no shake).
  - It serves login by mobile OTP.
- **AlertDialog:**
  - a centred confirm on Nova's Dialog: max-width 280, radius `lg`, scrim, no shadow;
  - title 600 at `headline`, message at `callout`;
  - a button row divided by hairlines (two side by side; one, or three or more, stacked);
  - cancel / destructive / default roles.
  - Use it only when the user must choose; use a Toast for confirmations.
- **NotificationBell:** a bell button with an accessible name. The unread badge is a crit pill with the count (99+ cap) and the count in its accessible name.
- **StatGauge:** value 600 at `headline`, label at `caption`, a 6px track with a primary fill, and `role="meter"` with `aria-valuenow`. Use it for things like bed occupancy.
- **EmptyState** (existing): restyle to the catalog. Centred, 64px vertical padding, a 44px icon, title 600 at `title3`, body at `body` centred and max-width 320, optional CTA.

## Unchanged rules (still enforced by tests)

Status is never colour-only. Text is at least 4.5:1, every brand proven. Focus rings and control edges are at least 3:1. Dense data is never translucent. Tenants cannot override status or AI. Components compose the primitives. `conventions.spec.ts` gains:

- no `font-medium` (weight 500 is banned);
- no shadow utilities on components.
