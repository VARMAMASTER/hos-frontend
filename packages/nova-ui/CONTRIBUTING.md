# Adding a Nova component

Nova is the HOS prototype (`os/public/assets/hos.css`) as a React library. The design language, the tokens and the rules are in `docs/design-language/README.md`; read its "Design tokens" section first. This checklist is what a new component (or a converted one) must have before it is merged. Button, TextField, Card and Chip are the reference implementations.

## 1. The folder

One folder per component under `src/components/`, named in kebab case (`src/structure.spec.ts` checks the shape):

- `x.tsx`: the component (more files in the folder for its parts, such as `field-shell.tsx`);
- `x.spec.tsx`: its tests (Vitest and Testing Library; no `jest-dom`; every file that calls `render` also calls `afterEach(() => cleanup())`);
- `x.stories.tsx`: its Storybook stories, every state the component has.

A file stays under 500 lines (a spec under 900); split a larger one by moving its model or a part into its own file, or list it in `structure.spec.ts` with the reason. A helper two components need (a hook, a drawn box, a class treatment) moves into `src/primitives/`, never a second copy.

## 2. Tokens only

Every design value is a named token. A component writes the token's utility, never a number:

| For            | Write                                                                                             | Never                             |
| -------------- | ------------------------------------------------------------------------------------------------- | --------------------------------- |
| spacing        | the scale `p-s0` … `p-s10` (2 … 48px), or a component token (`p-card`, `px-control-md`)           | `p-4`, `gap-1.5`, `p-[13px]`      |
| sizes          | `h-control-md`, `size-icon-md`, `size-dot`, `min-h-touch`, `w-rail`, `max-w-md`, the scale        | `h-10`, `size-[7px]`, `w-[30px]`  |
| type           | a role: `text-label`, `text-control`, `text-title` …; `leading-*` and `tracking-*` roles          | `text-[12px]`, `leading-[1.4]`    |
| corners        | a role: `rounded-control`, `-card`, `-overlay`, `-hero`, `-chip`, `-tag`, `-pill`, `-full`        | `rounded-md`, `rounded-[3px]`     |
| edges          | `border`, `border-emphasis`, `border-l-rail`, `ring-hairline`, `ring-emphasis`                    | `border-2`, `ring-1`              |
| motion         | `duration-fast`, `-base`, `-slow`; `ease-spring`, `-standard`, `-emphasized`, under `motion-safe` | `duration-150`, `ease-out`        |
| colour         | the semantic colours (`bg-surface`, `text-ink-2`, `text-crit-deep` …)                             | a hex, `bg-red-500`, `bg-[white]` |
| surfaces       | `Surface` with a `material` and a radius role                                                     | `nova-card` in a class string     |
| a style object | a token reference (`'--x': 'var(--nova-…)'`) or a computed percentage                             | `style={{ width: 54 }}`, `'12px'` |

A token reference in an arbitrary value is allowed (`w-[var(--nova-sidebar-rail-w)]`, `bg-(--nova-chrome-field)`, `hover:[--nova-surface-lift:var(--nova-shadow-md)]`), and so are a transition's property list, generated content and an `fr` grid template. If no token fits, add one (README, "How to add a value"); a value only this component needs goes in its family's "Component tokens" section of `src/styles/theme.css`.

`src/primitives/conventions.spec.ts` checks all of this, in every component, story and primitive, with no exceptions.

## 3. The API

