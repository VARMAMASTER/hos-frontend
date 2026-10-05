import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Surface } from '../../primitives/surface';
import { useControllableState } from '../../primitives/use-controllable-state';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  baseId: string;
  // The one tab that takes part in the page's Tab order.
  tabStop: string;
  register: (
    value: string,
    element: HTMLElement,
    disabled: boolean,
  ) => () => void;
}

interface RegisteredTab {
  element: HTMLElement;
  disabled: boolean;
}

// The selected tab is the tab stop, as long as it is an enabled tab of this set. Otherwise (nothing
// selected, the selected tab disabled, or a value naming no tab) the first enabled tab is, so the
// tablist can always be reached with Tab.
function pickTabStop(
  selected: string,
  tabs: ReadonlyMap<string, RegisteredTab>,
): string {
  const enabled = Array.from(tabs)
    .filter(([, tab]) => !tab.disabled)
    .sort(([, a], [, b]) =>
      a.element.compareDocumentPosition(b.element) &
      Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    )
    .map(([value]) => value);
  return enabled.includes(selected) ? selected : (enabled[0] ?? selected);
}

// Internal: the four parts share the selection through it, so callers only ever use the parts.
const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(part: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (context === null) {
    throw new Error(`<${part}> must be rendered inside <Tabs>.`);
  }
  return context;
}

// A tab's value may hold spaces or punctuation, which ids and aria-controls cannot, so it is encoded.
// The base id is per <Tabs>, so two tab sets with the same values never share an id.
function tabId(baseId: string, value: string): string {
  return `${baseId}-tab-${encodeURIComponent(value)}`;
}

function panelId(baseId: string, value: string): string {
  return `${baseId}-panel-${encodeURIComponent(value)}`;
}

export interface TabsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue'> {
  // Controlled when given: Tabs reports changes through onValueChange and shows `value`.
  value?: string;
  // Uncontrolled otherwise: Tabs keeps the selection itself, starting here. With neither, no tab is
  // selected until one is chosen.
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function Tabs({
  value,
  defaultValue = '',
  onValueChange,
  children,
  ...rest
}: TabsProps) {
  const baseId = useId();
  const [selected, select] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  // The tabs register themselves (element and disabled state), so the set knows which tab can be
  // the tab stop without the caller listing them twice.
  const tabs = useRef(new Map<string, RegisteredTab>());
  const [, setRegistrations] = useState(0);
  const register = useCallback(
    (tabValue: string, element: HTMLElement, disabled: boolean) => {
      tabs.current.set(tabValue, { element, disabled });
      setRegistrations((count) => count + 1);
      return () => {
        if (tabs.current.get(tabValue)?.element === element) {
          tabs.current.delete(tabValue);
        }
        setRegistrations((count) => count + 1);
      };
    },
    [],
  );
  const tabStop = pickTabStop(selected, tabs.current);
  return (
    <TabsContext
      value={{
        value: selected,
        onValueChange: select,
        baseId,
        tabStop,
        register,
      }}
    >
      <div {...rest}>{children}</div>
    </TabsContext>
  );
}

export type TabListProps = HTMLAttributes<HTMLDivElement>;

// The rail is a glass panel rather than a brand tint over the bare canvas: the unselected tabs'
// secondary ink is then text on a surface, which material.spec.ts proves at 4.5:1 for every brand.
export function TabList({ className, ...rest }: TabListProps) {
  // Fails fast outside <Tabs>, as its tabs would.
  useTabs('TabList');
  return (
    <Surface
      material="surface"
      radius="lg"
      {...rest}
      role="tablist"
      className={cx(
        'inline-flex max-w-full items-center gap-1 overflow-x-auto p-1',
        className,
      )}
    />
  );
}

export interface TabProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
}

// `isolate` keeps the selected chip (a Surface behind the label) inside the tab.
const tab =
  'relative isolate inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50';

const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

function nextIndex(key: string, current: number, last: number): number {
  switch (key) {
    case 'ArrowRight':
      return current === last ? 0 : current + 1;
    case 'ArrowLeft':
      return current === 0 ? last : current - 1;
    case 'Home':
      return 0;
    default:
      return last;
  }
}

export function Tab({
  value,
  className,
  children,
  onClick,
  onKeyDown,
  disabled = false,
  ...rest
}: TabProps) {
  const {
    value: selectedValue,
    onValueChange,
    baseId,
    tabStop,
    register,
  } = useTabs('Tab');
  const selected = value === selectedValue;
  const ref = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    return register(value, ref.current, disabled);
  }, [register, value, disabled]);

  // Arrow keys move between the enabled tabs of this tab's own list, Home and End jump to the ends,
  // and the tab that gets focus is activated (the automatic-activation tabs pattern).
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !NAVIGATION_KEYS.includes(event.key)) return;
    const list = event.currentTarget.closest('[role="tablist"]');
    if (list === null) return;
    const tabs = Array.from(
      list.querySelectorAll<HTMLElement>('[role="tab"]:not(:disabled)'),
    );
    const current = tabs.indexOf(event.currentTarget);
    if (current === -1) return;
    event.preventDefault();
    const target = tabs[nextIndex(event.key, current, tabs.length - 1)];
    if (target === event.currentTarget) return;
    target.focus();
    // Activation goes through the tab's own click handler, so there is one path that selects.
    target.click();
  }

  return (
    <button
      {...rest}
      ref={ref}
      disabled={disabled}
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={selected}
      // Only the selected panel is mounted, so only its tab may point at it.
      aria-controls={selected ? panelId(baseId, value) : undefined}
      tabIndex={value === tabStop ? 0 : -1}
      className={cx(
        tab,
        focusRing,
        selected ? 'text-ink' : 'text-ink-2 hover:text-ink',
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        onValueChange(value);
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Behind the label, not around it: the tab stays one stable element, so keyboard focus
          survives the selection moving. */}
      {selected ? (
        <Surface
          material="surface"
          radius="md"
          aria-hidden="true"
          className="absolute inset-0 -z-10"
        />
      ) : null}
      {children}
    </button>
  );
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabPanel({ value, className, ...rest }: TabPanelProps) {
  const { value: selectedValue, baseId } = useTabs('TabPanel');
  if (value !== selectedValue) return null;
  return (
    <div
      {...rest}
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      // A panel with no focusable content would otherwise be unreachable from the keyboard.
      tabIndex={0}
      className={cx('rounded-md', focusRing, className)}
    />
  );
}
