# Nova design language: the HOS prototype

Nova is the HOS prototype, built as a React library. **`os/public/assets/hos.css` ("HOS Design System v3") is binding**: its `:root` tokens, its shapes and its sizes. The prototype pages in `os/public/*.html` and the screenshots in `os/public/assets/shots/` show how they are used. Where this file and the prototype disagree, the prototype wins; where the prototype and an accessibility proof disagree, the proof wins and the value is listed under [Held by a proof](#held-by-a-proof).

The Apple adaptation that used to live here is superseded (owner decision, 2026-10-06). `apple-reference/` is kept only as history.

## How the prototype maps onto Nova

Nova's semantic names stay the API (`--nova-color-primary`, `bg-surface`, `text-ink-2`); every **value** is the prototype's. `tokens/semantic.ts` (`NOVA_DEFAULTS`) and `styles/theme.css` hold the same values, and `semantic.spec.ts` compares them token by token with `hos.css`.

| Prototype                                                                                                                                                   | Nova token                                           | Tailwind                                                 | Value                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| `--bg`                                                                                                                                                      | `--nova-color-bg`                                    | `bg-bg`                                                  | `#F0EFF9`                                                        |
| `--panel`                                                                                                                                                   | `--nova-color-surface`                               | `bg-surface`                                             | `#FFFFFF`                                                        |
| `--panel-2`                                                                                                                                                 | `--nova-color-surface-2`                             | `bg-surface-2`                                           | `#F8F7FD`                                                        |
| `--line`                                                                                                                                                    | `--nova-color-border`                                | `border-border`                                          | `#E4E1F2`                                                        |
| `--line-strong`                                                                                                                                             | `--nova-color-border-strong`                         | `border-border-strong`                                   | `#CFC9E6`                                                        |
| `--ink`, `--ink-2`                                                                                                                                          | `--nova-color-ink`, `-ink-2`                         | `text-ink`, `text-ink-2`                                 | `#1A1730`, `#5B5775`                                             |
| `--ink-3`                                                                                                                                                   | `--nova-color-ink-3`                                 | `text-ink-3`                                             | `#5D5974` (held, see below)                                      |
| `--teal`, `--teal-strong`, `--teal-soft`, `--teal-ghost`                                                                                                    | `--nova-color-primary`, `-strong`, `-soft`, `-ghost` | `bg-primary` …                                           | `#6D4FE0`, `#5636B8`, `#EFEAFC`, `#F8F5FE`                       |
| `--ai`, `--ai-bright`, `--ai-deep`, `--ai-soft`, `--ai-ghost`, `--ai-line`                                                                                  | `--nova-color-ai*`                                   | `bg-ai` …                                                | `#0E7490`, `#22D3EE`, `#0B5567`, `#DDF4FA`, `#F6FDFF`, `#B9E6F2` |
| `--good`, `--warn`, `--crit`, `--info` with `-soft` and `-deep`                                                                                             | `--nova-color-good*` …                               | `bg-good-soft text-good-deep` …                          | unchanged                                                        |
| `--chrome-1`, `-2`, `-3`, `--chrome-glass`, `--chrome-line`, `--chrome-ink`, `--chrome-ink-2`, `--chrome-accent`, `--chrome-accent-soft`, `--chrome-glow-2` | `--nova-color-chrome-*`                              | `bg-chrome-1`, `border-chrome-line`, `text-chrome-ink` … | verbatim                                                         |
| `.tb-dot` ring `#221448`                                                                                                                                    | `--nova-color-chrome-ring`                           | `border-chrome-ring`                                     | `#221448`                                                        |
| `--ai-grad`                                                                                                                                                 | `--nova-gradient-ai`                                 | `nova-ai-grad`                                           | cyan → AI cyan → violet (the violet pinned, never the brand)     |
| `--ai-mark`                                                                                                                                                 | `--nova-ai-mark`                                     | `nova-ai-mark`                                           | the four-hue conic spark, on the mark only                       |
| `--f-display`, `--f-body`, `--f-mono`                                                                                                                       | `--nova-font-display`, `-body`, `-mono`              | `font-display`, `font-sans`, `font-mono`                 | Google Sans Flex; IBM Plex Mono                                  |
| `--sidebar-w`                                                                                                                                               | `--nova-sidebar-w`                                   |                                                          | `248px`                                                          |

Fonts load from the prototype's own Google Fonts URL (`family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=IBM+Plex+Mono:wght@500;600`) in `apps/web/index.html` and Storybook's `preview-head.html` and `manager-head.html`. The body is the prototype's: 14px on a 1.55 line with optical sizing (`theme.css`, `@layer base`), so a component that sets only a size inherits the prototype's line height.

## Scales

| Scale    | Prototype                                                                                                  | Nova, in components                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------ | ------------------------------- | ---------- | --------------------- | --- | ------ |
| Spacing  | `--space-0 … 10`: 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48 px                                                | Tailwind steps `0.5 1 1.5 2 2.5 3 4 5 6 8 12`, plus `0` and `px`           |
| Radius   | `--r-sm 8`, `--r-md 12`, `--r-lg 18`, `--r-xl 22`, `--r-full 999`                                          | `rounded-sm                                                                | md     | lg                              | xl         | full`, `rounded-none` |
| Type     | every `font-size` in `hos.css`: 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 20, 23, 26 px | `text-[12.5px]` and so on, from `PROTOTYPE_TYPE_SIZES` (`tokens/scale.ts`) |
| Weight   | 400, 500, 600, 700                                                                                         | `font-normal                                                               | medium | semibold                        | bold`      |
| Shadow   | `--shadow-sm                                                                                               | md                                                                         | lg     | glass`, on hue `262deg 45% 27%` | `shadow-sm | md                    | lg  | glass` |
| Headings | h1 23/600/-0.015em, h2 17/600/-0.01em, h3 14/600/-0.005em                                                  | `tracking-h1                                                               | h2     | h3` with the size and weight    |

Corners are plain `border-radius`: the prototype has no `corner-shape`. Where the prototype writes a literal radius off its own scale (`.btn` 9px, `.tab` 10px, `.tabbar` 14px, `.ic` 7px, `.brand-mark` 11px), Nova uses the nearest `--r-*` step.

`primitives/conventions.spec.ts` enforces all of it in every component: only these spacing steps, radii, type sizes, weights and shadows; no stock `text-xs|sm|…`, no raw hex, no stock palette, no private backdrop-filter, outline classes or `corner-shape`, and no hand-written gradient.

## Surfaces and gradients

Each prototype surface is one utility in `theme.css`, reached through `Surface` (`material=`):

| Role       | Utility         | Prototype                                                                                              |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `card`     | `nova-card`     | `.card`: panel, `--line` edge, `--shadow-sm`, radius md                                                |
| `data`     | `nova-data`     | `.card` plus `.edge-premium`, the 1px violet-to-cyan gradient edge (KPI tiles swap in the `.kpi` edge) |
| `surface`  | `nova-surface`  | `.glass-panel` on glass, heavier on frost, the card on solid                                           |
| `overlay`  | `nova-overlay`  | `.glass-card` (menus, dialogs, tooltips)                                                               |
| `field`    | `nova-field`    | `.f-input`: opaque panel, the proven control edge                                                      |
| `chrome`   | `nova-chrome`   | `.topbar`: the indigo gradient with grain, frosted                                                     |
| `sidebar`  | `nova-sidebar`  | `.sidebar`: deepening gradient, the brand lift, grain; never frosted                                   |
| `hero`     | `nova-hero`     | `.glass-hero`: violet to sky over the chrome glass, `--shadow-glass`                                   |
| `ai-block` | `nova-ai-block` | `.ai-block`: AI wash, AI line, the 3px gradient rail; green once approved                              |

Smaller utilities: `nova-card-head` (`.card-h` tint), `nova-tabbar` (`.tabbar`), `nova-ai-spark` (`.ai-spark`), `nova-ai-rail`, `nova-ai-grad`, `nova-ai-mark`, `nova-bar-grad` (`.sb-bar`), `nova-gradient-text`, `nova-canvas` (the aurora).

Gradients are back exactly where the prototype draws them: the AI rail on AI blocks, the gradient edge on data surfaces, the chrome and hero gradients, the AI gradient and mark. A component never writes one of its own; it uses these utilities or tokens.

## Three independent axes

A screen is the product of three settings, each switchable anywhere in the tree and each independent of the other two:

| Axis           | Values                                     | Set by                                                                                |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| Hospital theme | HOS Violet (default) or a hospital's brand | `createNovaTheme`, then `NovaThemeProvider theme` or `applyNovaTheme`                 |
| Material       | `glass` (default), `frost`, `solid`        | `data-nova-material`, `NovaThemeProvider material`, `applyNovaMaterial`, or the theme |
| Scheme         | `light` (default), `dark`, `system`        | `data-nova-scheme`, `NovaThemeProvider scheme`, `applyNovaScheme`                     |

Storybook has a toolbar switch for each (Hospital theme, Material, Scheme). `Themes/Preview` shows the sidebar, top bar, hero, canvas, cards, a table and an AI block on one page; `Themes/Side by side` shows every preset at once, in both schemes.

## Hospital themes

A hospital gives three brand colours (`primary`, `primaryStrong`, `primarySoft`) and optionally a body font. The engine (`theme/derive.ts`) derives the whole brand-dependent palette from them, light and dark:

- the chrome gradient stops (`--nova-color-chrome-1|2|3`), the sidebar base and lift (`--nova-color-sidebar-1|2|3`, `--nova-color-sidebar-lift`), so the top bar, the sidebar and the hero follow the brand;
- the canvas (`--nova-color-bg`) and its aurora, the panels, the lines (`border`, `border-strong`, `border-control`) and the inks (`ink`, `ink-2`, `ink-3`), each tinted to the brand's hue;
- the chrome accent (the nav-active fill and the sidebar focus ring), the brand edges and bars, `primary-ghost` and `primary-hover`.

**How:** each of HOS Violet's colours is rotated to the brand's hue in OKLCH, its chroma scaled by how colourful the brand is, and pinned back to the WCAG luminance it had. Contrast is a function of luminance alone, so every ratio the prototype was proven at survives the move. The top bar's light end and the hero base are also kept no lighter over white than the violet ones, because glass blends in sRGB, not in luminance.

**HOS Violet is the prototype, exactly.** Its derived palette is `hos.css`, value for value, and `semantic.spec.ts` still compares every token with `os/public/assets/hos.css`.

**Never tenant-overridable:** status, AI and the chart palette. A theme writes only the derived palette and the body font. `NovaThemeProvider` and `applyNovaTheme` rebuild that palette from the brand colours alone, so a stored row cannot set an ink, a canvas or a chrome colour of its own.

**Every pairing is proven for every brand.** `theme/legibility.ts` lists every pairing Nova draws: about 140 per scheme and material. Text must reach 4.5:1; control edges, rings and marks 3:1. `createNovaTheme` runs it in both schemes, on the hospital's own material (or on all three, when the material is left to the product). A brand that fails is rejected with the colours, the ratio, what the pairing is for and where, and a suggestion that itself passes: the same hue at HOS Violet's lightness. `legibility.spec.ts` sweeps 480 brands round the hue circle, from grey to vivid and from deep to the lightest a brand may be, through both schemes and all three materials.

Presets in Storybook: HOS Violet, Teal Care, Clinical Blue, Rose and Slate (high contrast).

## Dark scheme

`dark` turns the content dark: the canvas, panels, lines, inks, status tints, AI wash and chart palette. The chrome (top bar, sidebar and hero) is dark in both schemes and stays the brand's. `system` follows `prefers-color-scheme` live, with no script.

**How:** each scheme token is `light-dark(light, dark)`, both on `:root` and in each theme's inline palette. A scheme is only a `color-scheme`. The browser resolves the colour where it is used, so a scheme set on any subtree wins inside it, whatever theme or material surrounds it. A browser without `light-dark()` keeps the light `:root` block: the light scheme.

**The dark values are built, not picked** (`tokens/scheme.ts`). Each is its light colour's hue, pinned to a luminance chosen for the proofs:

| Tokens                                   | Luminance           | Why                                               |
| ---------------------------------------- | ------------------- | ------------------------------------------------- |
| Canvas, panel, panel-2                   | 0.008, 0.014, 0.019 | the dark ground                                   |
| Lines                                    | 0.045 and 0.075     | hairlines                                         |
| Control edge                             | 0.19                | 3:1 on every dark panel                           |
| Inks                                     | 0.82, 0.42, 0.30    | 4.5:1 or more                                     |
| Status, AI and brand fills               | 0.175               | white text at 4.5:1, and 3:1 as a mark on a panel |
| Their tints, their deep inks             | 0.022, 0.42         | ink on its tint at 6.5:1                          |
| The brand's strong (text) and hover fill | 0.42 and 0.11       | text on a dark panel, a fill under white text     |

Status colours keep their hues: a dark good is still green and a dark crit still red. The chart palette is retuned on the same hues, to within 12°. Every series holds 3:1 on a dark card, sits 15 apart from its neighbours and 10 from every dark status, brand and AI colour. Dense data stays opaque.

In the dark scheme `primary-strong` and `ai-deep` are text colours, so they turn light. The fills that white text sits on when a button is hovered are `primary-hover` and `ai-hover`, in light and dark (in the light scheme they equal `primary-strong` and `ai-deep`).

## Material

Glass is the default and is the prototype's own glass: the top bar, the hero, glass panels and overlays frost. Cards, fields, data and the sidebar stay solid, as the prototype keeps them ("glass never under dense data").

- **Frost** is a heavier, more opaque glass for legibility: about twice the blur, panels at 86% and overlays at 92%, tinted toward panel-2, which carries the brand's faint hue. It also has a more opaque top bar and hero.
- **Solid** is the prototype's opaque fallbacks.

`prefers-reduced-transparency`, `prefers-contrast: more` and a browser without `backdrop-filter` always force solid.

A material is numbers only: opacities, tints, filters and the scheme-aware sheen (the white of a glass rim, dimmed in the dark). `theme.css` builds the fills from those numbers and the nearest theme's colours, on every theme and material scope, so any material meets any theme in either scheme. Every pairing is proven for all three materials in both schemes, for every brand.

## Motion

Named curves and durations, as tokens (`--nova-ease-*`, `--nova-duration-*`) and utilities:

| Utility           | Value                               | For                                  |
| ----------------- | ----------------------------------- | ------------------------------------ |
| `ease-spring`     | `cubic-bezier(0.34, 1.56, 0.64, 1)` | something landing: a thumb, a toggle |
| `ease-standard`   | `cubic-bezier(0.2, 0, 0, 1)`        | hover, focus and colour changes      |
| `ease-emphasized` | `cubic-bezier(0.05, 0.7, 0.1, 1)`   | a surface entering                   |
| `duration-fast`   | 150ms                               |                                      |
| `duration-base`   | 200ms                               |                                      |
| `duration-slow`   | 240ms                               |                                      |

Components apply them under `motion-safe`, so `prefers-reduced-motion` still turns motion off.

## Held by a proof

These prototype values fail an accessibility proof (`tokens/material.spec.ts`, which also shows each prototype value failing), so Nova keeps the nearest value that passes:

| Value                 | Prototype                            | Nova                                    | Why                                              |
| --------------------- | ------------------------------------ | --------------------------------------- | ------------------------------------------------ |
| `--ink-3`             | `#6A6584`                            | `#5D5974`                               | small print at 4.5:1 on the aurora-tinted canvas |
| Form control edge     | `--line-strong` (1.6:1)              | `--nova-color-border-control` `#736E8B` | WCAG 1.4.11, 3:1                                 |
| Overlay fill          | `.glass-card` 0.62 white             | 0.83                                    | ink-3 at 4.5:1 on a menu over the opaque sidebar |
| Top-bar light end     | `rgba(59,33,120,.72)`                | `.78`                                   | secondary ink at 4.5:1 inside the search field   |
| Top-bar secondary ink | white at .5–.66                      | .88                                     | as above                                         |
| Sidebar secondary ink | `--chrome-ink-2` .66, labels .42–.5  | .70                                     | 4.5:1 under the brand lift for every brand       |
| Hero base             | `--chrome-glass` .6                  | .9                                      | white at 4.5:1 at the sky end                    |
| Hero secondary ink    | white .68                            | .9                                      | 4.5:1 at the sky end                             |
| Top-bar focus ring    | `--chrome-accent` (2.4:1)            | white                                   | 3:1                                              |
| Aurora                | 0.22–0.30 tints                      | 0.10 brand, 0.06 accents                | ink-3 at 4.5:1 on the canvas                     |
| Chart series          | `--c1 … c3` (the good and info hues) | the six-slot data palette               | `palette.spec.ts`: series never read as a status |

## Unchanged rules (enforced by tests)

- Text is at least 4.5:1 and focus rings and control edges at least 3:1, proven for every hospital brand, in both schemes, on every material.
- Status is never colour-only: a word, a glyph or a shape goes with every tone.
- Dense data is never translucent.
- Hospitals cannot override status, AI or chart tokens. They give brand colours and a body font, and the engine derives the rest of their palette from the brand.
- Every interactive element takes its focus ring from `focusRing`; motion is off under `prefers-reduced-motion`.
- Components compose the primitives (`cx`, `focusRing`, `Surface`, `useControllableState`).
