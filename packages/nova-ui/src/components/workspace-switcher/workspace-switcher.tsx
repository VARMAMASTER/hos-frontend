import {
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

export interface WorkspaceOption {
  id: string;
  name: string;
  // A second line under the name ("Kukatpally", "60 beds").
  label?: string;
}

export interface WorkspaceMenuItem extends WorkspaceOption {
  // Stays in the menu and is announced as unavailable, but cannot be chosen.
  disabled?: boolean;
}

export interface WorkspaceGroup {
  label: string;
  items: WorkspaceMenuItem[];
}

export interface WorkspaceSwitcherProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect' | 'children'> {
  // The workspace the clinician is working in now. It decides which patients they see, so it is
  // always on the trigger as text and in the trigger's accessible name.
  current: WorkspaceOption;
  groups: WorkspaceGroup[];
  // Called with the chosen id, including when the current workspace is chosen again.
  onSelect: (id: string) => void;
  // Controlled: the parent owns whether the menu is open.
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // A line at the top of the menu ("Switch workspace").
  hint?: ReactNode;
}

const ITEM = '[role="menuitemradio"]';

function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return Array.from(menu?.querySelectorAll<HTMLElement>(ITEM) ?? []);
}

// The current workspace first, so a screen reader announces where you are as the menu opens (or
// the first item when the current workspace is not in the menu); or the last item, for ArrowUp.
function focusMenuItem(menu: HTMLElement | null, which: 'current' | 'last') {
  const all = menuItems(menu);
  const target =
    which === 'last'
      ? all[all.length - 1]
      : (all.find((el) => el.getAttribute('aria-checked') === 'true') ??
        all[0]);
  target?.focus();
}

const triggerClasses =
  'group flex w-full items-center gap-3 rounded-md border border-primary-soft/25 bg-primary/20 ' +
  'px-3 py-2 text-left text-on-primary hover:bg-primary/30 aria-expanded:bg-primary/40 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft';

// The menu is a nova-overlay: a light surface even on the dark chrome, so it uses ink tokens.
const itemClasses =
  'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-ink ' +
  'hover:bg-primary-soft focus-visible:bg-primary-soft focus-visible:outline-2 ' +
  'focus-visible:-outline-offset-2 focus-visible:outline-primary ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

// Current is bold and ticked, as well as tinted and aria-checked.
const itemCurrentClasses = 'bg-primary-soft font-semibold text-primary-strong';

export function WorkspaceSwitcher({
  current,
  groups,
  onSelect,
  open,
  onOpenChange,
  hint,
  className,
  ...rest
}: WorkspaceSwitcherProps) {
  const triggerId = useId();
  const menuId = useId();
  const hintId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Which item takes focus when the menu next opens. Reset every time it is used.
  const opensOn = useRef<'current' | 'last'>('current');

  // Runs only when `open` flips: it reads the DOM through refs, so a parent that re-renders with
  // fresh `groups` while the menu is open never snaps focus back to the current item.
  useEffect(() => {
    if (!open) return;
    const which = opensOn.current;
    opensOn.current = 'current';
    focusMenuItem(menuRef.current, which);
  }, [open]);

  // A press anywhere outside closes the menu. Focus is left where the user put it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onOpenChange]);

  const closeAndReturnFocus = () => {
    onOpenChange(false);
    triggerRef.current?.focus();
  };

  const choose = (item: WorkspaceMenuItem) => {
    if (item.disabled) return;
    onSelect(item.id);
    closeAndReturnFocus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const which = event.key === 'ArrowUp' ? 'last' : 'current';
      if (open) {
        focusMenuItem(menuRef.current, which);
      } else {
        opensOn.current = which;
        onOpenChange(true);
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      closeAndReturnFocus();
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const all = menuItems(menuRef.current);
    const at = all.indexOf(event.target as HTMLElement);
    const move = (to: number) => {
      event.preventDefault();
      all[to]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        move(at < 0 ? 0 : (at + 1) % all.length);
        break;
      case 'ArrowUp':
        move(at < 0 ? all.length - 1 : (at - 1 + all.length) % all.length);
        break;
      case 'Home':
        move(0);
        break;
      case 'End':
        move(all.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        closeAndReturnFocus();
        break;
      case 'Tab':
        // Keep focus on the trigger rather than dropping it into whatever follows the unmounted menu.
        event.preventDefault();
        closeAndReturnFocus();
        break;
    }
  };

  return (
    <div
      {...rest}
      ref={rootRef}
      className={['relative', className].filter(Boolean).join(' ')}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={triggerClasses}
        onClick={() => {
          opensOn.current = 'current';
          onOpenChange(!open);
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="min-w-0 flex-1">
          <span className="sr-only">Current workspace:</span>{' '}
          <span className="block truncate text-sm font-semibold">
            {current.name}
          </span>
          {current.label ? (
            <>
              {' '}
              <span className="block truncate text-xs text-(color:--nova-chrome-ink-2)">
                {current.label}
              </span>
            </>
          ) : null}
        </span>
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 16 16"
          className="size-4 shrink-0 text-(color:--nova-chrome-ink-2) transition-transform group-aria-expanded:rotate-180"
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

      {open ? (
        <div className="nova-overlay absolute inset-x-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-lg p-1.5">
          {hint ? (
            <div id={hintId} className="px-3 pt-1.5 pb-1 text-xs text-ink-3">
              {hint}
            </div>
          ) : null}
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            aria-describedby={hint ? hintId : undefined}
            onKeyDown={onMenuKeyDown}
          >
            {groups.map((group, groupIndex) => {
              const labelId = `${menuId}-group-${groupIndex}`;
              return (
                <div key={group.label} role="group" aria-labelledby={labelId}>
                  <div
                    id={labelId}
                    className="px-3 pt-2.5 pb-1 text-[11px] font-bold tracking-wide text-ink-3 uppercase"
                  >
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const isCurrent = item.id === current.id;
                    return (
                      <div
                        key={item.id}
                        role="menuitemradio"
                        aria-checked={isCurrent}
                        aria-disabled={item.disabled ? true : undefined}
                        tabIndex={-1}
                        className={[
                          itemClasses,
                          isCurrent ? itemCurrentClasses : null,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => choose(item)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            choose(item);
                          }
                        }}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{item.name}</span>
                          {item.label ? (
                            <>
                              {' '}
                              <span className="block truncate text-xs font-normal text-ink-3">
                                {item.label}
                              </span>
                            </>
                          ) : null}
                        </span>
                        {isCurrent ? (
                          <svg
                            data-tick=""
                            aria-hidden="true"
                            focusable="false"
                            viewBox="0 0 16 16"
                            className="size-4 shrink-0"
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
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
