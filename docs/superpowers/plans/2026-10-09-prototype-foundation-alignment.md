# Prototype Global Foundation Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the HOS prototype global stylesheet (`os/public/assets/hos.css`) to align with Nova UI's typography (Inter), futuristic glowing neon AI pill buttons, and universal button loading states.

**Architecture:** Update `:root` tokens and utility rules in `os/public/assets/hos.css` so all 20 prototype workspaces automatically inherit the modern Nova UI visual language without modifying individual HTML screen structures or breaking interactive simulations in `hos-sim.js`.

**Tech Stack:** Vanilla CSS3, CSS Custom Properties, CSS Keyframe Animations, `@property`, Node.js verification scripts.

## Global Constraints

- Preserve zero-token-drift policy in `os/tools/token-sweep.mjs` (0 raw literals duplicating defined tokens).
- Maintain 100% pass rate in `os/tools/adr7-sweep.mjs` and `os/tools/facts-sweep.mjs`.
- Full backward compatibility: all existing `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-ai`, and `.card` classes must continue to work seamlessly.
- Motion safety: all animations must respect `prefers-reduced-motion: reduce`.

---

### Task 1: Typography & Font Stack Alignment in `hos.css`

**Files:**

- Modify: `os/public/assets/hos.css:1-25` and `os/public/assets/hos.css:190-205`
- Test: `os/tools/token-sweep.mjs`

- [x] **Step 1: Update font import and root font variables**

In `os/public/assets/hos.css`:

1. Add Google Fonts `@import` for Inter at the top of the file:

```css
@import url('https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=IBM+Plex+Mono:wght@500;600&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
```

2. Update font tokens in `:root`:

```css
--f-display: 'Google Sans Flex', system-ui, -apple-system, sans-serif;
--f-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--f-mono: 'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace;
```

- [x] **Step 2: Run verification script**

Run: `node tools/token-sweep.mjs` in `os/`
Expected: PASS with 0 raw literals.

- [x] **Step 3: Commit Task 1**

Run:

```bash
git add public/assets/hos.css
git commit -m "feat(tokens): align font stack with Inter body typography"
```

---

### Task 2: Elevated Glowing AI Button (`.btn-ai`) in `hos.css`

**Files:**

- Modify: `os/public/assets/hos.css:774-810`
- Test: `os/tools/token-sweep.mjs`

- [x] **Step 1: Implement `.btn-ai` glowing neon pill and conic sweep border**

In `os/public/assets/hos.css`, replace the flat `.btn-ai` rule with the enhanced neon glass styling:

```css
/* ---- AI button: glowing neon pill with cosmic glass gradient and aura ---- */
@property --ai-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes ai-conic-spin {
  to {
    --ai-angle: 360deg;
  }
}

.btn-ai {
  background: linear-gradient(135deg, rgba(14, 116, 144, 0.35) 0%, rgba(27, 16, 66, 0.92) 55%, rgba(14, 116, 144, 0.4) 100%);
  color: #fff;
  border-radius: var(--r-full);
  border: 1px solid transparent;
  position: relative;
  overflow: visible;
  box-shadow:
    0 0 16px rgba(34, 211, 238, 0.32),
    0 2px 8px rgba(27, 16, 66, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transition:
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.btn-ai::before {
  content: '';
  position: absolute;
  inset: -1.5px;
  border-radius: var(--r-full);
  padding: 1.5px;
  background: conic-gradient(from var(--ai-angle), #22d3ee, #a78bfa, #60a5fa, #22d3ee);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  animation: ai-conic-spin 4s linear infinite;
}

.btn-ai:hover {
  background: linear-gradient(135deg, rgba(14, 116, 144, 0.45) 0%, rgba(35, 21, 85, 0.95) 55%, rgba(14, 116, 144, 0.5) 100%);
  box-shadow:
    0 0 24px rgba(34, 211, 238, 0.5),
    0 4px 12px rgba(27, 16, 66, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transform: translateY(-0.5px);
}

.btn-ai:active {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .btn-ai::before {
    animation: none;
    background: linear-gradient(135deg, #22d3ee, #a78bfa);
  }
  .btn-ai {
    transition: none;
  }
}
```

- [x] **Step 2: Run verification script**

Run: `node tools/token-sweep.mjs` in `os/`
Expected: PASS with 0 raw literals.

- [x] **Step 3: Commit Task 2**

Run:

```bash
git add public/assets/hos.css
git commit -m "feat(buttons): elevate btn-ai with neon glass pill and rotating conic sweep"
```

---

### Task 3: Universal Button Loading States & Spinners in `hos.css`

**Files:**

- Modify: `os/public/assets/hos.css:800-840`
- Test: `os/tools/token-sweep.mjs`

- [x] **Step 1: Implement `.btn.is-loading` and `.btn[aria-busy="true"]` rules**

In `os/public/assets/hos.css`:

```css
/* ---- Universal button loading state ---- */
@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

.btn.is-loading,
.btn[aria-busy='true'] {
  position: relative;
  pointer-events: none;
  cursor: progress;
}

.btn.is-loading > *,
.btn[aria-busy='true'] > * {
  opacity: 0;
}

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

.btn-sm.is-loading::after,
.btn-sm[aria-busy='true']::after {
  width: 12px;
  height: 12px;
  border-width: 1.5px;
}

@media (prefers-reduced-motion: reduce) {
  .btn.is-loading::after,
  .btn[aria-busy='true']::after {
    animation: none;
    border-top-color: currentColor;
    opacity: 0.7;
  }
}
```

- [x] **Step 2: Run verification script**

Run: `node tools/token-sweep.mjs` in `os/`
Expected: PASS with 0 raw literals.

- [x] **Step 3: Commit Task 3**

Run:

```bash
git add public/assets/hos.css
git commit -m "feat(buttons): add universal loading state and spinner animation"
```

---

### Task 4: AI Badges & Spark Accents Elevation in `hos.css`

**Files:**

- Modify: `os/public/assets/hos.css`
- Test: `os/tools/token-sweep.mjs`

- [x] **Step 1: Add `.badge-ai.glow` and modernize `.ai-spark`**

In `os/public/assets/hos.css`:

```css
/* ---- AI badge and spark elevation ---- */
.badge-ai.glow,
.chip-ai.glow {
  border-color: rgba(34, 211, 238, 0.6);
  background: color-mix(in srgb, var(--ai-bright) 14%, var(--panel));
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.35);
}

.ai-spark.glow {
  box-shadow:
    0 0 12px rgba(34, 211, 238, 0.5),
    0 1px 4px rgba(60, 40, 10, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}
```

- [x] **Step 2: Run verification script**

Run: `node tools/token-sweep.mjs` in `os/`
Expected: PASS with 0 raw literals.

- [x] **Step 3: Commit Task 4**

Run:

```bash
git add public/assets/hos.css
git commit -m "feat(badges): add glow variant for AI badge and spark accents"
```

---

### Task 5: End-to-End Verification and Push

**Files:**

- All touched files in `os/` and `hos-frontend/`

- [x] **Step 1: Run all sweep tests in `os/`**
      Run:

```bash
node tools/token-sweep.mjs
node tools/adr7-sweep.mjs
node tools/facts-sweep.mjs
```

Expected: All 3 pass cleanly with 0 defects.

- [x] **Step 2: Push `os/` commits to git remote**
      Run: `git push origin main` in `os/`

- [x] **Step 3: Commit and push plan in `hos-frontend/`**
      Run:

```bash
git add docs/superpowers/plans/2026-10-09-prototype-foundation-alignment.md
git commit -m "docs: mark prototype foundation alignment plan complete"
git push origin main
```
