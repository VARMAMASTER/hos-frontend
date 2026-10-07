// The disabled treatments every interactive control takes, so "unavailable" looks the same on all of
// them (consistency.spec.ts checks no component writes its own). The focus ring is focusRing.

// A pressable control (a button, a segment, a chip, a tab) that is disabled: half opacity, and no
// pointer events, so it neither hovers nor presses.
export const disabledControl =
  'disabled:pointer-events-none disabled:opacity-50';

// A field (a text field, a select, a textarea, a search field) that is disabled: half opacity, and
// the not-allowed cursor, so the pointer still says why typing does nothing.
export const disabledField = 'disabled:cursor-not-allowed disabled:opacity-50';

// A control that is aria-disabled rather than disabled, because it must stay focusable and announced
// (a button whose reason is in its tooltip, a menu row a keyboard user can still reach): half opacity
// and the not-allowed cursor.
export const ariaDisabled =
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50';
