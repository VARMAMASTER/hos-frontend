import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { Button } from '../button/button';
import {
  ChatBubble,
  type ChatBubbleDirection,
  type ChatBubbleProps,
} from '../chat-bubble/chat-bubble';

// A message's delivery, as WhatsApp reports it. The prototype only draws ✓✓; the rest are modelled
// here, and each is a mark plus a word, never a tick alone.
export type WaDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export const WA_DELIVERY_STATUSES: readonly WaDeliveryStatus[] = [
  'pending',
  'sent',
  'delivered',
  'read',
  'failed',
];

// Every fixed word, so the thread can be read in Telugu, Hindi or English.
export interface WaMessageLabels {
  // The hidden prefix of each message, by who sent it.
  youSent: string;
  patientSaid: string;
  aiSent: string;
  // The visible speaker of an AI message.
  aiSpeaker: string;
  pending: string;
  sent: string;
  delivered: string;
  read: string;
  failed: string;
  retry: string;
}

export const WA_MESSAGE_LABELS: Readonly<WaMessageLabels> = {
  youSent: 'You sent',
  patientSaid: 'Patient said',
  aiSent: 'AI assistant sent',
  aiSpeaker: 'AI assistant',
  pending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Not sent',
  retry: 'Retry',
};

// How a WhatsAppThread hears about its messages, so it can announce the new ones. Outside a thread a
// message announces nothing.
export interface WaThreadAnnouncer {
  message: (direction: ChatBubbleDirection, text: string) => void;
  failure: (text: string) => void;
}

export const WaThreadContext = createContext<WaThreadAnnouncer | null>(null);

export interface WaMessageProps
  extends Omit<
    ChatBubbleProps,
    | 'palette'
    | 'delivery'
    | 'typing'
    | 'typingLabel'
    | 'critical'
    | 'criticalLabel'
    | 'tone'
    | 'contentId'
  > {
  // ai marks a message the hospital's AI assistant wrote, with the ✦ and a word.
  tone?: 'default' | 'ai';
  // Delivery, for a message this side sent.
  status?: WaDeliveryStatus;
  // Retry a failed message. Without it, a failed message says so and offers nothing.
  onRetry?: () => void;
  labels?: Partial<WaMessageLabels>;
}

const svg = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

const clock = (
  <svg {...svg} className="size-s4">
    <circle cx="10" cy="10" r="7.25" />
    <path d="M10 6v4.25l2.75 1.75" />
  </svg>
);

const alert = (
  <svg {...svg} className="size-icon-xs shrink-0">
    <circle cx="10" cy="10" r="7.25" />
    <path d="M10 6.5v4M10 13.5v.01" />
  </svg>
);

function Delivery({
  status,
  words,
}: {
  status: WaDeliveryStatus;
  words: WaMessageLabels;
}) {
  const marks: Record<WaDeliveryStatus, ReactNode> = {
    pending: (
      <>
        {clock}
        <VisuallyHidden>{words.pending}</VisuallyHidden>
      </>
    ),
    sent: (
      <>
        <span aria-hidden="true">✓</span>
        <VisuallyHidden>{words.sent}</VisuallyHidden>
      </>
    ),
    delivered: (
      <>
        <span aria-hidden="true">✓✓</span>
        <VisuallyHidden>{words.delivered}</VisuallyHidden>
      </>
    ),
    // Read is WhatsApp's blue ticks, and the word as well, so it is never told from delivered by
    // colour alone.
    read: (
      <>
        <span aria-hidden="true">✓✓</span>
        <span>{words.read}</span>
      </>
    ),
    // The words are under the bubble, with Retry.
    failed: alert,
  };
  return (
    <span
      data-slot="delivery"
      data-status={status}
      className={cx(
        'inline-flex items-center gap-s0',
        status === 'read' && 'font-semibold text-wa-accent',
        status === 'failed' && 'text-crit-deep',
      )}
    >
      {marks[status]}
    </span>
  );
}

