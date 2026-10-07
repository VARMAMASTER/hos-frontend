import {
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { Chip } from '../chip/chip';
import { IconTile } from '../icon-tile/icon-tile';
import { Menu, MenuGroup } from '../menu/menu';

export interface ModuleOption {
  id: string;
  label: string;
  // An svg glyph for the module's tile. Without one the tile shows the module's initials (the
  // prototype's "Re", "Dr", "OT"), or the AI spark for an `ai` module.
  icon?: ReactNode;
  // The section of the menu it is listed under ("Clinical", "Money"). Modules without one come first,
  // outside any section.
  group?: string;
  // A second line under the label ("In-patients").
  description?: string;
  // Words the filter also matches ("OPD" finds Reception).
  keywords?: string[];
  // Where it goes. Rendered as a real link, so it can be opened in a new tab. A module with neither
  // `href` nor `onSelect` is chosen through the switcher's onSelect alone.
  href?: string;
  onSelect?: () => void;
  // A count or a short word at the end of the row ("3").
  badge?: string | number;
  // What the badge means, said to assistive technology in place of the bare badge ("3 claims waiting").
  badgeLabel?: string;
  // The AI Workforce: its tile is the AI tile.
  ai?: boolean;
  // Stays in the menu and is announced as unavailable, but cannot be chosen.
  disabled?: boolean;
  // The user has no permission for it: it is not rendered anywhere, not in the menu, the recents, the
  // filter results or the trigger. Hiding is the caller's decision, so a module is never a dead end.
  hidden?: boolean;
}

export interface ModuleSwitcherProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect' | 'children'> {
  modules: ModuleOption[];
  // The id of the module the user is in now. It is always on the trigger as text and in the
  // trigger's accessible name.
  current: string;
  // Ids of the modules used lately, most recent first. They are listed first, under `recentLabel`,
  // and are not repeated in their own section. Not shown while filtering.
  recent?: string[];
  recentLabel?: string;
  // Called with the chosen id after the module's own onSelect, including when the current module is
  // chosen again.
  onSelect?: (id: string) => void;
  // Whether the menu is open. Give it with onOpenChange and the parent owns the state (controlled);
  // leave it off and the switcher keeps its own, starting from defaultOpen.
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  // A line at the top of the menu ("Switch module").
  hint?: ReactNode;
}

// The prototype's .ws-switch: a faint white lift with a white rim, the nav row's 8px by 10px, the
// card corner; open, it
// takes the chrome accent's soft fill and rim. Inside, the .ws-cur-l eyebrow (9.5px capitals), the
// module in the display face at 13.5px semibold, and the chevron.
const triggerClasses =
  'group flex w-full items-center gap-s3 rounded-card border border-chrome-ink/15 bg-chrome-ink/5 ' +
  'px-nav-item py-nav-item text-left text-on-primary transition-colors hover:border-chrome-ink/20 hover:bg-chrome-ink/10 ' +
  'aria-expanded:border-chrome-accent/45 aria-expanded:bg-chrome-accent-soft';

// Menu's own item treatment (the prototype's .ws-item), so a module row and any other menu row look
// alike: 13px at 500 (text-control), 8px all round and between its parts (p-s3, gap-s3).
const itemClasses = cx(
  'flex w-full items-center gap-s3 rounded-control p-s3 text-left text-control font-medium text-ink transition-colors',
  'hover:bg-primary-soft focus:bg-primary-soft',
  focusRing,
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
);

// Every item of the open menu, as Menu itself counts them: reachable by the arrow keys unless natively
// disabled (a module that is merely unavailable is aria-disabled and stays reachable).
const MENU_ITEMS =
  '[role="menu"] :is([role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]):not(:disabled)';

// "Billing" is "Bi", "AI Workforce" is "AW", "Operation Theatre" is "OT": the prototype's tile text.
function monogram(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const first = Array.from(words[0] ?? '')[0] ?? '';
    const last = Array.from(words[words.length - 1] ?? '')[0] ?? '';
    return (first + last).toUpperCase();
  }
  return Array.from(words[0] ?? '?')
    .slice(0, 2)
    .join('');
}

function glyphOf(module: ModuleOption): ReactNode {
  return module.icon ?? (module.ai ? '✦' : monogram(module.label));
}

function searchable(module: ModuleOption): string {
  return `${module.label} ${module.description ?? ''} ${(module.keywords ?? []).join(' ')}`.toLowerCase();
}

