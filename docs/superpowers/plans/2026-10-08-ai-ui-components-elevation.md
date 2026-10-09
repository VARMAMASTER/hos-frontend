# AI UI Components Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drastically elevate all Nova UI AI components with the futuristic glowing glass aesthetic, 3-star sparkle cluster, radiant glowing borders, and neon aura matching the reference design and upgraded AiButton.

**Architecture:**

1. Create a shared `SparkleCluster` primitive under `primitives/ai-sparkle.tsx` for consistent, accessible 3-star SVG sparkle rendering across all AI components.
2. Enhance `theme.css` with neon spark glow and `nova-ai-badge-pill` glass styling utilities.
3. Systematically upgrade `AiBadge`, `AiCopilotDock`, `AiThinking`, `ChatAnswer`, `AiProgressSteps`, `ActivityFeed`, and `Button (ai variant)` to use the glowing sparkle cluster and glass styling while preserving all accessibility semantics (`✦` screen-reader text, 100% test pass rate).
4. Verify all 2,986+ unit/consistency tests and ESLint pass with 0 errors, build Storybook and Web app, commit to `main`, and deploy to Vercel.

**Tech Stack:** React 19, Tailwind CSS v4, Vitest, Storybook 8, Vite, Vercel.

## Global Constraints

- Preserve accessibility text: `✦` must remain in `textContent` (via visually hidden text alongside the SVG sparkle cluster).
- Motion safety: Every animation must be guarded with `motion-safe:`.
- Semantic tokens: No raw hex colors in TSX/JSX; use design tokens and utilities from `theme.css`.
- 100% test pass rate across `nova-ui` and `@hos-frontend/web`.

---

### Task 1: Create Shared SparkleCluster Primitive & Elevate Theme CSS

**Files:**

- Create: `hos-frontend/packages/nova-ui/src/primitives/ai-sparkle.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/styles/theme.css`
- Modify: `hos-frontend/packages/nova-ui/src/components/ai-button/ai-button.tsx`

- [ ] **Step 1: Create `ai-sparkle.tsx`**
      Export `SparkleCluster` component.

- [ ] **Step 2: Add `nova-ai-badge-pill` and elevate `nova-ai-spark` in `theme.css`**
      Add radiant neon glass utilities to `theme.css`.

- [ ] **Step 3: Update `ai-button.tsx` to use shared `SparkleCluster`**
      Import `SparkleCluster` from `../../primitives/ai-sparkle`.

- [ ] **Step 4: Verify conventions and existing AiButton tests pass**
      Run `vitest run src/primitives/conventions.spec.ts src/components/ai-button/ai-button.spec.tsx`.

---

### Task 2: Elevate `AiBadge` Component & Stories

**Files:**

- Modify: `hos-frontend/packages/nova-ui/src/components/ai-badge/ai-badge.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/components/ai-badge/ai-badge.stories.tsx`
- Test: `hos-frontend/packages/nova-ui/src/components/ai-badge/ai-badge.spec.tsx`

- [ ] **Step 1: Update `AiBadge` to render `SparkleCluster` with `variant` support**
      Ensure single `[aria-hidden="true"]` wrapper with `<span className="sr-only">✦</span>` inside.

- [ ] **Step 2: Add `Glowing` story to `ai-badge.stories.tsx`**

- [ ] **Step 3: Run `ai-badge.spec.tsx`**
      Ensure 7/7 tests pass.

---

### Task 3: Elevate `AiCopilotDock` Floating Orb & Docked Trigger

**Files:**

- Modify: `hos-frontend/packages/nova-ui/src/components/ai-copilot-dock/ai-copilot-dock.tsx`
- Test: `hos-frontend/packages/nova-ui/src/components/ai-copilot-dock/ai-copilot-dock.spec.tsx`

- [ ] **Step 1: Upgrade `Orb` with cosmic `nova-ai-hero-fill`, glowing aura, and `SparkleCluster`**

- [ ] **Step 2: Upgrade `dockedTrigger` with neon pill styling and `SparkleCluster`**

- [ ] **Step 3: Upgrade panel header spark to use `SparkleCluster`**

- [ ] **Step 4: Run `ai-copilot-dock.spec.tsx`**
      Ensure all tests pass.

---

### Task 4: Elevate `AiThinking` and `ChatAnswer` in `AiChatThread`

**Files:**

- Modify: `hos-frontend/packages/nova-ui/src/components/ai-chat-thread/ai-thinking.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/components/ai-chat-thread/chat-answer.tsx`
- Test: `hos-frontend/packages/nova-ui/src/components/ai-chat-thread/chat-parts.spec.tsx`
- Test: `hos-frontend/packages/nova-ui/src/components/ai-chat-thread/ai-chat-thread.spec.tsx`

- [ ] **Step 1: Upgrade `AiThinking` with frosted glass pill and pulsing `SparkleCluster`**

- [ ] **Step 2: Upgrade `ChatAnswer` header spark with `SparkleCluster` and luminous card bubble**

- [ ] **Step 3: Run `chat-parts.spec.tsx` and `ai-chat-thread.spec.tsx`**
      Ensure all tests pass.

---

### Task 5: Elevate `AiProgressSteps`, `ActivityFeed`, and `Button (ai variant)`

**Files:**

- Modify: `hos-frontend/packages/nova-ui/src/components/ai-progress-steps/ai-progress-steps.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/components/activity-feed/activity-feed.tsx`
- Modify: `hos-frontend/packages/nova-ui/src/components/button/button.tsx`
- Test: `hos-frontend/packages/nova-ui/src/components/ai-progress-steps/ai-progress-steps.spec.tsx`
- Test: `hos-frontend/packages/nova-ui/src/components/activity-feed/activity-feed.spec.tsx`
- Test: `hos-frontend/packages/nova-ui/src/components/button/button.spec.tsx`

- [ ] **Step 1: Update `AiProgressSteps` caption with `SparkleCluster`**
- [ ] **Step 2: Update `ActivityFeed` AI marker with `SparkleCluster`**
- [ ] **Step 3: Update `Button` ai variant with hover/focus glow**
- [ ] **Step 4: Run tests for all three components**

---

### Task 6: Full Verification, Storybook Build, Commit & Deploy

**Files:**

- All touched files

- [ ] **Step 1: Run full test suite across repository**
      Run `pnpm --dir hos-frontend exec nx run-many -t test lint typecheck`.

- [ ] **Step 2: Build Storybook and Web application**
      Run `pnpm --dir hos-frontend exec nx run nova-ui:build-storybook`.
      Run `pnpm --dir hos-frontend exec nx build web`.

- [ ] **Step 3: Commit and push to GitHub `main`**
- [ ] **Step 4: Deploy to Vercel and assign production aliases**
