import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';

export interface NotificationBellProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'aria-label'
  > {
  // How many notifications are unread. Zero (or nothing) shows no badge.
  count?: number;
  // The button's name, and the start of the unread announcement. Translate it, or make it specific.
  label?: string;
  // The word after the count in the accessible name ("Notifications, 3 unread").
  unreadWord?: string;
}

// Past this the badge reads "99+": the exact figure belongs on the notifications list.
const BADGE_CAP = 99;

// A bell button. The unread count is part of its accessible name, so a screen reader hears
// "Notifications, 3 unread"; the badge itself is hidden from assistive technology so it is not read
// twice. The count is text in the badge, so the unread state is never colour alone.
export const NotificationBell = forwardRef<
  HTMLButtonElement,
  NotificationBellProps
>(function NotificationBell(
  {
    count = 0,
    label = 'Notifications',
    unreadWord = 'unread',
    type = 'button',
    className,
    ...rest
  },
  ref,
) {
  const unread = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const shown = unread > BADGE_CAP ? `${BADGE_CAP}+` : String(unread);
  return (
    <button
      ref={ref}
      type={type}
      aria-label={unread > 0 ? `${label}, ${shown} ${unreadWord}` : label}
      className={cx(
        'relative inline-flex h-11 w-11 items-center justify-center rounded-full text-primary-strong transition-colors hover:bg-primary-soft',
        focusRing,
        className,
      )}
      {...rest}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className="h-[22px] w-[22px]"
      >
        <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      {unread > 0 ? (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-crit px-1 text-micro font-semibold text-on-primary"
        >
          {shown}
        </span>
      ) : null}
    </button>
  );
});
