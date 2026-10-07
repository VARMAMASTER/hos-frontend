import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Surface } from '../../primitives/surface';
import { useControllableState } from '../../primitives/use-controllable-state';
import type { Size } from '../../primitives/types';
import { getTabbables, trapTab } from './focus';
import { inertOutside } from './inert';

export interface DialogProps {
  // Controlled when given: the dialog asks to close through onClose and the parent decides.
  open?: boolean;
  // Without `open` the dialog keeps its own state, starting at this.
  defaultOpen?: boolean;
  // Called for Escape and for the close button. The parent decides what closing means, which for a
  // form is the place to ask about unsaved changes.
  onClose?: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  // Styles the dialog panel (its width, for instance), not the scrim around it.
  className?: string;
  // The close button's accessible name. Translate it, or make it specific.
  closeLabel?: string;
  // 'alertdialog' is for a confirmation the user must answer by choosing an action (Discharge
  // patient?): assistive technology treats it as interrupting. The default is a plain dialog.
  role?: 'dialog' | 'alertdialog';
  // Leaves out the corner close button, so the way out is the dialog's own actions (and Escape).
  hideClose?: boolean;
  // The panel's width: 'md' for forms and content, 'sm' (280px) for a short confirmation.
  size?: DialogSize;
}

export type DialogSize = Size;

const sizes: Record<DialogSize, string> = {
  sm: 'max-w-dialog-sm',
  md: 'max-w-lg',
};

// The open dialogs, bottom to top. Only the top one answers the keyboard, so Escape closes one
// dialog at a time and a confirmation over a form does not take the form with it.
const openDialogs: object[] = [];

// The element a dialog portals into: the nearest themed root around where the Dialog is rendered (a
// NovaThemeProvider, or an element applyNovaTheme themed), so the open dialog keeps the hospital's
// theme and material; <body> when there is none, or when the theme is on the whole document.
function portalTarget(anchor: Element | null): Element {
  const themed = anchor?.closest('[data-nova-theme]');
  return themed &&
    themed !== document.documentElement &&
    themed !== document.body
    ? themed
    : document.body;
}

// A modal dialog. It is portalled to the nearest themed root (or <body>); it is labelled by its
// title; everything else on the page is made inert; Tab cycles inside it; Escape closes it; and
// focus goes back to whatever opened it.
export function Dialog({
  open,
  defaultOpen = false,
  onClose,
  ...rest
}: DialogProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: (next) => {
      if (!next) onClose?.();
    },
  });
  // A hidden marker where the Dialog sits in the tree, so the themed root around it can be found.
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [container, setContainer] = useState<Element | null>(null);
  useLayoutEffect(() => {
    setContainer(isOpen ? portalTarget(anchorRef.current) : null);
  }, [isOpen]);
  return (
    <>
      <span ref={anchorRef} hidden />
      {isOpen && container
        ? createPortal(
            <DialogLayer onClose={() => setOpen(false)} {...rest} />,
            container,
          )
        : null}
    </>
  );
}

function DialogLayer({
  onClose,
  title,
  description,
  footer,
  children,
  className,
  closeLabel = 'Close',
  role = 'dialog',
  hideClose = false,
  size = 'md',
}: Omit<DialogProps, 'open' | 'defaultOpen' | 'onClose'> & {
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const layerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  // Read while rendering, which is before anything inside can take focus (an autoFocus input does
  // at commit). It is where focus returns to.
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const layer = layerRef.current;
    const panel = panelRef.current;
    if (!layer || !panel) return undefined;

    const token = {};
    openDialogs.push(token);
    const releaseInert = inertOutside(layer);

    // Something inside may have taken focus already (autoFocus); otherwise start on the first
    // control of the content. The close button is chrome and is skipped, so a form opens on its
    // first field, and a confirmation on its first button.
    if (!panel.contains(document.activeElement)) {
      const [first] = getTabbables(panel).filter(
        (element) => element !== closeRef.current,
      );
      (first ?? panel).focus();
    }

    // On the document, not the panel: after a click on the scrim focus may be on <body>, and Escape
    // and Tab must still be answered.
    const onKeyDown = (event: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== token) return;
      if (event.key === 'Escape') {
        // Something inside (an open menu, a combobox) may have used this Escape already.
        if (event.defaultPrevented || event.isComposing) return;
        event.preventDefault();
        onCloseRef.current();
      } else if (event.key === 'Tab') {
        trapTab(event, panel);
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const index = openDialogs.indexOf(token);
      if (index !== -1) openDialogs.splice(index, 1);
      // Before restoring focus: the opener sits under the inert marks, and an inert element cannot
      // take focus.
      releaseInert();
      // If the app has put focus somewhere deliberate in the meantime, leave it there. Focus sitting
      // on <body> (the dialog's own focus was removed with it) or still inside the dialog is the case
      // to repair.
      const current = document.activeElement;
      const lost =
        current === null ||
        current === document.body ||
        layer.contains(current);
      if (lost && opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      }
    };
  }, [opener]);

  return (
    // The layer carries the typography itself, because a portal escapes the text styles of the app
    // root. data-nova-layer tells inertOutside this is a dialog layer that may stack.
    <div
      ref={layerRef}
      data-nova-layer=""
      className="fixed inset-0 z-50 flex items-center justify-center p-s6 font-sans text-ink"
    >
      {/* Cancelling mousedown stops a press on the scrim from moving focus to <body>. A click on it
          does not close the dialog: a stray click should not throw away what a clinician typed. */}
      <div
        aria-hidden="true"
        onMouseDown={(event) => event.preventDefault()}
        className="absolute inset-0 bg-ink/40 motion-safe:animate-fade-in"
      />
      <Surface
        ref={panelRef}
        material="overlay"
        radius="overlay"
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cx(
          'relative flex max-h-full w-full flex-col outline-none motion-safe:animate-dialog-in [--nova-overlay-lift:var(--nova-shadow-lg)]',
          sizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-s5 px-overlay pt-s6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-title font-semibold tracking-h2 text-ink"
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-s0 text-control text-ink-2">
                {description}
              </p>
            ) : null}
          </div>
          {/* .hos-x: the close square (size-close, 30px, the control corner), as a Toast's. */}
          {hideClose ? null : (
            <button
              ref={closeRef}
              type="button"
              aria-label={closeLabel}
              onClick={() => onClose()}
              className={cx(
                '-mr-s3 -mt-s1 inline-flex size-close shrink-0 items-center justify-center rounded-control text-ink-2 transition-colors hover:bg-surface-2',
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
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-overlay py-overlay text-body text-ink">
          {children}
        </div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-s3 border-t border-border px-overlay py-overlay-bar">
            {footer}
          </div>
        ) : null}
      </Surface>
    </div>
  );
}
