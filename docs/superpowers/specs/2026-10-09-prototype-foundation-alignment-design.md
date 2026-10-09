# Prototype Global Foundation Alignment Design Specification

- **Date:** 2026-10-09
- **Status:** Approved
- **Scope:** Prototype CSS foundation (`os/public/assets/hos.css`), shared shell scripts, and button/AI primitives.

---

## 1. Context & Motivation

The `os/` directory contains the high-fidelity HTML/CSS/JS prototype across 20 clinical and administrative workspaces. While the real production product lives in `hos-frontend` (using the Nova UI design system), the prototype serves as the ground-truth UX/feature specification.

To allow future AI agents and developers to ingest the prototype and build production applications with zero visual or interactive drift, the prototype must reflect the latest Nova UI design decisions:

1. **Typography:** Default body font standardized to **Inter** for clinical clarity.
2. **AI Action Visuals:** Upgraded from flat cyan buttons to glowing neon glass pills with rotating GPU conic sweep borders, ambient aura backlight, and 3-star sparkle clusters.
3. **Universal Loading States:** Every button variant (`.btn-primary`, `.btn-ghost`, `.btn-ai`) must have first-class, motion-safe loading indication with centered spinners and duplicate-click prevention.

---

## 2. Technical Design

### 2.1 Typography & Font Tokens

In `os/public/assets/hos.css`:

- Import **Inter** alongside Google Sans Flex and IBM Plex Mono:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=IBM+Plex+Mono:wght@500;600&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
  ```
- Update root font variables in `:root`:
  ```css
  --f-display: 'Google Sans Flex', system-ui, -apple-system, sans-serif;
  --f-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --f-mono: 'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace;
  ```
- **Rationale:** Inter provides superior tabular and clinical legibility for dense tables, numbers, and record entries. Google Sans Flex is retained for headings, and IBM Plex Mono for figures.

---

### 2.2 Elevated Glowing AI Button (`.btn-ai`)

Upgrade `.btn-ai` in `os/public/assets/hos.css` to match Nova UI's `AiButton`:

1. **Shape & Layout:**
   - `border-radius: var(--r-full);`
   - `display: inline-flex; align-items: center; justify-content: center; gap: var(--space-3);`
   - `position: relative; overflow: visible;`
   - `font-weight: 600; font-size: 13px;`

2. **Background & Atmosphere:**
   - Deep cosmic glass gradient fill:
     ```css
     background: linear-gradient(135deg, rgba(14, 116, 144, 0.35) 0%, rgba(27, 16, 66, 0.92) 55%, rgba(14, 116, 144, 0.4) 100%);
     ```
   - Ambient aura backlight:
     ```css
     box-shadow:
       0 0 16px rgba(34, 211, 238, 0.32),
       0 2px 8px rgba(27, 16, 66, 0.45),
       inset 0 1px 0 rgba(255, 255, 255, 0.25);
     ```

3. **Conic Border Sweep:**
   - Registered CSS property `@property --ai-angle` or animated pseudo-element with rotating border conic gradient:
     ```css
     background: conic-gradient(from var(--ai-angle), #22d3ee, #a78bfa, #60a5fa, #22d3ee);
     ```
   - Falls back gracefully to static crisp borders under `prefers-reduced-motion: reduce`.

4. **Sparkle Cluster Mark:**
   - Replace single flat `✦` with an inline SVG 3-star sparkle cluster or styled pseudo-cluster in `.btn-ai`.

---

### 2.3 Universal Loading States on Buttons

Every button in `hos.css` (`.btn`) supports loading states when `.is-loading` or `[aria-busy="true"]` is present:

1. **Behavior & Accessibility:**
   - `pointer-events: none;`
   - `cursor: progress;`
   - Children concealed with `opacity: 0;` so button geometry and width do not jump.
   - Screen readers announce `aria-busy="true"`.

2. **Spinner Animation:**
   - Centered 14px circular spinner with `currentColor`:
     ```css
     .btn.is-loading::after,
     .btn[aria-busy='true']::after {
       content: '';
       position: absolute;
       inset: 0;
       margin: auto;
       width: 14px;
       height: 14px;
       border: 2px solid currentColor;
       border-top-color: transparent;
       border-radius: 50%;
       animation: btn-spin 0.75s linear infinite;
     }
     @keyframes btn-spin {
       to {
         transform: rotate(360deg);
       }
     }
     ```
   - Under `prefers-reduced-motion: reduce`, the spinner opacity pulses gently rather than spinning rapidly.

---

### 2.4 AI Badges & Spark Accents

- Add `.badge-ai.glow` and elevate `.ai-spark` to use the cyan-bright neon rim (`border-color: rgba(34,211,238,0.5)`) and subtle box-shadow glow (`0 0 10px rgba(34,211,238,0.3)`).

---

## 3. Compatibility & Verification

1. **Zero HTML breakage:** All existing class names (`.btn`, `.btn-primary`, `.btn-ghost`, `.btn-ai`, `.card`, `.badge`) remain 100% supported.
2. **Visual Verification:** Check `00-screens.html`, `02-reception.html`, `03-doctor.html`, and `10-ai-workforce.html` in browser.
3. **Automated Verification:** Run `node tools/ui-check.mjs` in `os/` if available, and ensure no CSS syntax errors.
