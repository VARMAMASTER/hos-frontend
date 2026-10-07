// Roving focus over a row of items (a tab list, a ButtonGroup's radios): the arrow keys step to the
// next or previous item and wrap at the ends, Home and End jump to the ends. A horizontal row reads
// Left and Right; a group that is also a radio group reads Up and Down too, as native radios do.
export const ROW_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'] as const;
export const RADIO_KEYS = [...ROW_KEYS, 'ArrowUp', 'ArrowDown'] as const;

// The index the key moves to, from `current` among items 0 … last. Call it only for a navigation key.
export function nextRovingIndex(
  key: string,
  current: number,
  last: number,
): number {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return current === last ? 0 : current + 1;
    case 'ArrowLeft':
    case 'ArrowUp':
      return current === 0 ? last : current - 1;
    case 'Home':
      return 0;
    default:
      return last;
  }
}
