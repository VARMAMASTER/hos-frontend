import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { playMotion } from '../../primitives/motion';

export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastOptions {
  // How long the toast stays, in milliseconds. 0 keeps it until someone dismisses it. The timer
  // pauses while the pointer is over the toast or focus is inside it.
  duration?: number;
}

interface ToastItem {
  id: number;
  message: ReactNode;
  variant: ToastVariant;
  duration: number;
}

// How long a toast stays when nothing says otherwise.
export const TOAST_DURATION = 3500;

// A small store, so any code (an event handler, a mutation callback) can raise a toast without
// holding a reference to the Toaster. The Toaster is the one place they are drawn.
let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function publish(next: ToastItem[]) {
  toasts = next;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
const snapshot = () => toasts;

// Raises a toast and returns its id, for dismissToast. Use it for confirmations and recoverable
// errors; when the user must choose, use an AlertDialog instead.
export function showToast(
  message: ReactNode,
  variant: ToastVariant = 'info',
  options: ToastOptions = {},
): number {
  const id = nextId++;
  publish([
    ...toasts,
    { id, message, variant, duration: options.duration ?? TOAST_DURATION },
  ]);
  return id;
}

export function dismissToast(id: number): void {
  if (toasts.some((toast) => toast.id === id)) {
    publish(toasts.filter((toast) => toast.id !== id));
  }
}

export function clearToasts(): void {
  if (toasts.length > 0) publish([]);
}

// White callout text on near-black (info), on the brand primary (success) or on crit (error). The
// focus ring takes the text colour, because the default primary ring would vanish on the primary
// fill. The variant is also drawn as an icon shape, so it never depends on colour alone.
const variants: Record<ToastVariant, string> = {
  info: 'bg-ink text-bg',
  success: 'bg-primary text-on-primary',
  error: 'bg-crit text-on-primary',
};

export interface ToasterProps {
  // The dismiss button's accessible name. Translate it, or make it specific.
  dismissLabel?: string;
  className?: string;
}

// Mount once, near the root of the app. Two live regions sit in the page from the start (a region
// has to exist before its content changes for a screen reader to announce the change): info and
// success are announced politely, after the current speech; an error is announced assertively.
// aria-atomic is off, so a new toast is read on its own, not the whole stack again.
export function Toaster({
  dismissLabel = 'Dismiss notification',
  className,
}: ToasterProps) {
  const items = useSyncExternalStore(subscribe, snapshot, snapshot);
  const calm = items.filter((toast) => toast.variant !== 'error');
  const errors = items.filter((toast) => toast.variant === 'error');
  const region = 'flex w-full flex-col items-center gap-2';
  return (
    <div
      // Dialog leaves a live region alone when it makes the page inert, so toasts are still heard.
      data-nova-live-region=""
      className={cx(
        'pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 font-sans',
        className,
      )}
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className={region}
      >
        {calm.map((toast) => (
          <ToastView key={toast.id} toast={toast} dismissLabel={dismissLabel} />
        ))}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="false"
        className={region}
      >
        {errors.map((toast) => (
          <ToastView key={toast.id} toast={toast} dismissLabel={dismissLabel} />
        ))}
      </div>
    </div>
  );
}

function ToastView({
  toast,
  dismissLabel,
}: {
  toast: ToastItem;
  dismissLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  // The time left, so a pause resumes where it stopped and a toast is never cut short by hovering.
  const remaining = useRef(toast.duration);

  useEffect(() => {
    playMotion(
      ref.current,
      [
        { opacity: 0, transform: 'translateY(-8px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 200, easing: 'ease-out' },
    );
  }, []);

  useEffect(() => {
    if (paused || toast.duration <= 0) return undefined;
    const startedAt = Date.now();
    const timer = setTimeout(
      () => dismissToast(toast.id),
      Math.max(0, remaining.current),
    );
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused, toast.id, toast.duration]);

  return (
    // The click is a convenience for the pointer (tap to dismiss); the button is the way for a
    // keyboard and a screen reader.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      ref={ref}
      data-toast=""
      data-variant={toast.variant}
      onClick={() => dismissToast(toast.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
      className={cx(
        'pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg px-4 py-3 text-callout shadow-elevation-2 [--nova-focus-ring:currentColor]',
        variants[toast.variant],
      )}
    >
      <ToastIcon variant={toast.variant} />
      <div className="min-w-0 flex-1">{toast.message}</div>
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={(event) => {
          event.stopPropagation();
          dismissToast(toast.id);
        }}
        className={cx(
          '-mr-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-80',
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
          className="h-4 w-4"
        >
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
    </div>
  );
}

// A different shape per variant (circle-i, circle-tick, octagon), like Banner's.
function ToastIcon({ variant }: { variant: ToastVariant }) {
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
      className="h-5 w-5 shrink-0"
    >
      {variant === 'info' ? (
        <>
          <circle cx="10" cy="10" r="7.25" />
          <path d="M10 9v4.5M10 6.5h.01" />
        </>
      ) : null}
      {variant === 'success' ? (
        <>
          <circle cx="10" cy="10" r="7.25" />
          <path d="M6.75 10.25l2.25 2.25 4.25-4.75" />
        </>
      ) : null}
      {variant === 'error' ? (
        <>
          <path d="M7 2.75h6L17.25 7v6L13 17.25H7L2.75 13V7z" />
          <path d="M10 6.75v4M10 13.25h.01" />
        </>
      ) : null}
    </svg>
  );
}