// The tile of a row in the light menu: the prototype's .ic, in the surface's own inks (IconTile is
// for the dark chrome). The current module's is the brand fill, the AI module's the AI tile.
function ModuleGlyph({
  module,
  current,
}: {
  module: ModuleOption;
  current: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      data-module-glyph=""
      data-tone={module.ai ? 'ai' : 'default'}
      className={cx(
        'inline-grid size-tile shrink-0 place-items-center rounded-control border font-display text-badge font-bold tracking-initials [&_svg]:size-icon-tile',
        module.ai
          ? 'border-ai-line bg-ai-soft text-ai-deep'
          : current
            ? 'border-primary bg-primary text-on-primary'
            : 'border-border bg-surface-2 text-ink-2',
      )}
    >
      {glyphOf(module)}
    </span>
  );
}

function ModuleRow({
  module,
  current,
  onChoose,
  onKeyDown,
}: {
  module: ModuleOption;
  current: boolean;
  onChoose: (module: ModuleOption) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}) {
  const unavailable = module.disabled === true;
  const shared = {
    role: 'menuitemradio',
    'aria-checked': current,
    'aria-disabled': unavailable || undefined,
    // The menu moves focus with the arrow keys; the rows stay out of the Tab order.
    tabIndex: -1,
    'data-module': module.id,
    className: cx(
      itemClasses,
      current && 'bg-primary-soft font-semibold text-primary-strong',
    ),
    onKeyDown,
  } as const;
  const content = (
    <>
      <ModuleGlyph module={module} current={current} />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{module.label}</span>
        {module.description ? (
          <span className="block truncate text-meta font-normal text-ink-3">
            {module.description}
          </span>
        ) : null}
      </span>
      {module.badge !== undefined ? (
        <Chip className="shrink-0">
          <span
            data-badge-visible=""
            aria-hidden={module.badgeLabel ? true : undefined}
          >
            {module.badge}
          </span>
          {module.badgeLabel ? (
            <VisuallyHidden>{module.badgeLabel}</VisuallyHidden>
          ) : null}
        </Chip>
      ) : null}
      {current ? (
        <svg
          data-tick=""
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 16 16"
          className="size-icon-md shrink-0"
        >
          <path
            d="M3.5 8.5l3 3 6-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </>
  );

  if (module.href && !unavailable) {
    return (
      <a {...shared} href={module.href} onClick={() => onChoose(module)}>
        {content}
      </a>
    );
  }
  return (
    <button
      {...shared}
      type="button"
      onClick={unavailable ? undefined : () => onChoose(module)}
    >
      {content}
    </button>
  );
}

interface Section {
  key: string;
  label: string | null;
  modules: ModuleOption[];
}

// The module menu of the sidebar: which module of HOS the user is working in, and the way to another.
// It is Menu, so the keyboard, focus and dismissal behaviour is Menu's own: Enter, Space or ArrowDown
// on the trigger opens it on the current module, the arrows, Home and End move, Enter chooses,
// Escape closes and returns focus. On top of that sits a filter: a search box in the menu, reached by
// ArrowUp from the first row (or by clicking it), that narrows the list as you type. Typing a letter
// while a row has focus goes straight to it. Enter in the box chooses the first match.
export function ModuleSwitcher({
  modules,
  current,
  recent = [],
  recentLabel = 'Recent',
  onSelect,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  hint,
  className,
  ...rest
}: ModuleSwitcherProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  // A module the user has no permission for does not exist as far as the switcher is concerned.
  const visible = modules.filter((module) => !module.hidden);
  const currentModule = visible.find((module) => module.id === current);

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? visible.filter((module) => searchable(module).includes(needle))
    : visible;

  // Recent first (not while filtering, so results keep their own sections), each module once; then
  // the modules with no group, then one section per group in the order the modules name them.
  const sections: Section[] = [];
  const claimed = new Set<string>();
  if (!needle) {
    const lately: ModuleOption[] = [];
    for (const id of recent) {
      const module = visible.find((candidate) => candidate.id === id);
      if (module && !claimed.has(id)) {
        claimed.add(id);
        lately.push(module);
      }
    }
    if (lately.length > 0) {
      sections.push({ key: 'recent', label: recentLabel, modules: lately });
    }
  }
  const ungrouped: ModuleOption[] = [];
  const byGroup = new Map<string, ModuleOption[]>();
  for (const module of matches) {
    if (claimed.has(module.id)) continue;
    if (module.group === undefined) ungrouped.push(module);
    else
      byGroup.set(module.group, [...(byGroup.get(module.group) ?? []), module]);
  }
  if (ungrouped.length > 0) {
    sections.push({ key: 'ungrouped', label: null, modules: ungrouped });
  }
  for (const [group, groupModules] of byGroup) {
    sections.push({
      key: `group:${group}`,
      label: group,
      modules: groupModules,
    });
  }

  function menuItems(): HTMLElement[] {
    return Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>(MENU_ITEMS) ?? [],
    );
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // The next time it opens it shows everything again.
    if (!next) setQuery('');
  }

  function choose(module: ModuleOption) {
    module.onSelect?.();
    onSelect?.(module.id);
  }

  // Typing on a row goes to the filter, as it does in a native menu's type-ahead; ArrowUp from the
  // first row steps up into it.
  function handleRowKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key.length === 1 && event.key !== ' ') {
      event.preventDefault();
      setQuery((text) => text + event.key);
      filterRef.current?.focus();
      return;
    }
    if (event.key === 'ArrowUp' && menuItems()[0] === event.currentTarget) {
      event.preventDefault();
      // Menu would wrap to the last row.
      event.stopPropagation();
      filterRef.current?.focus();
    }
  }

  function handleFilterKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      menuItems()[0]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      menuItems().at(-1)?.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      // The first match that can be chosen; the menu closes on the click, as for any row.
      menuItems()
        .find((item) => item.getAttribute('aria-disabled') !== 'true')
        ?.click();
    }
  }

  const noMatch = matches.length === 0;
  const status = noMatch
    ? needle
      ? `No modules match “${query.trim()}”`
      : 'No modules available'
    : needle
      ? `${matches.length} ${matches.length === 1 ? 'module' : 'modules'}`
      : '';

  const label = currentModule?.label ?? 'Choose a module';

  return (
    <div {...rest} ref={rootRef} className={className}>
      <Menu
        fullWidth
        open={open}
        onOpenChange={handleOpenChange}
        header={
          <>
            {hint ? <div className="pb-s3">{hint}</div> : null}
            <div className="relative">
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 16 16"
                className="pointer-events-none absolute inset-y-0 left-field my-auto size-icon-md text-ink-3"
              >
                <circle
                  cx="7"
                  cy="7"
                  r="4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M10.5 10.5L14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <input
                ref={filterRef}
                type="search"
                aria-label="Filter modules"
                placeholder="Filter modules"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onKeyDown={handleFilterKeyDown}
                className={cx(
                  'nova-field block w-full rounded-control py-s3 pr-field pl-field-icon text-control text-ink placeholder:text-ink-3 transition-colors',
                  focusRing,
                )}
              />
            </div>
            {/* Always in the page, so a change is announced. Empty and unseen until someone is
                filtering; the "no match" message is for the eye as well. */}
            <p
              role="status"
              className={cx(
                noMatch
                  ? 'px-s1 pt-s3 pb-s1 text-control text-ink-2'
                  : 'sr-only',
              )}
            >
              {status}
            </p>
          </>
        }
        trigger={
          <button type="button" className={cx(triggerClasses, focusRing)}>
            <IconTile
              data-module-glyph=""
              tone={currentModule?.ai ? 'ai' : 'chrome'}
            >
              {currentModule ? glyphOf(currentModule) : '?'}
            </IconTile>
            <span className="min-w-0 flex-1">
              <VisuallyHidden>Current module:</VisuallyHidden>{' '}
              <span
                aria-hidden="true"
                className="block text-micro font-semibold tracking-group uppercase text-(color:--nova-chrome-ink-2)"
              >
                Module
              </span>
              <span className="block truncate font-display text-input font-semibold">
                {label}
              </span>
            </span>
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 16 16"
              className="size-icon-md shrink-0 text-(color:--nova-chrome-ink-2) transition-transform group-aria-expanded:rotate-180"
            >
              <path
                d="M4 6l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        }
      >
        {sections.map((section) => {
          const rows = section.modules.map((module) => (
            <ModuleRow
              key={module.id}
              module={module}
              current={module.id === current}
              onChoose={choose}
              onKeyDown={handleRowKeyDown}
            />
          ));
          return section.label === null ? (
            <div key={section.key} role="presentation">
              {rows}
            </div>
          ) : (
            <MenuGroup key={section.key} label={section.label}>
              {rows}
            </MenuGroup>
          );
        })}
      </Menu>
    </div>
  );
}