- `size`: `Size` from `primitives/types.ts` (`'sm' | 'md'`), md by default, on the control tokens (`h-control-sm|md` or `min-h-control-sm|md`, `px-/py-control-sm|md`), so every control of a size is one height. A size beyond them (`Avatar`'s xs and lg) is added beside `Size`, with a comment.
- `tone`: `Tone` from `primitives/types.ts` (`'good' | 'warn' | 'crit' | 'info' | 'neutral' | 'ai' | 'highlight' | 'brand'`), narrowed with `Extract<Tone, …>` to the ones the component draws; each status has its `-soft` / `-deep` pair and is always a word or a glyph too, never colour alone (`TONE_WORDS` in `chip.tsx`). Never a local copy of the union, never a synonym (`'success'`, `'error'`, `'primary'`, `'default'`).
- `variant`: the visual variants (`'primary' | 'outline' | 'ghost' | …`), never a status (a status is a `tone`).
- `disabled`: native where the element has it; `aria-disabled` where focus must stay (a disabled button that keeps focus). The look is `primitives/states.ts`: `disabledControl` (a button, segment, chip or tab), `disabledField` (a field) or `ariaDisabled`.
- `className`: merged last through `cx`, on the outermost element (on a field, the wrapper; say so in a comment when it differs).
- Controlled and uncontrolled: `<state>` / `default<State>` / `on<State>Change` (`value` / `defaultValue` / `onValueChange`, `open` / `defaultOpen` / `onOpenChange`, `checked`, `pressed` …), or `onChange` for the value where the element's own change event is not in the way, through `useControllableState`, never a second implementation. A loading control sets `aria-busy`.
- `forwardRef` to the main interactive element; the rest of the props spread onto it.
- Compose the primitives: `cx`, `focusRing` (every interactive element), `states` (the disabled looks), `Surface` (a radius role, or `radius="none"` for a square frame), `menuItem` (a menu row), `VisuallyHidden`, `useControllableState`, `useChoiceValue`, `nextRovingIndex` (arrow-key focus in a row), `focus-trap`, `motionAllowed` / `playMotion` / `useLoopMotion`, `CheckboxBox`, `RadioDot`, `SkeletonBar`.

## 4. Accessibility tests

In `x.spec.tsx`:

- roles, names and ARIA states (`aria-pressed`, `aria-checked`, `aria-expanded`, `aria-current`, `aria-invalid` with its `aria-describedby`);
- keyboard: Tab order, Enter and Space, arrows and Escape where the pattern has them, focus return;
- the focus ring comes from `focusRing`;
- status and selection are never colour-only (a word, a glyph or a shape);
- an AI element uses `AiMark` (bare, or `tile`), never a literal glyph, and always has a text label: one glyph, bare or in the tile, always with a text label (`src/primitives/ai-mark-guard.spec.ts` enforces it, in Nova and in `apps/web/src`);
- targets: 24px at least (`size-touch-sm`), 44px for primary touch targets (`min-h-touch`);
- motion only under `motion-safe` (and `playMotion`, which honours `prefers-reduced-motion`);
- a probe value that is a patient name uses "Ramesh".

## 5. Light, dark and material

- Stories render under the toolbar's theme, scheme (light, dark, system) and material (glass, frost, solid). Check the component in each scheme, on glass and on solid, and under at least one other hospital theme.
- Every colour pairing the component introduces (text on a fill, a mark on a ground) is a named check in `src/theme/legibility.ts` (the component pairings at the end of the file), with the use it proves. The proof then runs for HOS Violet and 480 hospital brands, in both schemes, on every material (`theme/legibility.spec.ts`). Never a proof of your own in the component's folder.
- Dense data stays on an opaque surface (`card` or `data`), never glass.

## 6. The barrel and the docs

- Export the component, its props type and its public types from `src/index.ts` (alphabetical, one line per file), and add what the barrel promises to `src/index.spec.ts`.
- If it is a prototype element, name the `hos.css` rule it follows in a comment, with the tokens it uses.

## 7. Before you report

- `NX_DAEMON=false pnpm nx run-many -t test lint typecheck build --projects=nova-ui --parallel=1` is green, and `pnpm exec prettier --check` on every file you touched. That includes `src/consistency.spec.tsx` (the same height, padding and corner as the components that do the same job, the focus ring, the disabled look, the shared types and prop names) and `src/structure.spec.ts` (the folder, the barrel, the file size): if your component differs on purpose, add it to the spec's allowlist with the reason.
- Build Storybook to a scratch folder (never the default output) and look at the component in light and dark; compare with the prototype page that uses it.
