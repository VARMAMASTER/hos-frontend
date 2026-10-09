import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../primitives/cx';
import { SparkleCluster } from '../../primitives/ai-sparkle';
import { focusRing } from '../../primitives/focus-ring';
import { Surface } from '../../primitives/surface';
import { useControllableState } from '../../primitives/use-controllable-state';
import { MOTION_EASINGS } from '../../tokens/scale';
import { AiChatThread } from '../ai-chat-thread/ai-chat-thread';
import { ChatComposer } from '../ai-chat-thread/chat-composer';
import { useLoopMotion } from '../../primitives/use-motion';
import { useCopilotShortcut } from './use-copilot-shortcut';

// bottom-right: the corner orb, the panel above it. top: a pill for the app bar, the panel docked
// under it (the prototype's anchorPanel, so the answer appears beside the control that asked).
export type AiCopilotPlacement = 'bottom-right' | 'top';

export interface AiCopilotDockProps {
  // A question to answer, from the composer or a suggestion. The dock never fetches anything: the
  // caller answers, and renders the conversation as children.
  onAsk: (question: string) => void;
  // The conversation: ChatQuestion, AiThinking and ChatAnswer turns.
  children?: ReactNode;
  // Questions that fit the page the person is on, offered until the conversation starts.
  suggestions?: readonly string[];
  // HOS AI is answering: the composer is held, Stop shows, and Escape stops instead of closing.
  busy?: boolean;
  onStop?: () => void;
  // Controlled when given; uncontrolled otherwise, starting from defaultOpen.
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: AiCopilotPlacement;
  // The orb without its pill label from the start (it retracts after the first use anyway).
  compact?: boolean;
  // Listen for Ctrl/Cmd+K. On by default.
  shortcut?: boolean;
  headingLevel?: 2 | 3;
  // Styles the trigger's wrapper; panelClassName styles the panel.
  className?: string;
  panelClassName?: string;
  // Fixed words, all translatable.
  triggerLabel?: string;
  shortcutLabel?: string;
  title?: string;
  subtitle?: ReactNode;
  closeLabel?: string;
  emptyHint?: ReactNode;
  threadLabel?: string;
  suggestionsLabel?: string;
  composerLabel?: string;
  placeholder?: string;
  sendLabel?: string;
  stopLabel?: string;
}

// The nearest themed root around the dock (as Dialog does), so the portalled panel keeps the
// hospital's theme, material and scheme; <body> when there is none. A portal also keeps the fixed
// panel clear of the containing block the app bar's frosted glass would make of it.
function portalTarget(anchor: Element | null): Element {
  const themed = anchor?.closest('[data-nova-theme]');
  return themed &&
    themed !== document.documentElement &&
    themed !== document.body
    ? themed
    : document.body;
}

// The prototype's copilot orb motion (sim.css ai-breathe and ai-orbit): a halo breathing behind the
// orb every 2.8s, and a ring orbiting it every 3.4s, faster (1.1s) while the panel is open.
const BREATHE: Keyframe[] = [
  { opacity: 0.5, transform: 'scale(1)' },
  { opacity: 0.95, transform: 'scale(1.16)' },
  { opacity: 0.5, transform: 'scale(1)' },
];
const BREATHE_TIMING: KeyframeAnimationOptions = {
  duration: 2800,
  easing: MOTION_EASINGS.standard,
};
const ORBIT: Keyframe[] = [
  { transform: 'rotate(0turn)' },
  { transform: 'rotate(1turn)' },
];
const ORBIT_TIMING: KeyframeAnimationOptions = {
  duration: 3400,
  easing: 'linear',
};
const ORBIT_FAST: KeyframeAnimationOptions = {
  duration: 1100,
  easing: 'linear',
};

// The orb: the multicolour AI mark (the prototype's --ai-mark), 54px (48px on a phone), the ✦ in
// white, lifted on shadow-lg. Its halo and ring are decoration, and still under reduced motion.
function Orb({ expanded }: { expanded: boolean }) {
  const halo = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  useLoopMotion(halo, BREATHE, BREATHE_TIMING);
  useLoopMotion(ring, ORBIT, expanded ? ORBIT_FAST : ORBIT_TIMING);
  return (
    <span
      aria-hidden="true"
      data-orb=""
      className={cx(
        'nova-ai-hero-fill relative grid size-(--nova-copilot-orb) shrink-0 place-items-center rounded-full text-headline leading-none text-on-primary shadow-lg',
        'max-md:size-s10 max-md:text-title',
        'motion-safe:transition-transform motion-safe:duration-fast motion-safe:ease-spring motion-safe:group-hover:scale-110 motion-safe:group-active:scale-(--nova-copilot-press-scale)',
      )}
    >
      <span
        ref={halo}
        className="pointer-events-none absolute -inset-(--nova-copilot-orb-halo) -z-10 rounded-full bg-ai-bright/35 opacity-60"
      />
      <span
        ref={ring}
        className="pointer-events-none absolute -inset-(--nova-copilot-orb-ring) rounded-full border-emphasis border-transparent border-r-ai-bright/50 border-t-ai-bright"
      />
      <span className="relative flex items-center justify-center">
        <SparkleCluster size="md" className="text-ai-bright" />
      </span>
    </span>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className="size-icon-sm"
    >
      <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
    </svg>
  );
}

