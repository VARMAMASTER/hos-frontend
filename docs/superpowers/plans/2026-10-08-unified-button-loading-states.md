# Unified Button Loading States & Component Clubbing Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify button components across Nova UI, provide first-class loading states across all button variants and button-like controls, and club duplicate spinner and button implementations into single canonical primitives following design consistency.

**Architecture:**
1. Create a shared `Spinner` primitive in `primitives/spinner.tsx` for consistent, accessible, motion-safe loading indication across all components.
2. Upgrade `Button` in `components/button/button.tsx` to support `loading` with `loadingText?: string` across all variants (`primary`, `outline`, `ghost`, `danger`, `ai`), keeping full backwards compatibility and test compliance.
3. Add `loading?: boolean` to `ButtonGroupItem` in `components/button-group/button-group.tsx`.
4. Connect `loading` states to buttons in workflow components (`ApprovalBar`, `ChatComposer`, `AmbientScribeRecorder`, `ReasonDialog`).
5. Club button implementations by exporting and harmonizing `Button` and `AiButton` as a unified family.
6. Verify full test suite (100% passing) and Storybook.

---

### Task 1: Create Canonical `Spinner` Primitive

**Files:**
- Create: `hos-frontend/packages/nova-ui/src/primitives/spinner.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/primitives/conventions.spec.ts` (if needed)

- [x] **Step 1: Implement `primitives/spinner.tsx`**
- [x] **Step 2: Verify conventions pass**

---

### Task 2: Elevate `Button` with Canonical Spinner & `loadingText`

**Files:**
- Modify: `hos-frontend/packages/nova-ui/src/components/button/button.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/components/button/button.stories.tsx`
- Test: `hos-frontend/packages/nova-ui/src/components/button/button.spec.tsx`

- [x] **Step 1: Update `button.tsx` to use shared `Spinner` and support `loadingText`**
- [x] **Step 2: Add stories demonstrating loading states for all variants and `loadingText`**
- [x] **Step 3: Run `button.spec.tsx`**

---

### Task 3: Add `loading` State to `ButtonGroupItem`

**Files:**
- Modify: `hos-frontend/packages/nova-ui/src/components/button-group/button-group.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/components/button-group/button-group.stories.tsx`
- Test: `hos-frontend/packages/nova-ui/src/components/button-group/button-group.spec.tsx`

- [x] **Step 1: Add `loading?: boolean` to `ButtonGroupItemProps` and render `Spinner`**
- [x] **Step 2: Add loading test to `button-group.spec.tsx`**
- [x] **Step 3: Run `button-group.spec.tsx`**

---

### Task 4: Connect Loading States in Workflow Components

**Files:**
- Modify: `hos-frontend/packages/nova-ui/src/components/approval-bar/approval-bar.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/components/ai-chat-thread/chat-composer.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/components/ambient-scribe-recorder/ambient-scribe-recorder.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/components/fleet-kill-switch/reason-dialog.tsx`

- [x] **Step 1: Update `ApprovalBar` to set `loading={busy}` on Approve button**
- [x] **Step 2: Update `ChatComposer` to set `loading={busy}` on Send button when not stoppable**
- [x] **Step 3: Update `AmbientScribeRecorder` to set `loading={status === 'requesting'}` on action button**
- [x] **Step 4: Update `ReasonDialog` to support `busy?: boolean` on confirm button**
- [x] **Step 5: Run tests for all 4 components**

---

### Task 5: Full Test Verification, Build, Commit & Deploy

- [x] **Step 1: Run all tests in `nova-ui` and `web`**
- [x] **Step 2: Run Storybook build**
- [x] **Step 3: Git commit, push to `origin main`, deploy to Vercel**
