import {
  Children,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Button } from '../button/button';
import { FollowupChips } from './followup-chips';

export interface AiChatThreadProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // The turns: ChatQuestion, ChatAnswer and AiThinking, in order.
  children?: ReactNode;
  // HOS AI is answering: the log is aria-busy (it holds its announcements until the answer is
  // complete) and Escape anywhere in the thread calls onStop.
  busy?: boolean;
  onStop?: () => void;
  // Shown while there is no conversation yet: a hint line and suggested questions.
  suggestions?: readonly string[];
  onSuggestion?: (question: string) => void;
  suggestionsDisabled?: boolean;
  // Classes for the scrolling log itself (its padding); className styles the outer frame.
  logClassName?: string;
  // Fixed words, all translatable.
  label?: string;
  emptyHint?: ReactNode;
  suggestionsLabel?: string;
  jumpLabel?: string;
}

// How close to the end counts as "at the bottom", in pixels: a reader a few pixels short of the
// end is still following along.
const AT_BOTTOM = 24;

function DownArrow() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="size-icon-sm"
    >
      <path d="M10 4v12M5 11l5 5 5-5" />
    </svg>
  );
}

// The conversation's scroll area: the prototype's .hcp-chat / #hmChat, a column of turns. It is a
// polite log with a name, so new turns are announced (an answer once, when it completes: see
// AiStreamText), and it is a keyboard stop so it can be scrolled without a pointer. It follows new
// messages only while the reader is at the bottom; scrolled up, it stays put and offers "Jump to
// latest". It holds no message content of its own and never logs or stores any.
export function AiChatThread({
  children,
  busy = false,
  onStop,
  suggestions,
  onSuggestion,
  suggestionsDisabled,
  logClassName,
  label = 'Conversation with HOS AI',
  emptyHint = 'Try one of these, or type your own question:',
  suggestionsLabel = 'Suggested questions',
  jumpLabel = 'Jump to latest',
  className,
  onKeyDown,
  ...rest
}: AiChatThreadProps) {
  const log = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const empty = Children.toArray(children).length === 0;

  // New content (a turn, or a streamed word) scrolls into view only while the reader is following.
  useEffect(() => {
    const element = log.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      if (following.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, []);

  function handleScroll() {
    const element = log.current;
    if (!element) return;
    const bottom =
      element.scrollHeight - element.scrollTop - element.clientHeight <=
      AT_BOTTOM;
    following.current = bottom;
    setAtBottom(bottom);
  }

  function jumpToLatest() {
    const element = log.current;
    if (!element) return;
    following.current = true;
    element.scrollTop = element.scrollHeight;
    setAtBottom(true);
    // The button goes away with the jump: focus moves to the conversation it jumped through.
    element.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Escape' && busy && onStop) {
      event.preventDefault();
      onStop();
    }
  }

  return (
    <div
      className={cx('relative flex min-h-0 flex-col', className)}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <div
        ref={log}
        role="log"
        aria-live="polite"
        aria-label={label}
        aria-busy={busy || undefined}
        tabIndex={0}
        onScroll={handleScroll}
        className={cx(
          'flex min-h-0 flex-1 flex-col overflow-y-auto rounded-control',
          focusRing,
          logClassName,
        )}
      >
        {empty ? (
          <div className="flex flex-col gap-s3">
            {/* The prototype's .hcp-hint: 12.5px in the secondary ink. */}
            <p className="py-s2 text-body-sm text-ink-2">{emptyHint}</p>
            {suggestions && onSuggestion ? (
              <FollowupChips
                questions={suggestions}
                onSelect={onSuggestion}
                disabled={suggestionsDisabled}
                label={suggestionsLabel}
              />
            ) : null}
          </div>
        ) : (
          children
        )}
      </div>
      {atBottom ? null : (
        <div className="pointer-events-none absolute inset-x-0 bottom-s3 flex justify-center">
          <Button
            size="sm"
            variant="ghost"
            onClick={jumpToLatest}
            className="pointer-events-auto shadow-md"
          >
            <DownArrow />
            {jumpLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
