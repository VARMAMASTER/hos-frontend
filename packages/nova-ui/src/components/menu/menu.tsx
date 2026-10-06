import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Surface } from '../../primitives/surface';
import { useControllableState } from '../../primitives/use-controllable-state';

// What Menu adds to the trigger element. The trigger must be a single focusable element that
// accepts these (a Button, a native <button>); its own onClick and onKeyDown still run.
interface MenuTriggerProps {
  id?: string;
  'aria-haspopup'?: 'menu';
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

export interface MenuProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'children' | 'onKeyDown' | 'onBlur' | 'onChange'
  > {
  trigger: ReactElement<MenuTriggerProps>;
  // The items: MenuItem and MenuItemRadio elements, optionally inside MenuGroups.
  children: ReactNode;
  // Controlled when `open` is given: the menu asks through onOpenChange and the parent decides.
  // Without it the menu keeps its own state, starting at `defaultOpen`.
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  // A line above the items ("Switch workspace"). It sits outside role="menu", which may only hold
  // items and groups, and describes the menu.
  header?: ReactNode;
  // The menu spans the width of the wrapper (and the wrapper is a block), as a switcher in a
  // sidebar does. Otherwise it is at least 12rem wide and starts at the trigger's left edge.
  fullWidth?: boolean;
}

// Every kind of item. A natively disabled item cannot take focus, so it is skipped; an
// aria-disabled one stays reachable (WAI-ARIA: a disabled menu item is discoverable, not chosen).
const ITEMS =
  ':is([role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]):not(:disabled)';
const UNAVAILABLE = ':disabled, [aria-disabled="true"]';

function items(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEMS)) : [];
}

// The checked item first, so a screen reader announces the current choice as the menu opens;
// otherwise the first item, or the last for ArrowUp.
function focusEntry(menu: HTMLElement | null, edge: 'first' | 'last') {
  const all = items(menu);
  const target =
    edge === 'last'
      ? all[all.length - 1]
      : (all.find((el) => el.getAttribute('aria-checked') === 'true') ??
        all[0]);
  // A menu with no items still takes focus, so Escape keeps working.
  (target ?? menu)?.focus();
}

