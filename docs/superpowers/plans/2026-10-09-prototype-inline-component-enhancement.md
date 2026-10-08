# Prototype Inline Component & Loading State Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the HOS prototype (`os/`) with universal button loading states across interactive flows, consolidate disparate components into canonical component patterns (`data-component="Button"`, `data-component="AiButton"`, `data-component="ApprovalBar"`, `data-component="Card"`), and enhance the flagship Doctor consultation screen (`03-doctor.html`) so future AI models can ingest the prototype and build production applications directly.

**Architecture:** 
1. `os/releases/release-1/mockups/assets/hos.css`: Enhance `.btn.is-loading` to handle bare text nodes without layout shift via `color: transparent !important;` and variant-aware spinner colors.
2. `os/releases/release-1/mockups/assets/hos-sim.js`: Upgrade `HOS.busy`, `onApproveClick`, and form submission handling to automatically trigger `.is-loading` and `aria-busy="true"`.
3. `os/releases/release-1/mockups/03-doctor.html`: Pilot component consolidation and machine-readable annotations on the central clinical screen.
4. `os/scripts/build.mjs`: Sync changes to `os/public/`.
5. Automated verification: `node tools/token-sweep.mjs`, `node tools/adr7-sweep.mjs`, `node tools/facts-sweep.mjs`.

---

### Task 1: Robust Bare-Text Loading State Styling in `hos.css`

**Files:**
- Modify: `os/releases/release-1/mockups/assets/hos.css`
- Test: `os/tools/token-sweep.mjs`

- [ ] **Step 1: Enhance `.btn.is-loading` and `.btn[aria-busy="true"]` in `hos.css`**
Add `color: transparent !important;` and explicit spinner colors so buttons with bare text nodes or mixed nodes conceal text and present high-contrast spinners.
```css
.btn.is-loading,
.btn[aria-busy="true"] {
  position: relative;
  pointer-events: none;
  cursor: progress;
  color: transparent !important;
}

.btn.is-loading > *,
.btn[aria-busy="true"] > * {
  opacity: 0;
}

.btn.is-loading::after,
.btn[aria-busy="true"]::after {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 14px;
  height: 14px;
  border: 2px solid var(--ink);
  border-top-color: transparent;
  border-radius: var(--r-full);
  animation: btn-spin 0.75s linear infinite;
}

.btn-primary.is-loading::after,
.btn-primary[aria-busy="true"]::after {
  border-color: #ffffff;
  border-top-color: transparent;
}

.btn-ai.is-loading::after,
.btn-ai[aria-busy="true"]::after {
  border-color: #22D3EE;
  border-top-color: transparent;
}

.btn-ghost.is-loading::after,
.btn-ghost[aria-busy="true"]::after {
  border-color: var(--teal);
  border-top-color: transparent;
}
```

- [ ] **Step 2: Sync to `public/` and verify token sweep**
Run:
```bash
node scripts/build.mjs
node tools/token-sweep.mjs
```

- [ ] **Step 3: Commit Task 1 in `os/`**
```bash
git add releases/release-1/mockups/assets/hos.css
node scripts/build.mjs
git commit -m "feat(css): improve button loading state contrast and bare-text concealment"
```

---

### Task 2: Reactive Loading State Integration in `hos-sim.js`

**Files:**
- Modify: `os/releases/release-1/mockups/assets/hos-sim.js`
- Test: `os/tools/facts-sweep.mjs`, `os/tools/adr7-sweep.mjs`

- [ ] **Step 1: Upgrade `HOS.busy` to toggle `is-loading` and `aria-busy`**
In `os/releases/release-1/mockups/assets/hos-sim.js`:
Update `HOS.busy` so it sets `btn.classList.add("is-loading")` and `btn.setAttribute("aria-busy", "true")`.
When complete, remove `is-loading` and `aria-busy`.

- [ ] **Step 2: Add interactive loading feedback to approval buttons (`onApproveClick`)**
In `onApproveClick`, mark the button as `is-loading` / `aria-busy="true"` immediately during the approval countdown.

- [ ] **Step 3: Sync to `public/` and run verification sweeps**
Run:
```bash
node scripts/build.mjs
node tools/facts-sweep.mjs
node tools/adr7-sweep.mjs
```

- [ ] **Step 4: Commit Task 2 in `os/`**
```bash
git add releases/release-1/mockups/assets/hos-sim.js
node scripts/build.mjs
git commit -m "feat(sim): wire universal is-loading state to busy actions and approvals"
```

---

### Task 3: Component Consolidation & Loading State Wiring in `03-doctor.html`

**Files:**
- Modify: `os/releases/release-1/mockups/03-doctor.html`
- Test: `os/tools/token-sweep.mjs`, `os/tools/adr7-sweep.mjs`, `os/tools/facts-sweep.mjs`

- [ ] **Step 1: Add canonical `data-component` annotations to buttons and cards in `03-doctor.html`**
Tag buttons with `data-component="Button"` (or `AiButton`), `data-variant`, `data-size`.
Tag approval bars with `data-component="ApprovalBar"`.
Tag cards with `data-component="Card"`.

- [ ] **Step 2: Wire loading states to doctor consultation actions**
1. `#btnStartConsult`: add `data-busy="Opening consultation…"` or wire button loading state on click before switching tabs.
2. `#stopScribe`: set `stopBtn.classList.add("is-loading")` while interim transcription finishes and SOAP note generates.
3. Health memory ask button: add `data-busy="Thinking…"` with `data-busy-ms="400"`.
4. WhatsApp prescription approve: auto-inherits loading spinner from Task 2.

- [ ] **Step 3: Sync to `public/` and run all verification sweeps**
Run:
```bash
node scripts/build.mjs
node tools/token-sweep.mjs
node tools/adr7-sweep.mjs
node tools/facts-sweep.mjs
```

- [ ] **Step 4: Commit Task 3 in `os/`**
```bash
git add releases/release-1/mockups/03-doctor.html
node scripts/build.mjs
git commit -m "feat(doctor): consolidate components with data-component annotations and loading states"
```

---

### Task 4: Push and Final Verification

**Files:**
- `os/` repository
- `hos-frontend/` repository

- [ ] **Step 1: Push `os/` commits to git remote**
Run `git push origin main` in `os/`.

- [ ] **Step 2: Commit and push plan tracking in `hos-frontend/`**
Run `git add docs/superpowers/plans/2026-10-09-prototype-inline-component-enhancement.md; git commit -m "docs: add inline component enhancement plan"; git push origin main` in `hos-frontend/`.
