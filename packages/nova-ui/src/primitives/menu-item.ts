import { cx } from './cx';
import { focusRing } from './focus-ring';

// One menu row (the prototype's .ws-item): 13px at 500 (text-control), the menu-item padding and gap
// (8px all round and between its parts), the control corner, the brand's soft fill on hover and on
// keyboard focus, and the shared focus ring. Menu's items, ModuleSwitcher's module rows and
// DataTable's Columns toggle all draw it, so a menu row looks the same wherever it appears. A row
// that is aria-disabled stays reachable and reads as unavailable.
export const menuItem = cx(
  'flex w-full items-center gap-menu-item rounded-control p-menu-item text-left text-control font-medium text-ink transition-colors',
  'hover:bg-primary-soft focus:bg-primary-soft',
  focusRing,
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
);