// The copilot: an always-reachable "Ask HOS AI" control and the panel it opens (the prototype's
// .hos-cop-dock, .hos-copilot-fab, .tb-ask and .hos-copilot). The panel is a non-modal dialog: it is
// labelled, it takes focus to its composer when it opens, Escape closes it (or stops an answer in
// progress first) and focus goes back to the trigger, but it never traps focus and never makes the
// page inert: it is a dock beside the work, not a modal over it. On a phone it is a bottom sheet.
export function AiCopilotDock({
  onAsk,
  children,
  suggestions,
  busy = false,
  onStop,
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-right',
  compact = false,
  shortcut = true,
  headingLevel = 2,
  className,
  panelClassName,
  triggerLabel = 'Ask HOS AI',
  shortcutLabel = 'Ctrl K',
  title = 'Ask HOS',
  subtitle = 'answers from your hospital’s live data',
  closeLabel = 'Close',
  emptyHint,
  threadLabel,
  suggestionsLabel,
  composerLabel,
  placeholder = 'Ask anything… e.g. today’s revenue',
  sendLabel,
  stopLabel,
}: AiCopilotDockProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  // The pill label retracts once the copilot has been used: by then the person knows the orb.
  const [used, setUsed] = useState(defaultOpen);
  const panelId = useId();
  const titleId = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const [position, setPosition] = useState({ top: 0, right: 8 });
  const wasOpen = useRef(isOpen);

  useLayoutEffect(() => {
    setContainer(portalTarget(anchor.current));
  }, []);

  // Opening moves focus to the composer; closing returns it to the trigger when it was in the panel
  // (a close from the caller included). A close from the trigger leaves focus where it is.
  useLayoutEffect(() => {
    if (isOpen && !wasOpen.current) {
      setUsed(true);
      composer.current?.focus();
    } else if (!isOpen && wasOpen.current) {
      if (panel.current?.contains(document.activeElement)) {
        trigger.current?.focus();
      }
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  // Docked under the app-bar pill: 8px below it, its right edge on the pill's, never closer than
  // 8px to the window's edge. Followed on resize.
  const place = useCallback(() => {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: Math.round(rect.bottom + 8),
      right: Math.max(8, Math.round(window.innerWidth - rect.right)),
    });
  }, []);
  useLayoutEffect(() => {
    if (!isOpen || placement !== 'top') return;
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [isOpen, placement, place]);

  useCopilotShortcut(
    () => {
      if (isOpen) composer.current?.focus();
      else setOpen(true);
    },
    { enabled: shortcut },
  );

  function ask(question: string) {
    onAsk(question);
    composer.current?.focus();
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (busy && onStop) onStop();
    else setOpen(false);
  }

  const retracted = compact || (placement === 'bottom-right' && used);
  const Heading = `h${headingLevel}` as const;
  const triggerProps = {
    ref: trigger,
    type: 'button' as const,
    'aria-expanded': isOpen,
    'aria-controls': panelId,
    'aria-keyshortcuts': 'Control+K Meta+K',
    'data-placement': placement,
    onClick: () => setOpen(!isOpen),
  };
  const label = <span>{triggerLabel}</span>;

  const dockedTrigger =
    placement === 'top' ? (
      // The prototype's .tb-ask: a pill in the app bar, the ✦ and the words, then the shortcut.
      <button
        {...triggerProps}
        className={cx(
          'relative inline-flex shrink-0 items-center gap-s3 whitespace-nowrap rounded-full border border-ai-bright/45 py-s3 pl-s3 pr-s4 text-body-sm font-semibold text-on-primary shadow-md hover:bg-ai-hover hover:nova-ai-glow focus-visible:nova-ai-glow',
          'nova-ai-hero-fill',
          'motion-safe:transition-all motion-safe:duration-fast motion-safe:ease-standard',
          focusRing,
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="relative flex items-center justify-center text-body leading-none"
        >
          <SparkleCluster size="sm" className="text-ai-bright" />
        </span>
        <span className={cx(retracted && 'sr-only')}>{label}</span>
        <kbd
          aria-hidden="true"
          className="rounded-control border border-on-primary/30 px-s2 font-mono text-overline font-normal"
        >
          {shortcutLabel}
        </kbd>
      </button>
    ) : (
      // The prototype's .hos-cop-dock: the labelled pill, then the orb, fixed in the corner. One
      // button, so one stop and one name; the pill retracts to a hidden label.
      <div
        data-copilot-dock=""
        className={cx(
          'fixed bottom-s8 right-s8 z-40 max-md:bottom-s7 max-md:right-s7',
          className,
        )}
      >
        <button
          {...triggerProps}
          className={cx(
            'group flex cursor-pointer items-center gap-s3 rounded-full',
            focusRing,
          )}
        >
          <span
            className={cx(
              'inline-flex items-center gap-s2 whitespace-nowrap rounded-full border border-ai-bright/40 bg-chrome-1 px-s4 py-s3 text-body-sm font-semibold text-chrome-ink shadow-md',
              'motion-safe:animate-fade-in max-md:sr-only',
              retracted && 'sr-only',
            )}
          >
            {label}
            <kbd
              aria-hidden="true"
              className="rounded-control border border-chrome-ink/20 px-s1 font-mono text-badge font-semibold"
            >
              {shortcutLabel}
            </kbd>
          </span>
          <Orb expanded={isOpen} />
        </button>
      </div>
    );

  const panelStyle =
    placement === 'top'
      ? ({
          '--copilot-top': `${position.top}px`,
          '--copilot-right': `${position.right}px`,
        } as CSSProperties)
      : undefined;

  const panelNode = (
    <Surface
      ref={panel}
      material="overlay"
      radius="overlay"
      id={panelId}
      role="dialog"
      aria-labelledby={titleId}
      hidden={!isOpen}
      data-placement={placement}
      style={panelStyle}
      onKeyDown={handlePanelKeyDown}
      className={cx(
        // The prototype's .hos-copilot: 408px wide at most (24px clear of a narrow window), as tall
        // as its conversation up to 560px, and inside the viewport.
        'fixed z-50 flex w-(--nova-copilot-panel-w) flex-col overflow-hidden font-sans text-ink',
        placement === 'bottom-right'
          ? 'bottom-(--nova-copilot-panel-bottom) right-s8 max-h-(--nova-copilot-panel-max-h)'
          : 'right-[var(--copilot-right)] top-[var(--copilot-top)] max-h-(--nova-copilot-panel-max-h-top)',
        // A phone: a bottom sheet, 8px in from the edges.
        'max-md:bottom-s3 max-md:left-s3 max-md:right-s3 max-md:top-auto max-md:w-auto max-md:max-h-(--nova-copilot-sheet-max-h)',
        'motion-safe:animate-dialog-in',
        panelClassName,
      )}
    >
      {/* The AI hairline along the top edge, so the panel is never mistaken for a generic chat. */}
      <div aria-hidden="true" className="h-s0 shrink-0 nova-ai-grad" />
      {/* .hcp-h: the spark, the title, the small print, and the close button. */}
      <div className="flex shrink-0 flex-wrap items-center gap-s3 border-b border-border bg-ai-ghost px-card py-card-bar">
        <span aria-hidden="true" className="nova-ai-spark">
          <SparkleCluster size="xs" className="text-on-primary" />
        </span>
        <Heading
          id={titleId}
          className="font-display text-body font-bold text-ink"
        >
          {title}
        </Heading>
        <span className="ml-auto text-label text-ink-2">{subtitle}</span>
        <button
          type="button"
          aria-label={closeLabel}
          onClick={() => setOpen(false)}
          className={cx(
            'inline-flex size-touch-sm shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink',
            focusRing,
          )}
        >
          <CloseIcon />
        </button>
      </div>
      <AiChatThread
        className="min-h-0 flex-1"
        logClassName="px-card pb-s3 pt-s4"
        busy={busy}
        onStop={onStop}
        suggestions={suggestions}
        onSuggestion={ask}
        suggestionsDisabled={busy}
        label={threadLabel}
        emptyHint={emptyHint}
        suggestionsLabel={suggestionsLabel}
      >
        {children}
      </AiChatThread>
      <ChatComposer
        ref={composer}
        className="shrink-0 border-t border-border px-card pb-card pt-s4"
        onSend={onAsk}
        busy={busy}
        onStop={onStop}
        label={composerLabel}
        placeholder={placeholder}
        sendLabel={sendLabel}
        stopLabel={stopLabel}
      />
    </Surface>
  );

  return (
    <>
      <span ref={anchor} hidden />
      {dockedTrigger}
      {container ? createPortal(panelNode, container) : null}
    </>
  );
}
