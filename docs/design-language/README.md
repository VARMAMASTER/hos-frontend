# Nova design language: the HOS prototype

Nova is the HOS prototype, built as a React library. **`os/public/assets/hos.css` ("HOS Design System v3") is binding**: its `:root` tokens, its shapes and its sizes. The prototype pages in `os/public/*.html` and the screenshots in `os/public/assets/shots/` show how they are used. Where this file and the prototype disagree, the prototype wins; where the prototype and an accessibility proof disagree, the proof wins and the value is listed under [Held by a proof](#held-by-a-proof).

The Apple adaptation that used to live here is superseded (owner decision, 2026-10-06). `apple-reference/` is kept only as history.

## How the prototype maps onto Nova

Nova's semantic names stay the API (`--nova-color-primary`, `bg-surface`, `text-ink-2`); every **value** is the prototype's. `tokens/semantic.ts` (`NOVA_DEFAULTS`) and `styles/theme.css` hold the same values, and `semantic.spec.ts` compares them token by token with `hos.css`.

| Prototype                                                                                                                                                   | Nova token                                           | Tailwind                                                 | Value                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--bg`                                                                                                                                                      | `--nova-color-bg`                                    | `bg-bg`                                                  | `#F0EFF9`                                                                                                                |
| `--panel`                                                                                                                                                   | `--nova-color-surface`                               | `bg-surface`                                             | `#FFFFFF`                                                                                                                |
| `--panel-2`                                                                                                                                                 | `--nova-color-surface-2`                             | `bg-surface-2`                                           | `#F8F7FD`                                                                                                                |
| `--line`                                                                                                                                                    | `--nova-color-border`                                | `border-border`                                          | `#E4E1F2`                                                                                                                |
| `--line-strong`                                                                                                                                             | `--nova-color-border-strong`                         | `border-border-strong`                                   | `#CFC9E6`                                                                                                                |
| `--ink`, `--ink-2`                                                                                                                                          | `--nova-color-ink`, `-ink-2`                         | `text-ink`, `text-ink-2`                                 | `#1A1730`, `#5B5775`                                                                                                     |
| `--ink-3`                                                                                                                                                   | `--nova-color-ink-3`                                 | `text-ink-3`                                             | `#5D5974` (held, see below)                                                                                              |
| `--teal`, `--teal-strong`, `--teal-soft`, `--teal-ghost`                                                                                                    | `--nova-color-primary`, `-strong`, `-soft`, `-ghost` | `bg-primary` …                                           | `#6D4FE0`, `#5636B8`, `#EFEAFC`, `#F8F5FE`                                                                               |
| `--ai`, `--ai-bright`, `--ai-deep`, `--ai-soft`, `--ai-ghost`, `--ai-line`                                                                                  | `--nova-color-ai*` (brand-derived)                   | `bg-ai` …                                                | `#0E7490`, `#22D3EE`, `#0B5567`, `#DDF4FA`, `#F6FDFF`, `#B9E6F2`                                                         |
| `--good`, `--warn`, `--crit`, `--info` with `-soft` and `-deep`                                                                                             | `--nova-color-good*` …                               | `bg-good-soft text-good-deep` …                          | unchanged                                                                                                                |
| `--chrome-1`, `-2`, `-3`, `--chrome-glass`, `--chrome-line`, `--chrome-ink`, `--chrome-ink-2`, `--chrome-accent`, `--chrome-accent-soft`, `--chrome-glow-2` | `--nova-color-chrome-*`                              | `bg-chrome-1`, `border-chrome-line`, `text-chrome-ink` … | verbatim                                                                                                                 |
| `.tb-dot` ring `#221448`                                                                                                                                    | `--nova-color-chrome-ring`                           | `border-chrome-ring`                                     | `#221448`                                                                                                                |
| `--ai-grad`                                                                                                                                                 | `--nova-gradient-ai`                                 | `nova-ai-grad`                                           | AI bright → AI → the brand, as the prototype's `var(--teal)` (follows the hospital theme)                                |
| `--ai-mark`                                                                                                                                                 | not carried                                          | not carried                                              | the four-hue conic spark is replaced by the one AI mark, the Care spark (`AiMark`); its tile is painted with `--ai-grad` |
| `--f-display`, `--f-body`, `--f-mono`                                                                                                                       | `--nova-font-display`, `-body`, `-mono`              | `font-display`, `font-sans`, `font-mono`                 | Google Sans Flex; IBM Plex Mono                                                                                          |
| `--sidebar-w`                                                                                                                                               | `--nova-sidebar-w`                                   | `w-sidebar`                                              | `248px`                                                                                                                  |

Fonts load from the prototype's own Google Fonts URL (`family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=IBM+Plex+Mono:wght@500;600`) in `apps/web/index.html` and Storybook's `preview-head.html` and `manager-head.html`. The body is the prototype's: `text-body` (14px) on the 1.55 body line (`--nova-leading-body`) with optical sizing (`theme.css`, `@layer base`). Every type role carries that line height, so text reads at the prototype's inherited line wherever a component sets a role.

## Design tokens

The owner's rule (2026-10-06): every component uses tokens only. Padding, spacing, radius, type and motion are named tokens, so changing a token restyles every place that uses it. A component never writes a number.

The layers:

1. **The scales**: the prototype's own values (`--nova-space-*`, `--nova-radius-sm … xl`, the type sizes, `--nova-shadow-*`, the motion tokens).
2. **The roles and component tokens**: what a value is for (`--nova-text-label`, `--nova-radius-control`, `--nova-control-px-md`). Each points at a step of a scale wherever the prototype's value is on one, so editing the scale moves them too.
3. **The utilities**: the Tailwind names a component writes (`text-label`, `rounded-control`, `px-control-md`).

The values live in `styles/theme.css`: the plain `:root` block holds the prototype defaults (`tokens/semantic.ts`) and the "Design tokens" `:root` block holds everything else (`tokens/design.ts`, with `TYPE_ROLES`, `LEADING`, `TRACKING_EM` and `RADIUS_ROLES` in `tokens/scale.ts`). `semantic.spec.ts` and `design.spec.ts` compare the CSS with the TypeScript.

Tailwind's own scales are removed, as the palette always was: numeric spacing and size steps (`p-4`, `w-64`), the radius names, type sizes, line heights, tracking, container widths and easings. None of them compiles: `p-4`, `rounded-md`, `text-sm`, `tracking-wider` and `ease-out` produce no CSS at all (`conventions.spec.ts` compiles `theme.css` and checks).

### The spacing scale

`p-`, `m-`, `gap-`, `space-x-`, `w-`, `h-`, `size-`, `inset-`, `top-` and `translate-` all take these names. They are the prototype's own step numbers, so a name can never be read as one of Tailwind's 4px steps: `p-4` does not exist, and `p-s4` is 10px.

| Name  | Prototype    | Value |
| ----- | ------------ | ----- |
| `s0`  | `--space-0`  | 2px   |
| `s1`  | `--space-1`  | 4px   |
| `s2`  | `--space-2`  | 6px   |
| `s3`  | `--space-3`  | 8px   |
| `s4`  | `--space-4`  | 10px  |
| `s5`  | `--space-5`  | 12px  |
| `s6`  | `--space-6`  | 16px  |
| `s7`  | `--space-7`  | 20px  |
| `s8`  | `--space-8`  | 24px  |
| `s9`  | `--space-9`  | 32px  |
| `s10` | `--space-10` | 48px  |

`0` is zero, `px` is the 1px hairline and `auto` is auto. `full`, `screen`, fractions (`w-1/2`) and intrinsic keywords (`min-w-0`, `w-fit`) are not values and stay.

### Type roles

Each role is a size and its line height (`--nova-text-<role>`, `--nova-text-<role>-leading`, the body's 1.55 by default), written `text-<role>`.

| Utility         | Size   | Where `hos.css` uses it                                     |
| --------------- | ------ | ----------------------------------------------------------- |
| `text-micro`    | 9.5px  | `.wa-time`, `.ws-group`, `.sb-aside-l`, the `.tb-dot` count |
| `text-badge`    | 10px   | `.tab-badge` and the nav count pill, the `.ic` monogram     |
| `text-overline` | 10.5px | `.nav-label`, `.sf-role`, `.sb-aside-n`, `.tag-offline`     |
| `text-meta`     | 11px   | `.feed-t`, `.tl-date`, `thead th`, `.brand-sub`             |
| `text-caption`  | 11.5px | `.chip`, `.kpi-d`, `.ai-src`, `.role-badge`                 |
| `text-label`    | 12px   | `label.f-label`, `.kpi-l`, `.tiny`, `.legend`, `.btn-sm`    |
| `text-body-sm`  | 12.5px | `.wa-msg`, `.sf-name`, sub-tabs, `.chart .dl`               |
| `text-control`  | 13px   | `.btn`, `.tab`, table cells, `.feed-item`: dense UI text    |
| `text-input`    | 13.5px | `.f-input`, `.nav a`, `.ai-block-h b`                       |
| `text-body`     | 14px   | the body, `h3`                                              |
| `text-lead`     | 15px   | `.ws-chev`                                                  |
| `text-subtitle` | 16px   | `.brand-name`                                               |
| `text-title`    | 17px   | `h2`                                                        |
| `text-headline` | 20px   | `.token .t-no`                                              |
| `text-display`  | 23px   | `h1`                                                        |
| `text-kpi`      | 26px   | `.kpi-v`                                                    |

Line heights: `leading-none` 1, `leading-tight` 1.3, `leading-snug` 1.4, `leading-normal` 1.45, `leading-body` 1.55, `leading-relaxed` 1.62.

Letter-spacing is its own token, because the same size is set with and without it: `tracking-h1` -0.015em, `tracking-h2` -0.01em, `tracking-h3` -0.005em, `tracking-normal` 0, `tracking-initials` 0.01em (avatar and `.ic` initials), `tracking-label` 0.04em (`.tl-date`), `tracking-caps` 0.06em (`thead th`), `tracking-eyebrow` 0.08em (`.nav-label`) and `tracking-group` 0.09em (`.ws-group`). A heading is its role, its weight and its tracking: `text-title font-semibold tracking-h2`.

### Radius roles

A component names what the corner belongs to, never a step of the scale (which lives only in the token layer).

| Utility           | Token                   | Value          | For                                              |
| ----------------- | ----------------------- | -------------- | ------------------------------------------------ |
| `rounded-control` | `--nova-radius-control` | `--r-sm`, 8px  | buttons that are not pills, fields, menu items   |
| `rounded-card`    | `--nova-radius-card`    | `--r-md`, 12px | cards, tiles, chart panels, the tab rail, toasts |
| `rounded-overlay` | `--nova-radius-overlay` | `--r-lg`, 18px | menus, popovers, dialogs, the copilot panel      |
| `rounded-hero`    | `--nova-radius-hero`    | `--r-xl`, 22px | the hero band and large glass panels             |
| `rounded-chip`    | `--nova-radius-chip`    | `--r-full`     | a chip                                           |
| `rounded-tag`     | `--nova-radius-tag`     | `--r-sm`       | a tag                                            |
| `rounded-pill`    | `--nova-radius-pill`    | `--r-full`     | anything drawn as a pill on purpose              |
| `rounded-full`    | `--nova-radius-full`    | 999px          | a true circle (a dot, an avatar)                 |
| `rounded-none`    |                         | 0              | a square corner                                  |

Per-side and per-corner forms take the same names (`rounded-t-card`). `Surface` takes the roles too, and `none` for a square frame (the sidebar, the top bar): `radius="none" | "control" | "card" | "overlay" | "hero" | "chip" | "tag" | "pill"`, `overlay` by default.

### Component dimensions

Components that should match share one token.

| Utilities                                                        | Token                                                       | Value                                            |
| ---------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| `h-control-md`, `min-h-control-md`                               | `--nova-control-h-md`                                       | padding + `text-control` line + border, 38.15px  |
| `h-control-sm`, `min-h-control-sm`                               | `--nova-control-h-sm`                                       | padding + `text-label` line + border, 32.6px     |
| `px-control-md`, `py-control-md`                                 | `--nova-control-px-md`, `--nova-control-py-md`              | `s6` by `s3` (16 by 8, `.btn`)                   |
| `px-control-sm`, `py-control-sm`                                 | `--nova-control-px-sm`, `--nova-control-py-sm`              | `s4` by `s2` (10 by 6, `.btn-sm`)                |
| `gap-control`                                                    | `--nova-control-gap`                                        | `s3`                                             |
| `px-field` (`pl-`, `pr-`), `left-field`, `right-field`           | `--nova-field-px`                                           | `s4` (`.f-input`)                                |
| `pl-field-icon`, `pr-field-icon`                                 | `--nova-field-icon-inset`                                   | field inset + `icon-md` + `s2`                   |
| `p-card` (`px-`, `py-`, `pt-` …), `gap-card`                     | `--nova-card-p`, `--nova-card-gap`                          | `s6`, `s5` (`.card-b`, `.card-h`)                |
| `py-card-bar`                                                    | `--nova-card-bar-py`                                        | `s5` (a card's header and footer rows)           |
| `p-overlay`, `px-overlay`, `py-overlay`, `py-overlay-bar`        | `--nova-overlay-px`, `-py`, `-bar-py`                       | `s7`, `s6`, `s5` (a dialog)                      |
| `px-chip`, `py-chip`, `gap-chip`                                 | `--nova-chip-px`, `-py`, `-gap`                             | `s3`, `s0`, `s2` (`.chip`)                       |
| `px-tag`, `py-tag`                                               | `--nova-tag-px`, `-py`                                      | `s3`, `s0`                                       |
| `px-badge`, `py-badge`                                           | `--nova-badge-px`, `-py`                                    | `s2`, the hairline (a count pill)                |
| `px-row`, `py-row-comfortable`, `py-row-compact`                 | `--nova-row-px`, `-py-comfortable`, `-py-compact`           | `s6`, `s4`, `s2` (table, list, menu rows)        |
| `min-h-touch`, `min-w-touch`, `h-touch`, `w-touch`, `size-touch` | `--nova-touch`                                              | 44px                                             |
| `size-touch-sm`                                                  | `--nova-touch-sm`                                           | `s8`, 24px (WCAG 2.5.8)                          |
| `size-icon-xs`, `-sm`, `-tile`, `-md`, `-lg`                     | `--nova-icon-*`                                             | 12, 14, 15 (`.ic svg`), 16, 20px                 |
| `size-dot-sm`, `size-dot`, `size-mark`, `size-tile`              | `--nova-dot-sm`, `--nova-dot`, `--nova-mark`, `--nova-tile` | 5, 7 (`.dot`), 22 (`.ai-spark`), 24px (`.ic`)    |
| `size-spinner`                                                   | `--nova-spinner`                                            | 1.1em                                            |
| `w-sidebar`, `w-rail`                                            | `--nova-sidebar-w`, `--nova-sidebar-rail-w`                 | 248px, 68px                                      |
| `max-w-xs` … `max-w-6xl`                                         | `--nova-measure-*`                                          | 20 … 72rem: how wide a block may grow            |
| `size-check`                                                     | `--nova-check`                                              | `s7`, 20px: Checkbox, Radio, DataTable's row box |
| `size-close`                                                     | `--nova-close-size`                                         | 30px (`.hos-x`): Dialog and Toast close          |
| `size-topbar-ico`                                                | `--nova-topbar-ico`                                         | 34px (`.tb-ico`): NotificationBell, TopBar menu  |
| `p-menu-item`, `gap-menu-item`                                   | `--nova-menu-item-p`, `--nova-menu-item-gap`                | `s3`, `s3` (`.ws-item`, `primitives/menu-item`)  |
| `min-w-column`                                                   | `--nova-column-min-w`                                       | 12rem: a column or filter's least width          |

A value two or more component families share is one of these shared tokens; a value only one component needs is in its family's "Component tokens" section of `theme.css`. `md:` is Nova's own `--breakpoint-md` (48rem), which `tokens/design.ts` `BREAKPOINT_REM` mirrors for a script media query.

Edges: `border` is the 1px hairline; `border-emphasis` (2px, a selected edge) and `border-rail` (3px, an accent rail) take side forms (`border-l-rail`); `ring-hairline` and `ring-emphasis`; the focus ring is `outline-focus outline-offset-focus` (inside `focusRing`); links take `underline-offset-tight` or `-loose`.

### Motion roles

Transitions use only the motion roles: `duration-fast | base | slow` and `ease-spring | standard | emphasized` (see [Motion](#motion)). A transition that names no duration or curve takes `duration-fast` on `ease-standard`. Stock easings (`ease-out`) and numeric durations (`duration-150`) are refused.

### Weights and shadows

Weights are the prototype's 400, 500, 600 and 700: `font-normal`, `font-medium`, `font-semibold`, `font-bold`. Shadows are the prototype's `--shadow-sm`, `-md`, `-lg` and `-glass` on the hue `262deg 45% 27%`, as `shadow-sm`, `shadow-md`, `shadow-lg` and `shadow-glass` (or through a surface's lift token); `shadow-none` turns one off.

### How to add a value

1. If the value is a step of a scale, use the scale's name (`gap-s3`, `text-label`, `rounded-card`).
2. If it is what a role or a kind of component needs (every chip's padding, every row's height), use its component token, or add one: a `--nova-*` token in `tokens/design.ts` and the "Design tokens" `:root` block of `theme.css` (pointing at a scale token where the prototype's value is on one), and its utility in the "Design tokens: the Tailwind names" block (a theme key such as `--padding-card`, or an `@utility` when x and y differ, such as `px-control-md`).
3. If only one component needs it (an orb's size, a phone frame's width), it is still a token: add it in that component family's marked "Component tokens" section of `theme.css` and reference it as a utility or as a token reference (`w-(--nova-phone-w)`).
4. Never a literal in a component: no `p-4`, `text-[12px]`, `h-[5px]`, `rounded-md`, `duration-150` or `style={{ width: 54 }}`.

`primitives/conventions.spec.ts` refuses everything else, with one planted violation per rule: numeric steps, names the token layer does not define (each class is compiled against `theme.css`), stock easings, arbitrary values (except a token reference such as `w-[var(--nova-sidebar-rail-w)]`, a transition's property list, generated content and an `fr` grid template), raw `px`/`rem`/`em` literals outside a class, bare numbers on length properties in a `style` object, and scale-named `Surface` radii. `primitives/token-reach.spec.tsx` proves the reach: it overrides the scale, a component token, the radius scale and the type roles, and Button, TextField, Card and Chip follow.

The guard is absolute: every component, story and primitive file, and the Storybook preview, must be clean. There is no baseline of exceptions.

Corners are plain `border-radius`: the prototype has no `corner-shape`. Where the prototype writes a literal radius off its own scale (`.btn` 9px, `.tab` 10px, `.tabbar` 14px, `.ic` 7px, `.brand-mark` 11px), Nova uses the nearest step's role.

## Surfaces and gradients

Each prototype surface is one utility in `theme.css`, reached through `Surface` (`material=`):

| Role       | Utility         | Prototype                                                                                              |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `card`     | `nova-card`     | `.card`: panel, `--line` edge, `--shadow-sm`, the card corner                                          |
| `data`     | `nova-data`     | `.card` plus `.edge-premium`, the 1px violet-to-cyan gradient edge (KPI tiles swap in the `.kpi` edge) |
| `surface`  | `nova-surface`  | `.glass-panel` on glass, heavier on frost, the card on solid                                           |
| `overlay`  | `nova-overlay`  | `.glass-card` (menus, dialogs, tooltips)                                                               |
| `field`    | `nova-field`    | `.f-input`: opaque panel, the proven control edge                                                      |
| `chrome`   | `nova-chrome`   | `.topbar`: the indigo gradient with grain, frosted                                                     |
| `sidebar`  | `nova-sidebar`  | `.sidebar`: deepening gradient, the brand lift, grain; never frosted                                   |
| `hero`     | `nova-hero`     | `.glass-hero`: violet to sky over the chrome glass, `--shadow-glass`                                   |
| `ai-block` | `nova-ai-block` | `.ai-block`: AI wash, AI line, the 3px gradient rail; green once approved                              |

Smaller utilities: `nova-card-head` (`.card-h` tint), `nova-tabbar` (`.tabbar`), `nova-ai-spark` (`.ai-spark`, the AI tile, only through `<AiMark tile />`), `nova-ai-rail`, `nova-ai-grad`, `nova-bar-grad` (`.sb-bar`), `nova-gradient-text`, `nova-canvas` (the aurora).

Gradients are back exactly where the prototype draws them: the AI rail on AI blocks, the gradient edge on data surfaces, the chrome and hero gradients, the AI gradient and mark. A component never writes one of its own; it uses these utilities or tokens.

## Highlight

The owner asked for the highlighted colours, and their gradients, "in some places". The highlight is a second accent beside the brand, used deliberately. For HOS Violet it is the prototype's own sky, `--chrome-glow-2` (`#60A5FA`): the far stop of every prototype brand gradient (the hero, the `.sb-bar` fill, the aurora). On the chrome the highlight pair stays `--chrome-accent` into `--chrome-glow-2`, as the prototype draws it.

| Token                          | Light (HOS Violet) | Dark      | Role                                                                |
| ------------------------------ | ------------------ | --------- | ------------------------------------------------------------------- |
| `--nova-color-highlight`       | `#3276C8`          | `#60A5FA` | the mark: a fill, an underline, an edge, a rail, a ring; never text |
| `--nova-color-highlight-soft`  | `#E1EEFF`          | `#122946` | the tint under highlight text                                       |
| `--nova-color-highlight-deep`  | `#004F9C`          | `#7AB1F5` | highlight text, 4.5:1 on its tint, the wash and a panel             |
| `--nova-color-highlight-hover` | `#004F9C`          | `#8CBFFF` | a hovered highlight edge, one step further from the ground          |

**Built, not picked.** Each member is the sky's hue and chroma pinned to the luminance of its twin in the brand family, so the highlight passes the brand's own proofs. In the dark it is `#60A5FA` itself. In the light it is held at `#3276C8`, the lightest sky that still holds 3:1 as a mark on every light ground: the prototype's sky is 2.5:1 on white. A hospital's highlight is HOS Violet's moved to its hue like every other brand colour, so it keeps the violet-to-sky step from its own brand. The chrome's sky glow (`--nova-color-chrome-glow-2`) follows the brand too, kept no lighter over the hero base than the prototype's, so the hero's text proof holds.

**Gradients**, each declared on every theme and material scope and built only from the brand and highlight tokens:

| Utility               | Token                            | Use                                                                                                               |
| --------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `nova-highlight-grad` | `--nova-gradient-highlight`      | brand into highlight, 90deg: a gauge fill, the active tab's underline, a sort marker                              |
| `nova-highlight-rail` | `--nova-gradient-highlight-rail` | the 3px rail down a selected row's first cell                                                                     |
| `nova-highlight-edge` | `--nova-gradient-highlight-edge` | the 1px hairline of an emphasised card or a chosen option (a data surface swaps it in through `--nova-data-edge`) |
| `nova-highlight-ring` | `--nova-gradient-highlight-edge` | a 2px ring a hair outside an avatar                                                                               |
| `nova-highlight-wash` | `--nova-gradient-highlight-wash` | the brand's tint into the highlight's, under highlight text                                                       |
| `nova-highlight-text` | `--nova-gradient-highlight`      | gradient text for large display figures only; the deep ink unclipped                                              |

The Tailwind colours are `bg-|border-|text-highlight`, `-soft`, `-deep` and `-hover`.

**Where it is used (modest and deliberate).** No gradient on an ordinary button: `.btn-primary` stays solid.

- `StatGauge` fills brand into highlight, the `.sb-bar` fill extended to a panel.
- The active `Tab` is underlined in the gradient.
- `KpiTile highlight`: the highlight edge in place of the KPI edge, and the figure in gradient text.
- `Chip tone="highlight"`, `Tag tone="highlight"` and `Banner tone="highlight"` (an announcement, "New in this release", announced as a status): the wash, the deep ink and a five-pointed star. The star is deliberately not the AI's four-pointed spark.
- `ChoiceCard`: the chosen tint carries a highlight ring inside the primary edge. `ButtonGroup`: the selected segment (or its sliding indicator) carries the highlight edge, and an unselected segment hovers to `highlight-hover`.
- `DataTable`: the highlight rail on a selected row, and a highlight underline with a deep-ink arrow on the sorted column.
- `Timeline` items take `milestone`: a highlight node with the star and the word "Milestone".
- `Avatar highlight`: the ring, with `highlightLabel` to say what it means.
- `HeroBand`: its glow stop is the brand's highlight on the chrome.

**Proven like the brand.** `theme/legibility.ts` gates every brand, in both schemes, on every material: the highlight and its hover as 3:1 marks on every ground; the deep ink at 4.5:1 on its tint, across the wash and on the panels; and the gradient figure at 3:1 as large text, point by point along the gradient. `tokens/material.spec.ts` adds the every-brand bounds. The highlight is never colour-only: a star, a word, a shape or an ARIA state says the same. `conventions.spec.ts` lets a component reach the highlight only through these utilities and colours: no raw `--nova-*-highlight*` variable, no opacity, no text in the bare highlight, no new `nova-highlight-*` utility.

Storybook: `Design language/Highlights` shows every use (switch the toolbar), and its "Every preset, light and dark" story shows each preset in both schemes at once.

## Three independent axes

A screen is the product of three settings, each switchable anywhere in the tree and each independent of the other two:

| Axis           | Values                                     | Set by                                                                                |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| Hospital theme | HOS Violet (default) or a hospital's brand | `createNovaTheme`, then `NovaThemeProvider theme` or `applyNovaTheme`                 |
| Material       | `glass` (default), `frost`, `solid`        | `data-nova-material`, `NovaThemeProvider material`, `applyNovaMaterial`, or the theme |
| Scheme         | `light` (default), `dark`, `system`        | `data-nova-scheme`, `NovaThemeProvider scheme`, `applyNovaScheme`                     |

Storybook has a toolbar switch for each (Hospital theme, Material, Scheme). `Themes/Preview` shows the sidebar, top bar, hero, canvas, cards, a table and an AI block on one page; `Themes/Side by side` shows every preset at once, in both schemes.

## The AI mark

Owner decision, 2026-10-10: Nova has one AI mark, the **Care spark**, and no other. It is a four-point spark with a small medical cross cut out of its heart and one twinkle at the lower right (`AiMark`, `src/primitives/ai-mark.tsx`). At 12px the cross drops away and it reads as an AI spark; from about 22px up the care cross shows.

**One glyph, bare or in the tile, always with a text label.** It has exactly two presentations:

- **Bare:** `<AiMark size="xs|sm|md|lg" />`, inline, in the colour of its text (`currentColor`).
- **Tile:** `<AiMark tile />`, the same glyph in white inside the 22px AI tile (the prototype's `.ai-spark`), painted with the HOS AI gradient (`--nova-gradient-ai`, cyan into the brand), so it follows each hospital's theme. Inside an approved AI block the tile settles to green. The AI Panel's check and a money gate's ₹ are passed as the tile's `symbol`.

The mark is decoration (`aria-hidden`): the text label beside it is what assistive technology and greyscale readers get, so an AI element is never marked by colour or by an icon alone. Nobody writes a literal glyph (`✦ ✧ ★ ☆ ✨ ⭐`), draws an svg spark of their own, or writes `nova-ai-spark` by hand; `src/primitives/ai-mark-guard.spec.ts` fails the build for any of them, in Nova and in `apps/web/src` (data files included, since a string in data ends up on screen). The prototype's multicolour `--ai-mark` (red, blue, green and yellow) is not carried, and neither are its four tints. The white glyph on the tile is proven at 3:1 against every stop of the AI gradient for every brand and scheme (`theme/legibility.ts`, "the AI tile glyph"), with a tight dark halo on the glyph (`--nova-ai-spark-glyph-shadow`) for the pale bright stop. `SparkleCluster` is a deprecated alias of `AiMark`. The showcase is "Design language / The AI mark" in Storybook.

## AI follows the hospital theme

Owner decision, 2026-10-07: the AI panel's colours change with the hospital theme. This reverses the earlier rule that AI was a fixed cyan.

**What follows the brand.**

- The AI family (`--nova-color-ai`, `-ai-deep`, `-ai-soft`, `-ai-ghost`, `-ai-line`, `-ai-hover`, light and dark).
- The single-value `--nova-color-ai-bright`.

The AI gradient (`nova-ai-grad`), the AI block's rail (`nova-ai-rail`, `nova-ai-block`), the AI tile and the orb are built from these tokens and the brand, as the prototype's `--ai-grad` and rail are (they end in `var(--teal)`). They are declared on every theme scope, so the AI panel, the AI badge, the AI chip, the approve button, the AI node and the AI tints all follow through tokens. No component changed.

**HOS Violet is the prototype exactly:** `#0E7490`, `#22D3EE`, `#0B5567`, `#DDF4FA`, `#F6FDFF`, `#B9E6F2`. `semantic.spec.ts` still matches `hos.css`, and the AI gradient now matches the prototype verbatim.

**How the AI hue is chosen** (`theme/derive.ts`, `chooseAiHue`):

1. Keep the prototype's cyan while its colours keep every floor below in both schemes.
2. Otherwise take the hue that keeps the most distance from the brand and the four status fills: the largest smallest hue distance, nearest the cyan on a tie.
3. Every AI colour is HOS Violet's turned to that hue and pinned back to its own luminance. Every AI contrast therefore holds: AI text on its soft and ghost tints, white on the AI fill and its hover, and the AI mark at 3:1 on a panel. `theme/legibility.ts` gates all of these for every brand.

**Separation floors** (`AI_SEPARATION`). Each is measured between the AI fill and the other colour, in each scheme. Hues are on the OKLCH circle; colour distance is OKLab × 100.

| From                                                                | Hue                                             | Colour distance                     | The prototype's own                              |
| ------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------- | ------------------------------------------------ |
| each status fill (good 167.5°, warn 49.0°, crit 28.7°, info 253.7°) | ≥ 28°                                           | ≥ 6                                 | 30.6° light, 29.8° dark, and 7.1 / 6.5 from info |
| the brand primary                                                   | ≥ 45° (skipped for a grey brand, chroma < 0.03) | ≥ 6                                 | 63.6°, 18.8                                      |
| each chart series                                                   | —                                               | ≥ 10 (the chart palette's own rule) | 11.2 light, 14.1 dark                            |

A brand no AI hue can serve is rejected by `createNovaTheme` with the pair and the floor, as the contrast gates reject a brand.

**What the presets get:**

| Preset        | AI hue            | AI fill (light / dark) |
| ------------- | ----------------- | ---------------------- |
| HOS Violet    | 223.1° (the cyan) | `#0E7490` / `#1F7D9A`  |
| Rose          | 223.1° (the cyan) | `#0E7490` / `#1F7D9A`  |
| Teal Care     | 296°              | `#72619E` / `#7B6AA7`  |
| Clinical Blue | 210.5°            | `#007685` / `#077F90`  |
| Slate         | 210.5°            | `#007685` / `#077F90`  |

`theme/ai.spec.ts` proves the floors and the AI contrast gates for every preset and 240 brands round the hue circle (grey to vivid), in light and dark, on glass, frost and solid. `legibility.spec.ts`'s 480-brand sweep accepts every brand.

## Hospital themes

A hospital gives three brand colours (`primary`, `primaryStrong`, `primarySoft`) and optionally a body font. The engine (`theme/derive.ts`) derives the whole brand-dependent palette from them, light and dark:

- the chrome gradient stops (`--nova-color-chrome-1|2|3`), the sidebar base and lift (`--nova-color-sidebar-1|2|3`, `--nova-color-sidebar-lift`), so the top bar, the sidebar and the hero follow the brand;
- the canvas (`--nova-color-bg`) and its aurora, the panels, the lines (`border`, `border-strong`, `border-control`) and the inks (`ink`, `ink-2`, `ink-3`), each tinted to the brand's hue;
- the chrome accent (the nav-active fill and the sidebar focus ring), the brand edges and bars, `primary-ghost` and `primary-hover`.

**How:** each of HOS Violet's colours is rotated to the brand's hue in OKLCH, its chroma scaled by how colourful the brand is, and pinned back to the WCAG luminance it had. Contrast is a function of luminance alone, so every ratio the prototype was proven at survives the move. The top bar's light end and the hero base are also kept no lighter over white than the violet ones, because glass blends in sRGB, not in luminance.

**HOS Violet is the prototype, exactly.** Its derived palette is `hos.css`, value for value, and `semantic.spec.ts` still compares every token with `os/public/assets/hos.css`.

**Never tenant-overridable:** status and the chart palette. The AI family is derived from the brand (see "AI follows the hospital theme"), never set by a hospital. A theme writes only the derived palette and the body font. `NovaThemeProvider` and `applyNovaTheme` rebuild that palette from the brand colours alone, so a stored row cannot set an ink, a canvas or a chrome colour of its own.

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

Components apply them under `motion-safe`, so `prefers-reduced-motion` still turns motion off. They are the only durations and curves a component may use: `conventions.spec.ts` refuses `duration-150`, `ease-out` and the other stock values, and a transition with none named takes `duration-fast` on `ease-standard`.

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
| Highlight (light)     | `--chrome-glow-2` `#60A5FA` (2.5:1)  | `#3276C8`                               | 3:1 as a mark on every light ground              |
| Selected tab label    | `--chrome-1`                         | `ink`                                   | chrome-1 stays dark on a dark panel              |

## Unchanged rules (enforced by tests)

- Text is at least 4.5:1 and focus rings and control edges at least 3:1, proven for every hospital brand, in both schemes, on every material.
- Status is never colour-only: a word, a glyph or a shape goes with every tone.
- Dense data is never translucent.
- Hospitals cannot override status or chart tokens. They give brand colours and a body font, and the engine derives the rest of their palette, the AI family included, from the brand.
- AI is never colour-only and never mistaken for the brand or a status: the AI mark (`AiMark`) and a text label always go with it, and its colours keep the separation floors below for every brand.
- Every interactive element takes its focus ring from `focusRing`; motion is off under `prefers-reduced-motion`.
- Components compose the primitives (`cx`, `focusRing`, `Surface`, `useControllableState`).
- Tokens only: a component names a token's utility for every design value (spacing, size, type, radius, edges, motion), never a number or an arbitrary value. See [Design tokens](#design-tokens).
