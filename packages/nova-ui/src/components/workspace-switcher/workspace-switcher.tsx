import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { Menu, MenuGroup, MenuItemRadio } from '../menu/menu';

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
  // Whether the menu is open. Give it with onOpenChange and the parent owns the state (controlled);
  // leave it off and the switcher keeps its own, starting from defaultOpen.
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  // A line at the top of the menu ("Switch workspace").
  hint?: ReactNode;
}

const triggerClasses =
  'group flex w-full items-center gap-3 rounded-md border border-primary-soft/25 bg-primary/20 ' +
  'px-3 py-2 text-left text-on-primary hover:bg-primary/30 aria-expanded:bg-primary/40';

// The workspace menu of the sidebar. It is Menu, with radio items in labelled groups: the keyboard,
// focus and dismissal behaviour is Menu's own, so the two can never disagree. The menu is an
// overlay surface, light even on the dark chrome, and resets the focus ring to the brand primary.
export function WorkspaceSwitcher({
  current,
  groups,
  onSelect,
  open,
  defaultOpen = false,
  onOpenChange,
  hint,
  className,
  ...rest
}: WorkspaceSwitcherProps) {
  return (
    <div {...rest} className={className}>
      <Menu
        fullWidth
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        header={hint}
        trigger={
          <button type="button" className={cx(triggerClasses, focusRing)}>
            <span className="min-w-0 flex-1">
              <VisuallyHidden>Current workspace:</VisuallyHidden>{' '}
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
        }
      >
        {groups.map((group) => (
          <MenuGroup key={group.label} label={group.label}>
            {group.items.map((item) => (
              <MenuItemRadio
                key={item.id}
                checked={item.id === current.id}
                disabled={item.disabled}
                description={item.label}
                onClick={() => onSelect(item.id)}
              >
                {item.name}
              </MenuItemRadio>
            ))}
          </MenuGroup>
        ))}
      </Menu>
    </div>
  );
}