// The WAI-ARIA menu button pattern, and the one menu implementation in Nova: WorkspaceSwitcher and
// every other menu are built on it, so they share focus-on-open, the arrow keys, Home and End,
// Enter and Space, Escape, Tab, outside presses and disabled items.
//
// Items are native buttons. Enter and Space are handled here, for every kind of item, with the
// browser's own activation prevented, so an item fires exactly once. The menu is not portalled: it
// is positioned under the trigger and clipped by an ancestor with overflow:hidden.
export function Menu({
  trigger,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  header,
  fullWidth = false,
  className,
  ...rest
}: MenuProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const menuId = useId();
  const headerId = useId();
  const generatedTriggerId = useId();
  const triggerId = trigger.props.id ?? generatedTriggerId;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Which end of the menu to land on when it opens: ArrowUp from the trigger starts at the last.
  const entryRef = useRef<'first' | 'last'>('first');

  function focusTrigger() {
    document.getElementById(triggerId)?.focus();
  }

  // Closing from inside the menu hands focus back first, so it is never left on a removed element.
  function closeAndReturnFocus() {
    focusTrigger();
    setOpen(false);
  }

  // Runs only when `open` flips: a parent that re-renders the items while the menu is open never
  // snaps focus back to the entry item.
  useEffect(() => {
    if (!open) return;
    focusEntry(menuRef.current, entryRef.current);
    entryRef.current = 'first';
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        wrapperRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [open, setOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!open) return;

    if (event.key === 'Escape') {
      // Consumed: a dialog around the menu must not also close on this press.
      event.preventDefault();
      event.stopPropagation();
      closeAndReturnFocus();
      return;
    }

    if (event.key === 'Tab') {
      // Tabbing away closes the menu. Focus goes to the trigger first and the Tab itself is not
      // prevented, so it carries on from the trigger to whatever comes next (or before, with Shift).
      closeAndReturnFocus();
      return;
    }

    if (
      !(event.target instanceof HTMLElement) ||
      !menuRef.current?.contains(event.target)
    ) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      const item = event.target.closest<HTMLElement>(ITEMS);
      if (!item) return;
      // Prevented, so the browser does not also click the button: the item fires once, here.
      event.preventDefault();
      if (!item.matches(UNAVAILABLE)) item.click();
      return;
    }

    const all = items(menuRef.current);
    if (all.length === 0) return;
    const current = all.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    switch (event.key) {
      case 'ArrowDown':
        next = all[(current + 1) % all.length];
        break;
      case 'ArrowUp':
        next = all[current <= 0 ? all.length - 1 : current - 1];
        break;
      case 'Home':
        next = all[0];
        break;
      case 'End':
        next = all[all.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    next?.focus();
  }

  function handleMenuClick(event: MouseEvent<HTMLDivElement>) {
    // The item's own handler has already run (it is deeper), and it can keep the menu open by
    // calling event.preventDefault().
    if (event.defaultPrevented) return;
    const item =
      event.target instanceof Element ? event.target.closest(ITEMS) : null;
    if (item && !item.matches(UNAVAILABLE)) {
      closeAndReturnFocus();
    }
  }

  return (
    <div
      {...rest}
      ref={wrapperRef}
      className={cx(
        'relative',
        fullWidth ? 'block' : 'inline-block',
        className,
      )}
      onKeyDown={handleKeyDown}
      // Some browsers activate a button on the keyup of Space; the keydown above already did.
      onKeyUp={(event) => {
        if (
          event.key === ' ' &&
          menuRef.current?.contains(event.target as Node)
        ) {
          event.preventDefault();
        }
      }}
      onBlur={(event) => {
        // Focus moving to another control closes the menu. Focus moving to nothing (a click on
        // the menu's padding, the window losing focus) is left to the outside-press listener.
        const next = event.relatedTarget;
        if (
          open &&
          next instanceof Node &&
          !wrapperRef.current?.contains(next)
        ) {
          setOpen(false);
        }
      }}
    >
      {cloneElement(trigger, {
        id: triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: (event) => {
          trigger.props.onClick?.(event);
          if (event.defaultPrevented) return;
          entryRef.current = 'first';
          setOpen(!open);
        },
        onKeyDown: (event) => {
          trigger.props.onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          const edge = event.key === 'ArrowUp' ? 'last' : 'first';
          if (open) {
            focusEntry(menuRef.current, edge);
          } else {
            entryRef.current = edge;
            setOpen(true);
          }
        },
      })}
      {open ? (
        <Surface
          material="overlay"
          radius="lg"
          className={cx(
            'absolute top-full z-40 mt-2 max-h-[70vh] overflow-y-auto p-2',
            fullWidth ? 'inset-x-0' : 'left-0 min-w-48',
          )}
        >
          {header ? (
            <div
              id={headerId}
              className="px-3 pt-2 pb-1 text-caption text-ink-3"
            >
              {header}
            </div>
          ) : null}
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            aria-describedby={header ? headerId : undefined}
            tabIndex={-1}
            onClick={handleMenuClick}
            className="flex flex-col outline-none"
          >
            {children}
          </div>
        </Surface>
      ) : null}
    </div>
  );
}

export interface MenuGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  // Shown above the group's items, and its accessible name.
  label: ReactNode;
}

// A labelled run of items ("Hospitals", "Units").
export function MenuGroup({ label, children, ...rest }: MenuGroupProps) {
  const labelId = useId();
  return (
    <div {...rest} role="group" aria-labelledby={labelId}>
      <div
        id={labelId}
        className="px-3 pt-3 pb-1 text-micro font-bold tracking-wide text-ink-3 uppercase"
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export interface MenuItemProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'role' | 'type' | 'tabIndex'
  > {
  // A second line under the label ("Kukatpally", "60 beds").
  description?: ReactNode;
}

const item = cx(
  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-callout text-ink transition-colors',
  'hover:bg-primary-soft focus:bg-primary-soft',
  focusRing,
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
);

type ItemRole = 'menuitem' | 'menuitemradio';

// The one item element. A disabled item is aria-disabled, not disabled: it stays reachable by the
// arrow keys and is announced as unavailable, and a press on it does nothing. tabIndex is -1 on
// purpose: the menu moves focus with the arrow keys, and the items stay out of the Tab order.
const Item = forwardRef<
  HTMLButtonElement,
  MenuItemProps & {
    role: ItemRole;
    checked?: boolean;
    trailing?: ReactNode;
  }
>(function Item(
  {
    role,
    checked,
    trailing,
    description,
    disabled,
    onClick,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(item, className)}
      {...rest}
      type="button"
      role={role}
      tabIndex={-1}
      aria-checked={role === 'menuitemradio' ? Boolean(checked) : undefined}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
    >
      {description === undefined ? (
        children
      ) : (
        <span className="min-w-0 flex-1">
          <span className="block truncate">{children}</span>{' '}
          <span className="block truncate text-caption font-normal text-ink-3">
            {description}
          </span>
        </span>
      )}
      {trailing}
    </button>
  );
});

// A plain action ("Edit", "Archive").
export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  function MenuItem(props, ref) {
    return <Item ref={ref} role="menuitem" {...props} />;
  },
);

export interface MenuItemRadioProps extends MenuItemProps {
  // The current choice among its siblings.
  checked: boolean;
}

// One choice of several ("Krishna Hospital"). The checked item is ticked and set in bold as well as
// tinted, so the current choice never rests on colour alone.
export const MenuItemRadio = forwardRef<HTMLButtonElement, MenuItemRadioProps>(
  function MenuItemRadio({ checked, className, ...rest }, ref) {
    return (
      <Item
        ref={ref}
        role="menuitemradio"
        checked={checked}
        className={cx(
          checked && 'bg-primary-soft font-semibold text-primary-strong',
          className,
        )}
        trailing={
          checked ? (
            <svg
              data-tick=""
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 16 16"
              className="ml-auto size-4 shrink-0"
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
          ) : null
        }
        {...rest}
      />
    );
  },
);
