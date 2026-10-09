# Agents working in hos-frontend

Two AI agents work in this repository at the same time:

- **Claude Code** owns `packages/nova-ui/**` (the Nova component library), `packages/hos-utility/**`, the build and CI config, and the Storybook and Vercel deploy.
- **Gemini Antigravity** owns the product modules in `apps/web/src/modules/**`.

**The task board is `AGENTS-BOARD.md`.** Read it before you start, claim a task there, and update it when you finish. Never work on a task someone else has claimed.

## Ground rules for every agent

1. **Stay in your folders.** Edit only the paths your task names on the board.
   - If you need something outside them (a new Nova component, a token, a change to `packages/nova-ui`), add a **Request** row to the board and continue with what you can do. The owner of that folder picks it up.
   - Never edit `packages/nova-ui/**` from a module task.
2. **Your own branch and worktree, never `main` directly.**
   - Create a git worktree at `../.wt/<agent>-<task>` on a branch named `<agent>/<task>`, for example `../.wt/ag-reception` and branch `ag/reception`.
   - Commit there. A task is merged to `main` only after the full check below passes.
   - **Never `git push`, never add a remote, never deploy, never create anything on GitHub, Vercel or Neon.** The owner approves anything that leaves this machine.
3. **The full check must pass before you mark a task done:**
   ```
   NX_PLUGIN_NO_TIMEOUTS=true NX_DAEMON=false pnpm nx run-many -t test lint typecheck build --parallel=1 --skip-nx-cache
   ```
   Run `pnpm exec prettier --check .` as well. Do not weaken or skip a test, lint rule, guard or allowlist to make it pass. If something blocks you, write it on the board.
4. **The UI is Nova only.**
   - Module tabs compose `@hos/nova-ui` components and templates (`TabPage`, `TabHeader`, `TabToolbar`, `TabContent`, `TabKPIStrip`, `Box`, `Stack`, `Grid`, `Heading`, `Text`, `DataTable`, `Card`, the AI components, and so on).
   - No raw HTML elements where the `react/forbid-elements` rule forbids them.
   - No raw hex, no arbitrary Tailwind values: **design tokens only**, as `packages/nova-ui/CONTRIBUTING.md` describes.
   - Browse the components in Storybook (`pnpm nx run nova-ui:storybook`, or the deployed copy at https://nova-five-flame.vercel.app).
5. **The design source is the prototype:** `../os/public/*.html`, with `../os/public/assets/hos.css`. Each module tab has a matching prototype page and section. Build what the prototype shows, with Nova components. **`../BLUEPRINT.md` is the architecture**; follow it, and don't settle anything in its "Open decisions" table on your own.
6. **Health data never reaches logs:** no `console.*` with patient data, and no real patient data anywhere (sample data is invented). No secrets or API keys in code.
7. **AI output always needs a person's approval.**
   - Use Nova's AI components (`AiDraftBlock`, `ApprovalBar`, `AiSourceLine`, and so on).
   - Anything AI-made is shown as a draft until approved.
   - AI is marked with ✦ plus a text label, never colour alone.
8. **Test first.** Every tab gets a spec that renders it, checks its key content, and checks its accessibility (roles, labels, keyboard).
9. **Commits:** small and descriptive (`feat(reception): live queue tab from the prototype`). End each message with your own trailer, for example `Co-Authored-By: Gemini <noreply@google.com>` for Antigravity.
