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

// The prototype's .hos-toast (assets/sim.css): a panel with a 1px line border and a 3px coloured left
// edge, and a small coloured tile holding a white glyph. The default toast is the brand (the
// prototype's teal), good is green; an error takes crit (the prototype's .warn toast carries its
// crit items). The variant is also drawn as a glyph shape, so it never depends on colour alone.
const variants: Record<ToastVariant, { edge: string; tile: string }> = {
  info: { edge: 'border-l-primary', tile: 'bg-primary' },
  success: { edge: 'border-l-good', tile: 'bg-good' },
  error: { edge: 'border-l-crit', tile: 'bg-crit' },
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
  // empty:-mt-2 takes back the host's gap for a region with nothing in it, so a lone toast sits
  // exactly 20px from the corner. The regions stay in the page (and the accessibility tree) either way.
  const region = 'flex w-full flex-col gap-2 empty:-mt-2';
  return (
    <div
      // Dialog leaves a live region alone when it makes the page inert, so toasts are still heard.
      data-nova-live-region=""
      className={cx(
        // .hos-toasts: fixed 20px from the bottom right corner, as wide as its widest toast up to 360px,
        // an 8px gap.
        'pointer-events-none fixed bottom-5 right-5 z-[60] flex w-max max-w-[min(360px,calc(100vw-40px))] flex-col gap-2 font-sans',
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
        // sim.css @keyframes toast-in: .28s cubic-bezier(.2,.8,.2,1).
        { opacity: 0, transform: 'translateY(10px) scale(.98)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 280, easing: 'cubic-bezier(.2, .8, .2, 1)' },
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
        // .hos-toast: 13px, --r-md, 12px 16px padding, an 8px gap, a 1px line border, --shadow-md. The
        // 3px left edge takes the variant colour; border-l-[3px] is the prototype's own value.
        'pointer-events-auto flex w-full items-start gap-2 rounded-md border border-l-[3px] border-border bg-surface px-4 py-3 text-[13px] text-ink shadow-md',
        variants[toast.variant].edge,
      )}
    >
      <ToastIcon variant={toast.variant} />
      <div className="min-w-0 flex-1 font-semibold">{toast.message}</div>
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={(event) => {
          event.stopPropagation();
          dismissToast(toast.id);
        }}
        className={cx(
          // .hos-x: a 30px square, --r-sm, line border on --panel-2, ink-2; hover fills with the line.
          '-my-1 inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center self-center rounded-sm border border-border bg-surface-2 text-ink-2 transition-colors hover:bg-border',
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

// .ht-ic: a 20px tile in the variant colour with a white glyph. A different glyph per variant (an
// i, a tick, a !), like Banner's, so the variant never rests on colour alone. The tile's radius is
// --r-sm (8px); the prototype's 6px is not on the radius scale.
function ToastIcon({ variant }: { variant: ToastVariant }) {
  return (
    <span
      className={cx(
        'mt-px grid h-5 w-5 shrink-0 place-items-center rounded-sm text-on-primary',
        variants[variant].tile,
      )}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className="h-3.5 w-3.5"
      >
        {variant === 'info' ? <path d="M10 9v5M10 5.75h.01" /> : null}
        {variant === 'success' ? <path d="M4.5 10.5l3.5 3.5 7.5-8" /> : null}
        {variant === 'error' ? <path d="M10 5v6M10 14.5h.01" /> : null}
      </svg>
    </span>
  );
}
