import { cx } from './cx';

// The loading placeholder DataTable and ExtractedValuesReview draw in place of a row's cells. Bars
// take one of a few widths in turn, so a column of them reads as text still to come.
const BAR_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-1/3'];

// One placeholder bar. It pulses only where motion is welcome: motion-safe, so under reduced motion
// it is a still bar.
export function SkeletonBar({ index }: { index: number }) {
  return (
    <div
      data-skeleton=""
      className={cx(
        'h-s5 rounded-control bg-border motion-safe:animate-pulse',
        BAR_WIDTHS[index % BAR_WIDTHS.length],
      )}
    />
  );
}
