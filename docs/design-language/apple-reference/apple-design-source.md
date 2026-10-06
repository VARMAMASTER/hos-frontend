# Apple DESIGN.md (getdesign.md/apple), condensed for application UI

> Condensed on install (2026-10-06) from the verbatim DESIGN.md the owner provided. Kept: the token tables, principles, typography, elevation, shapes, controls, and Do/Don'ts that apply to application UI. Removed: marketing-site specifics (product tiles, store grids, environment page, footer, page-level breakpoints). The skill's `tokens.md` and `components.md` carry the production values.

## Overview

A photography-first interface that turns marketing into a museum gallery. Light and dark canvases alternate. Headlines use SF Pro Display with negative letter-spacing. A single Action Blue (`#0066cc`) is the only interactive colour. UI chrome recedes so the product can speak: no decorative gradients, no shadows on chrome. The one signature drop-shadow sits under product imagery resting on a surface.

Density is low. Elevation appears only when a product image rests on a surface, as a single soft `rgba(0, 0, 0, 0.22) 3px 5px 30px` drop. Utility surfaces use white cards at 18px radius with a thin border.

## Colours

| Token                    | Hex                         | Role                                        |
| ------------------------ | --------------------------- | ------------------------------------------- |
| primary                  | #0066cc                     | Action Blue: every link, CTA and focus root |
| primary-focus            | #0071e3                     | keyboard focus ring (2px solid)             |
| primary-on-dark          | #2997ff                     | links on dark surfaces                      |
| ink                      | #1d1d1f                     | all text on light surfaces (not pure black) |
| ink-muted-80             | #333333                     | softer body                                 |
| ink-muted-48             | #7a7a7a                     | disabled, fine print                        |
| divider-soft             | #f0f0f0                     | ring-like separator                         |
| hairline                 | #e0e0e0                     | 1px card / chip border                      |
| canvas                   | #ffffff                     | dominant surface                            |
| canvas-parchment         | #f5f5f7                     | signature off-white, alternating surfaces   |
| surface-pearl            | #fafafc                     | secondary button fill                       |
| surface-tile-1/2/3       | #272729 / #2a2a2c / #252527 | dark surfaces                               |
| surface-chip-translucent | #d2d2d7 @ 64%               | circular controls over imagery              |

**No decorative gradients.** Atmospheric depth comes from imagery, not CSS.

## Typography

SF Pro Display (≥ 19px) and SF Pro Text (below). Off-Apple, **Inter** is the closest equivalent; nudge display tracking by -0.01em, and tighten body line-height from 1.47 to about 1.44.

| Token          | Size | Weight | Line height | Tracking |
| -------------- | ---- | ------ | ----------- | -------- |
| hero-display   | 56   | 600    | 1.07        | -0.28px  |
| display-lg     | 40   | 600    | 1.10        | 0        |
| display-md     | 34   | 600    | 1.47        | -0.374px |
| lead           | 28   | 400    | 1.14        | 0.196px  |
| tagline        | 21   | 600    | 1.19        | 0.231px  |
| body-strong    | 17   | 600    | 1.24        | -0.374px |
| body           | 17   | 400    | 1.47        | -0.374px |
| caption        | 14   | 400    | 1.43        | -0.224px |
| caption-strong | 14   | 600    | 1.29        | -0.224px |
| button-utility | 14   | 400    | 1.29        | -0.224px |
| fine-print     | 12   | 400    | 1.0         | -0.12px  |
| micro-legal    | 10   | 400    | 1.3         | -0.08px  |

Principles:

- Negative tracking at display sizes; never at 12px or below.
- Body runs at 17px, not 16.
- The weight ladder is 300 / 400 / 600 / 700, with 300 rare and **500 deliberately absent**. Headlines use 600.
- Line-height is context-specific: tight for display, 1.47 for body.

## Spacing

Base unit 8px: 4, 8, 12, 17, 24, 32, 48, and 80 for sections. Card padding is 24. Button padding is 8–11px vertical and 15–22px horizontal. Touch targets are at least 44 × 44px.

## Elevation and depth

| Level          | Treatment                                                        | Use                                 |
| -------------- | ---------------------------------------------------------------- | ----------------------------------- |
| Flat           | no shadow, no border                                             | sections, nav                       |
| Soft hairline  | 1px `rgba(0,0,0,0.08)`                                           | utility cards, sub-nav separator    |
| Backdrop blur  | `backdrop-filter: saturate(180%) blur(20px)` on parchment at 80% | sticky sub-nav, floating sticky bar |
| Product shadow | `rgba(0,0,0,0.22) 3px 5px 30px`                                  | product imagery only                |

Exactly one drop-shadow, and only for product imagery: never cards, buttons or text. UI elevation comes from surface-colour change and backdrop blur on sticky bars.

## Shapes

| Token | Value | Use                                                          |
| ----- | ----- | ------------------------------------------------------------ |
| none  | 0     | full-bleed tiles                                             |
| xs    | 5     | rare subtle chips                                            |
| sm    | 8     | compact utility buttons, inline imagery                      |
| md    | 11    | pearl capsule buttons                                        |
| lg    | 18    | utility cards                                                |
| pill  | 9999  | primary CTAs, option chips, search: the signature Apple pill |
| full  | 50%   | circular controls                                            |

## Controls

- **Primary button:** Action Blue fill, white 17px/400 text, pill radius, padding 11 × 22. Active is `transform: scale(0.95)`; focus is a 2px solid primary-focus outline.
- **Secondary pill:** transparent fill, primary text, 1px primary border, pill.
- **Dark utility button:** ink fill, white 14px, 8px radius, padding 8 × 15.
- **Pearl capsule:** pearl fill, ink-muted-80 14px, 11px radius, soft ring border.
- **Circular icon button:** 44 × 44, translucent chip grey, full radius.
- **Search input:** white, 17px, 1px `rgba(0,0,0,0.08)` border, pill, 44px tall, padding 12 × 20, muted leading search glyph.
- **Utility card:** white, 1px hairline, 18px radius, 24px padding, no shadow.
- **Option chip:** white, pill, padding 12 × 16. Selected upgrades to a 2px solid primary-focus border.
- **Sticky bars:** parchment at 80% with backdrop blur.

Form validation states were not surfaced in the source pages.

## Do

- One accent (Action Blue) for every interactive element, and nothing else.
- Display headlines at weight 600 with negative tracking. Body at 17/400/1.47.
- Pill radius for anything that reads as an action.
- The press state is `scale(0.95)` on every button.
- Divide by surface change before adding chrome.

## Don't

- No second accent colour.
- No shadows on cards, buttons or text.
- No decorative gradient backgrounds.
- No weight 500.
- Body line-height never below 1.47.
- Don't mix radius grammars: sm for compact utility, lg for cards, pill for actions.
- Don't use primary-on-dark on light surfaces.
