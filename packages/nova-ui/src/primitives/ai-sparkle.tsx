import { cx } from './cx';
import type { ExtendedSize } from './types';

export interface SparkleClusterProps {
  className?: string;
  size?: ExtendedSize;
}

const sizes: Record<ExtendedSize, string> = {
  xs: 'size-icon-xs',
  sm: 'size-icon-sm',
  md: 'size-icon-md',
  lg: 'size-icon-lg',
};

// The 3-star cluster: large radiant center star with two satellite twinkle stars.
// Used as the visual mark for AI throughout Nova UI components.
export function SparkleCluster({
  className,
  size = 'sm',
}: SparkleClusterProps) {
  return (
    <svg
      data-sparkle-cluster=""
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      className={cx(
        'shrink-0 inline-block text-ai-bright',
        sizes[size],
        className,
      )}
    >
      <path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        fill="currentColor"
        fillOpacity="0.25"
      />
      <path
        d="M5 4L5.8 6.2L8 7L5.8 7.8L5 10L4.2 7.8L2 7L4.2 6.2L5 4Z"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.25"
      />
      <path
        d="M6 16L6.6 17.4L8 18L6.6 18.6L6 20L5.4 18.6L4 18L5.4 17.4L6 16Z"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.25"
      />
    </svg>
  );
}
