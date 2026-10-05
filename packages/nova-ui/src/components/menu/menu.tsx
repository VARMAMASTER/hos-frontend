import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

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

export interface MenuProps {
  trigger: ReactElement<MenuTriggerProps>;
  // The items: MenuItem elements.
  children: ReactNode;
  // Controlled: the menu asks through onOpenChange and the parent decides.
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Styles the wrapper around the trigger and the menu.
  className?: string;
}

const ITEMS = '[role="menuitem"]:not(:disabled):not([aria-disabled="true"])';

function enabledItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEMS)) : [];
}

function focusEdge(menu: HTMLElement | null, edge: 'first' | 'last') {
  const items = enabledItems(menu);
  const target = edge === 'last' ? items[items.length - 1] : items[0];
  // A menu with nothing enabled still takes focus, so Escape keeps working.
  (target ?? menu)?.focus();
}

// The WAI-ARIA menu button pattern. Items are native buttons, so Enter and Space activate them
// with no key handling here (adding some would risk firing twice). The menu is not portalled: it
// is positioned under the trigger and clipped by an ancestor with overflow:hidden.
export function Menu({
  trigger,
  children,
  open,
  onOpenChange,
  className,
}: MenuProps) {
  const menuId = useId();
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
    onOpenChange(false);
  }

  useEffect(() => {
    if (!open) return;
    focusEdge(menuRef.current, entryRef.current);
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
      onOpenChange(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [open, onOpenChange]);

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
      !(event.target instanceof Node) ||
      !menuRef.current?.contains(event.target)
    ) {
      return;
    }
    const items = enabledItems(menuRef.current);
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    switch (event.key) {
      case 'ArrowDown':
        next = items[(current + 1) % items.length];
        break;
      case 'ArrowUp':
        next = items[current <= 0 ? items.length - 1 : current - 1];
        break;
      case 'Home':
        next = items[0];
        break;
      case 'End':
        next = items[items.length - 1];
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
      event.target instanceof Element
        ? event.target.closest('[role="menuitem"]')
        : null;
    // A disabled item has no handler of its own (React drops it), but its click still bubbles here.
    if (item && !item.matches(':disabled, [aria-disabled="true"]')) {
      closeAndReturnFocus();
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={['relative inline-block', className]
        .filter(Boolean)
        .join(' ')}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        // Focus moving to another control closes the menu. Focus moving to nothing (a click on
        // the menu's padding, the window losing focus) is left to the outside-press listener.
        const next = event.relatedTarget;
        if (
          open &&
          next instanceof Node &&
          !wrapperRef.current?.contains(next)
        ) {
          onOpenChange(false);
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
          onOpenChange(!open);
        },
        onKeyDown: (event) => {
          trigger.props.onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          const edge = event.key === 'ArrowUp' ? 'last' : 'first';
          if (open) {
            focusEdge(menuRef.current, edge);
          } else {
            entryRef.current = edge;
            onOpenChange(true);
          }
        },
      })}
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          tabIndex={-1}
          onClick={handleMenuClick}
          className="nova-overlay absolute left-0 top-full z-40 mt-2 flex min-w-48 flex-col rounded-lg p-1.5 outline-none"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export type MenuItemProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'role' | 'type' | 'tabIndex'
>;

// A native button with role="menuitem". tabIndex is -1 on purpose: the menu moves focus with the
// arrow keys, and the items stay out of the page's Tab order.
export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  function MenuItem({ className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        className={[
          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink transition-colors',
          'hover:bg-primary-soft focus:bg-primary-soft',
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
        type="button"
        role="menuitem"
        tabIndex={-1}
      />
    );
  },
);
