import { useEffect, useRef, useState } from 'react';
import { useControllableState } from '../../primitives/use-controllable-state';

// Storage can throw (private windows, blocked site data, a full quota) or be missing (server
// rendering), and the sidebar must work without it. Only the word true or false is ever stored.
function readStored(key: string | undefined): boolean | undefined {
  if (!key) return undefined;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // Unavailable: fall back to the default.
  }
  return undefined;
}

function writeStored(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Unavailable: the state still lives in memory.
  }
}

export interface SidebarStateOptions {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  // A localStorage key the collapsed state is saved to and restored from.
  persistKey?: string;
}

// The collapsed state of a sidebar, controlled or not. Where it starts: the `collapsed` prop, else
// what persistKey saved, else defaultCollapsed, else expanded.
export function useSidebarState({
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  persistKey,
}: SidebarStateOptions) {
  const [initial] = useState(() => readStored(persistKey) ?? defaultCollapsed);
  const [value, set] = useControllableState({
    value: collapsed,
    defaultValue: initial,
    onChange: (next) => {
      if (persistKey) writeStored(persistKey, next);
      onCollapsedChange?.(next);
    },
  });
  return { collapsed: value, setCollapsed: set, toggle: () => set(!value) };
}

// Typing in a field must never toggle the sidebar.
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return (
    target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
    ) !== null
  );
}

// Ctrl+B (Cmd+B on a Mac) calls `handler`, except while the focus is in a text field. The handler
// may change on every render without the listener being re-attached.
export function useSidebarShortcut(enabled: boolean, handler: () => void) {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
        return;
      }
      if (event.key.toLowerCase() !== 'b') return;
      if (isEditable(event.target)) return;
      // Firefox opens its bookmarks sidebar on this chord.
      event.preventDefault();
      latest.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
