# Agents board

Read `AGENTS.md` first. To claim a task, put your name in **Owner** and set **Status** to `in progress`. When the full check passes, set it to `done` and add the merge commit. **Status values:** `todo`, `in progress`, `review`, `done`, `blocked: <why>`.

## Product modules (`apps/web/src/modules/**`)

Each module was scaffolded with tabs that are still empty shells (`TabContent` holds only a comment). Fill them in from the prototype, **module by module, as a thin walking skeleton first**: the three modules a patient passes through on a first visit, then the rest.

For each module:

1. Build every tab with Nova components, matching the prototype page named below.
2. Put sample data behind a **typed data-access interface** in the module (`modules/<m>/data/`: a `types.ts` with the domain types, plus a `mock.ts` with invented hospital data). The tabs import the interface, never the mock directly, so the real API can replace it later without touching the UI.
3. Write a spec per tab: it renders, shows its key content, and passes the accessibility checks.
4. Run the full check, then merge to `main`.

| #   | Task                                                                                                     | Folders                                  | Prototype page                        | Owner  | Status |
| --- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------- | ------ | ------ |
| M1  | Reception / OPD: queue, registration, appointments, schedule, admission, referrals, WhatsApp, AI calling | `apps/web/src/modules/reception/**`      | `../os/public/02-reception.html`      | Claude | review |
| M2  | Doctor                                                                                                   | `apps/web/src/modules/doctor/**`         | `../os/public/03-doctor.html`         | Claude | todo   |
| M3  | Patient record                                                                                           | `apps/web/src/modules/patient-record/**` | `../os/public/04-patient-record.html` | Claude | todo   |
| M4  | IPD                                                                                                      | `apps/web/src/modules/ipd/**`            | `../os/public/05-ipd.html`            | Claude | todo   |
| M5  | Nursing                                                                                                  | `apps/web/src/modules/nursing/**`        | `../os/public/14-nursing.html`        | Claude | todo   |
| M6  | Billing                                                                                                  | `apps/web/src/modules/billing/**`        | `../os/public/06-billing.html`        | Claude | todo   |
| M7  | Pharmacy                                                                                                 | `apps/web/src/modules/pharmacy/**`       | `../os/public/07-pharmacy.html`       | Claude | todo   |
| M8  | Lab                                                                                                      | `apps/web/src/modules/lab/**`            | `../os/public/08-lab.html`            | Claude | todo   |
| M9  | Emergency                                                                                                | `apps/web/src/modules/emergency/**`      | `../os/public/16-emergency.html`      | Claude | todo   |
| M10 | OT                                                                                                       | `apps/web/src/modules/ot/**`             | `../os/public/15-ot.html`             | Claude | todo   |
| M11 | Insurance                                                                                                | `apps/web/src/modules/insurance/**`      | `../os/public/19-insurance.html`      | Claude | todo   |
| M12 | Analytics                                                                                                | `apps/web/src/modules/analytics/**`      | `../os/public/09-analytics.html`      | Claude | todo   |
| M13 | Quality                                                                                                  | `apps/web/src/modules/quality/**`        | `../os/public/13-quality.html`        | Claude | todo   |
| M14 | AI workforce                                                                                             | `apps/web/src/modules/ai-workforce/**`   | `../os/public/10-ai-workforce.html`   | Claude | todo   |
| M15 | Administration                                                                                           | `apps/web/src/modules/administration/**` | `../os/public/11-administration.html` | Claude | todo   |
| M16 | Super admin                                                                                              | `apps/web/src/modules/superadmin/**`     | `../os/public/12-superadmin.html`     | Claude | todo   |

Work in order: M1 to M3 first (the walking skeleton), then any order. Don't start a module while another one of yours is unmerged, so `main` stays reviewable.

## Library, platform, quality (`packages/**`, `apps/web/src/app/**`, config, deploy)

| #   | Task                                                                                                                                                                                                   | Folders                                                                                                                                                                                                                                            | Owner  | Status                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------- |
| C1  | Verify `main` after the Oct 8–9 commits: tests, guards, consistency and structure specs, font default; fix what fails                                                                                  | `packages/nova-ui/**`                                                                                                                                                                                                                              | Claude | in progress                 |
| C2  | AI component merge plan (shared typing dots and caret, review-decision engine, conversation log, chat bubble AI palette, icons), redone against the current AI button work                             | `packages/nova-ui/src/components/ai-*`, `chat-bubble`, `whatsapp-thread`, `call-transcript-console`, `extracted-values-review`, `fleet-kill-switch`, `algorithm-change-gate`, `ambient-scribe-recorder`, `voice-entry-capture`, `soap-draft-block` | Claude | todo                        |
| C3  | Polish: shared close-button size (Banner, copilot), DataTable uses the shared Checkbox, Tooltip `placement="right"`, Menu portal and edge-flip, red recording dot token, every theme in light and dark | `packages/nova-ui/**`                                                                                                                                                                                                                              | Claude | todo                        |
| C4  | Nova requests from module work (below)                                                                                                                                                                 | `packages/nova-ui/**`                                                                                                                                                                                                                              | Claude | todo                        |
| C5  | Storybook rebuild and Vercel redeploy after each Nova merge                                                                                                                                            | deploy                                                                                                                                                                                                                                             | Claude | todo                        |
| C6  | Backend tracks (B5, the A6 CI race fix, F2, K1, K2): **only on the owner's go**                                                                                                                        | `../hos-backend/**`                                                                                                                                                                                                                                | Claude | blocked: awaiting the owner |

## Requests (for Nova components, tokens or library changes)

A module task adds a row here instead of editing `packages/nova-ui`; the library task picks it up as C4 and fills in the result.

| #   | From | Need                                                                                                                                                                                                                        | For which tab       | Status | Result |
| --- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------ | ------ |
| R1  | M1   | App shell: a tab URL such as `/reception/admission` still opens Live Queue (tabs switch only by click), so a tab cannot be deep-linked or screenshotted by URL                                                              | all Reception tabs  | open   |        |
| R2  | M1   | `apps/web/src/app/app.spec.tsx` asserts the scaffold wording "Curated workflow for Live Queue." and "…for Appointments."; M1 kept those two descriptions so it passes. Loosen the spec, then M1 can write real descriptions | queue, appointments | open   |        |
| R3  | M1   | App-level colour scheme: nothing sets `data-nova-scheme` (the app follows light only); `prefers-color-scheme: dark` has no effect. M1 checked dark by setting the attribute by hand                                         | all                 | open   |        |
