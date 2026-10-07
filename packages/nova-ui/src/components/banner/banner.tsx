import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import type { Tone } from '../../primitives/types';
import { HighlightMark } from '../chip/highlight-mark';

// highlight is an announcement ("New in this release"): emphasis, never a status.
export type BannerTone = Extract<
  Tone,
  'info' | 'good' | 'warn' | 'crit' | 'ai' | 'highlight'
>;

export interface BannerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  // Required, because it also decides how urgently the message is announced (see `roles`).
  tone: BannerTone;
  title: ReactNode;
  children?: ReactNode;
  // Typically a Button or link; rendered at the end of the banner.
  action?: ReactNode;
  // Shows a dismiss button when given. The parent decides what dismissing does.
  onDismiss?: () => void;
  // The dismiss button's accessible name. Make it specific, or translate it.
  dismissLabel?: string;
}

// The -soft fill with its -deep text is the pairing that stays accessible under every hospital
// theme. These are full class names on purpose: Tailwind finds classes by reading the source.
const tones: Record<BannerTone, string> = {
  info: 'bg-info-soft text-info-deep',
  good: 'bg-good-soft text-good-deep',
  warn: 'bg-warn-soft text-warn-deep',
  crit: 'bg-crit-soft text-crit-deep',
  ai: 'bg-ai-soft text-ai-deep',
  // The highlight wash under its deep ink, with the 1px highlight edge (positioned for its ring).
  highlight:
    'relative nova-highlight-wash nova-highlight-edge text-highlight-deep',
};

// Something wrong or about to go wrong interrupts a screen reader (alert); news and confirmations
// wait their turn (status).
const roles: Record<BannerTone, 'alert' | 'status'> = {
  crit: 'alert',
  warn: 'alert',
  info: 'status',
  good: 'status',
  ai: 'status',
  highlight: 'status',
};

export function Banner({
  tone,
  title,
  children,
  action,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
  ...rest
}: BannerProps) {
  return (
    <div
      role={roles[tone]}
      data-tone={tone}
      className={cx(
        // The prototype's .banner: 13px at 500, 10px by 16px, radius md, 10px between its parts.
        'flex items-center gap-s4 rounded-card px-row py-row-comfortable text-control font-medium',
        tones[tone],
        className,
      )}
      {...rest}
    >
      <ToneIcon tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children ? <div className="mt-s0">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
      {onDismiss ? (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={() => onDismiss()}
          className={cx(
            '-my-s1 -mr-s1 inline-flex size-s9 shrink-0 items-center justify-center rounded-card transition-colors hover:bg-surface/60',
            focusRing,
          )}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
            className="size-icon-md"
          >
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

// A different shape per tone (circle-i, circle-tick, triangle, octagon, the AI spark, the highlight
// star), so the tone never depends on colour alone.
function ToneIcon({ tone }: { tone: BannerTone }) {
  if (tone === 'highlight') return <HighlightMark className="size-icon-md" />;
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="size-icon-md shrink-0"
    >
      {tone === 'info' ? (
        <>
          <circle cx="10" cy="10" r="7.25" />
          <path d="M10 9v4.5M10 6.5h.01" />
        </>
      ) : null}
      {tone === 'good' ? (
        <>
          <circle cx="10" cy="10" r="7.25" />
          <path d="M6.75 10.25l2.25 2.25 4.25-4.75" />
        </>
      ) : null}
      {tone === 'warn' ? (
        <>
          <path d="M10 3.25l7.25 12.75H2.75z" />
          <path d="M10 8.5v3.5M10 14.25h.01" />
        </>
      ) : null}
      {tone === 'ai' ? (
        <path d="M10 2.5l1.9 5.6 5.6 1.9-5.6 1.9-1.9 5.6-1.9-5.6L2.5 10l5.6-1.9z" />
      ) : null}
      {tone === 'crit' ? (
        <>
          <path d="M7 2.75h6L17.25 7v6L13 17.25H7L2.75 13V7z" />
          <path d="M10 6.75v4M10 13.25h.01" />
        </>
      ) : null}
    </svg>
  );
}