// One WhatsApp message: a ChatBubble in WhatsApp's colours, with a hidden "You sent" or "Patient
// said" prefix, the time and the delivery marks. A failed message says "Not sent" under the bubble
// and offers Retry. Nothing here sends anything; Retry only calls onRetry.
export function WaMessage({
  direction = 'in',
  tone = 'default',
  status,
  onRetry,
  senderLabel,
  labels,
  children,
  ...rest
}: WaMessageProps) {
  const words: WaMessageLabels = { ...WA_MESSAGE_LABELS, ...labels };
  const announcer = useContext(WaThreadContext);
  const contentId = useId();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const previous = useRef(status);
  const prefix =
    senderLabel ??
    (tone === 'ai'
      ? words.aiSent
      : direction === 'out'
        ? words.youSent
        : words.patientSaid);

  // What was said, as a screen reader would hear it: the content, then the gloss.
  const said = () =>
    Array.from(
      bubbleRef.current?.querySelectorAll(
        '[data-slot="content"], [data-slot="gloss"]',
      ) ?? [],
    )
      .map((part) => part.textContent?.trim() ?? '')
      .filter((part) => part !== '')
      .join(' ');

  // A message that arrives after the thread is on screen is announced; the thread decides which.
  useEffect(() => {
    announcer?.message(direction, `${prefix}: ${said()}`);
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === 'failed' && previous.current !== 'failed') {
      announcer?.failure(`${words.failed}: ${said()}`);
    }
    previous.current = status;
    // Only when the delivery changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div data-wa-message="" className="flex flex-col gap-s1">
      <ChatBubble
        ref={bubbleRef}
        palette="whatsapp"
        direction={direction}
        tone={tone}
        aiLabel={words.aiSpeaker}
        senderLabel={prefix}
        contentId={contentId}
        delivery={
          status ? <Delivery status={status} words={words} /> : undefined
        }
        {...rest}
      >
        {children}
      </ChatBubble>
      {status === 'failed' ? (
        <p
          data-slot="failed"
          className={cx(
            'flex items-center gap-s2 text-caption font-semibold text-crit-deep',
            direction === 'out' ? 'self-end' : 'self-start',
          )}
        >
          {alert}
          {words.failed}
          {onRetry ? (
            <Button
              variant="ghost"
              size="sm"
              aria-describedby={contentId}
              onClick={() => onRetry()}
            >
              {words.retry}
            </Button>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export interface WaBilingualMessageProps
  extends Omit<WaMessageProps, 'lang' | 'contentLang' | 'gloss'> {
  // The native text's language (te, hi).
  lang: string;
  // The English (or other) gloss under it, and its language.
  gloss: ReactNode;
  glossLang?: string;
}

// A message in the patient's language with an English gloss under it, each with its own lang (the
// Telugu lab-report summary in 08-lab, .te-line and .te-eng).
export function WaBilingualMessage({
  lang,
  gloss,
  glossLang = 'en',
  ...rest
}: WaBilingualMessageProps) {
  return (
    <WaMessage
      contentLang={lang}
      gloss={gloss}
      glossLang={glossLang}
      {...rest}
    />
  );
}

export interface WaTypingIndicatorProps {
  // Whose side is typing.
  direction?: ChatBubbleDirection;
  // Who is typing, in words ("Padma Sree is typing"). "Typing…" by default.
  label?: string;
  className?: string;
}

// The other side is typing: three dots in a WhatsApp bubble (sim.css .wa-typing), bouncing only when
// motion is welcome, and the words for a screen reader.
export function WaTypingIndicator({
  direction = 'in',
  label = 'Typing…',
  className,
}: WaTypingIndicatorProps) {
  return (
    <ChatBubble
      palette="whatsapp"
      direction={direction}
      typing
      typingLabel={label}
      className={className}
    />
  );
}
