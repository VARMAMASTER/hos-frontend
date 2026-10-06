# @hos/nova-ui

Nova is the HOS component library: semantic tokens, a glass/solid material system, per-hospital
theming, and 47 accessible React components for clinical screens. React 19 and Tailwind CSS v4.

## Install

```sh
pnpm add @hos/nova-ui
# peers, if the app does not have them yet
pnpm add react@^19 react-dom@^19
```

Recharts (the charts) and react-is come in as dependencies.

## Import the CSS

Every component is styled by Tailwind classes plus Nova's tokens and `nova-*` utilities, which live in
`theme.css`. Import it after Tailwind in the app's stylesheet, and point Tailwind's scanner at the
package so the classes Nova uses are generated:

```css
@import 'tailwindcss';
@import '@hos/nova-ui/theme.css';
@source '../node_modules/@hos/nova-ui/dist';
```

Without `theme.css` the components render unstyled; without the `@source` line Tailwind drops the
classes it never saw. Nova's default body font is Google Sans Flex: load it (or set your own with a
theme's `fontBody`).

Put the page on the canvas, the brand-tinted background glass frosts:

```tsx
<body className="nova-canvas font-sans text-ink">
```

## Theme a hospital

A hospital brings three brand colours and, optionally, a font and a material. `createNovaTheme`
validates them: every brand text pairing must reach 4.5:1, and it throws a `NovaThemeError` naming
the colour and the ratio when one does not. Status, AI, chart and ink colours are never
tenant-overridable.

```tsx
import { applyNovaTheme, createNovaTheme, NovaThemeProvider } from '@hos/nova-ui';

const theme = createNovaTheme({
  name: 'Teal Care',
  brand: { primary: '#0F766E', primaryStrong: '#115E59', primarySoft: '#CCFBF1' },
  material: 'glass', // or 'solid'; unset keeps the product default (glass)
});

applyNovaTheme(theme); // the whole document; returns a cleanup
// or, for one subtree:
<NovaThemeProvider theme={theme}>{children}</NovaThemeProvider>;
```

Both write only the allow-listed brand and font variables (`NOVA_THEME_VARIABLES`).
`applyNovaMaterial('solid')` switches the material product-wide. The OS asking for reduced
transparency or more contrast always forces solid.

## Primitives

- `Surface` — every container is one: pick a `material` (`surface`, `overlay`, `field`, `chrome`,
  `hero`, `data`) and the tokens decide what glass or solid looks like.
- `focusRing` — the one keyboard focus indicator; light surfaces reset it to the brand primary.
- `cx`, `VisuallyHidden` (`as` for block content), `useControllableState`.
- `contrastRatio`, `mixColours` — the maths the theme gate and the token proofs use.

## Components

- **Shell:** `AppShell`, `Sidebar`, `NavItem`, `TopBar`, `SearchField`, `BrandMark`,
  `ModuleSwitcher`, `SectionNav`, `SplitLayout`, `Breadcrumbs`, `HeroBand`.
- **Content:** `Card`, `KpiTile` (with a `visual` slot), `Table`, `Tabs`, `Pagination`, `Divider`,
  `EmptyState`, `Avatar`, `IconTile`, `Tag`, `Chip`, `ToneLabel`, `StatusDot`, `Banner`,
  `Timeline`, `ActivityFeed`, `BedGrid`.
- **Forms:** `TextField`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`.
- **Overlays:** `Dialog` (portals into the nearest themed root), `Menu` with `MenuItem`,
  `MenuItemRadio` and `MenuGroup`, `Tooltip`.
- **AI:** `AiBadge`, `AiPanel`, `ApprovalBar`.
- **Charts:** `BarChart`, `LineChart`, `AreaChart`, `DonutChart`, `Sparkline`, and the
  shadcn-style `ChartContainer` primitives. Series take the fixed `--nova-chart-1..6` palette; every
  chart is a named figure with a visually hidden data table.

## Rules the components keep

State is never colour-only (tones carry a word, AI carries the AI badge), text holds 4.5:1 and
focus rings and control edges 3:1 for every brand the gate accepts, and keyboard behaviour follows
the WAI-ARIA patterns. The specs in `src/tokens` and `src/styles` prove the contrast for every
brand; `src/primitives/conventions.spec.ts` keeps components on tokens and primitives.

## Develop

```sh
NX_DAEMON=false pnpm nx run-many -t test lint typecheck build --projects=nova-ui
pnpm exec storybook dev -c packages/nova-ui/.storybook
```
