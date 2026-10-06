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

// A bell button, the prototype's top bar icon button (hos.css .tb-ico with its .tb-dot badge). It is
// drawn for the dark chrome: a 7% white fill, a 14% white edge and 80% white ink, which is the
// on-primary colour the chrome surface already sets. The unread count is part of its accessible
// name, so a screen reader hears "Notifications, 3 unread"; the badge itself is hidden from
// assistive technology so it is not read twice. The count is text in the badge, so the unread state
// is never colour alone.
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
        // .tb-ico: 34px square, a 9px radius (--r-sm, the nearest step), the 16px glyph below.
        'relative inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-sm border border-on-primary/14 bg-on-primary/7 text-on-primary/80 transition-colors duration-150 hover:bg-on-primary/15 hover:text-on-primary',
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
        className="h-4 w-4"
      >
        <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      {unread > 0 ? (
        <span
          aria-hidden="true"
          // .tb-dot: 16px tall, crit, 9.5px bold white, a 2px ring, 3px past the corner. The ring is
          // the chrome's colour in the prototype (#221448); ink is the nearest dark token.
          className="absolute -right-[3px] -top-[3px] inline-flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-ink bg-crit px-0.5 text-[9.5px] font-bold text-on-primary"
        >
          {shown}
        </span>
      ) : null}
    </button>
  );
});
