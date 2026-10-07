import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { PhoneFrame, type PhoneFrameProps } from './phone-frame';
import { WaThreadContext, type WaThreadAnnouncer } from './wa-message';

export * from './phone-frame';
// Everything a message is, but not the thread's own context (WaThreadContext stays internal).
export {
  WA_DELIVERY_STATUSES,
  WA_MESSAGE_LABELS,
  WaBilingualMessage,
  WaMessage,
  WaTypingIndicator,
  type WaBilingualMessageProps,
  type WaDeliveryStatus,
  type WaMessageLabels,
  type WaMessageProps,
  type WaThreadAnnouncer,
  type WaTypingIndicatorProps,
} from './wa-message';
export * from './wa-quick-reply-buttons';

// Which new messages the thread announces: the other side's (the default), every one, or none.
export type WaThreadAnnounce = 'in' | 'all' | 'none';

export interface WhatsAppThreadProps
  extends Omit<PhoneFrameProps, 'bodyProps' | 'bodyRef' | 'footer'> {
  // The conversation log's name. "WhatsApp conversation with <name>" by default.
  label?: string;
  announce?: WaThreadAnnounce;
  // Cap the chat's height and scroll it (a number is px). It grows with the chat without one, as
  // the prototype's phone does.
  maxBodyHeight?: number | string;
  // The messages: WaMessage, WaBilingualMessage, WaTypingIndicator, anything else.
  children?: ReactNode;
}

// A WhatsApp conversation in its phone (02-reception's booking and after-hours chats, 08-lab's Telugu
// report summary). The chat is a named log. Its own live announcements are off, because the log
// would read out every addition (this side's messages, the typing dots); instead a polite status
// region says each new incoming message ("Patient said: …") and any message that fails to send. The
// messages already there when it appears are not announced. It never sends anything: the messages are
// the caller's, and so is everything that happens when a reply is picked.
export function WhatsAppThread({
  name,
  label,
  announce = 'in',
  maxBodyHeight,
  children,
  ...rest
}: WhatsAppThreadProps) {
  const [said, setSaid] = useState({ text: '', count: 0 });
  const ready = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  // Children mount before their parent's effects run, so the messages on screen at first are heard
  // while this is still false and are not announced.
  useEffect(() => {
    ready.current = true;
    return () => {
      ready.current = false;
    };
  }, []);

  const announcer = useMemo<WaThreadAnnouncer>(() => {
    const say = (text: string) =>
      setSaid((last) => ({ text, count: last.count + 1 }));
    return {
      message: (direction, text) => {
        if (!ready.current || announce === 'none') return;
        if (announce === 'in' && direction !== 'in') return;
        say(text);
      },
      failure: (text) => {
        if (ready.current && announce !== 'none') say(text);
      },
    };
  }, [announce]);

  // Keep the newest message in view, unless the reader has scrolled back up.
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && atBottom.current) log.scrollTop = log.scrollHeight;
  });

  const scrolls = maxBodyHeight !== undefined;

  return (
    <WaThreadContext.Provider value={announcer}>
      <PhoneFrame
        name={name}
        bodyRef={logRef}
        bodyProps={{
          role: 'log',
          'aria-live': 'off',
          'aria-label': label ?? `WhatsApp conversation with ${name}`,
          // A scrolling log takes focus, so it can be scrolled from the keyboard.
          tabIndex: scrolls ? 0 : undefined,
          style: scrolls ? { maxHeight: maxBodyHeight } : undefined,
          className: scrolls ? 'overflow-y-auto' : undefined,
          onScroll: (event) => {
            const log = event.currentTarget;
            atBottom.current =
              log.scrollHeight - log.scrollTop - log.clientHeight < 24;
          },
        }}
        footer={
          <VisuallyHidden data-slot="announcer" role="status">
            {said.text ? <span key={said.count}>{said.text}</span> : null}
          </VisuallyHidden>
        }
        {...rest}
      >
        {children}
      </PhoneFrame>
    </WaThreadContext.Provider>
  );
}
