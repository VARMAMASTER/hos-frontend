import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react';
import { cx } from '../../primitives/cx';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { SafeMarkdown } from './safe-markdown';
import { useLoopMotion, useMotionAllowed } from './use-ai-motion';

// Where the text stands: arriving, complete, stopped by the person, or cut off by an error.
export type AiStreamPhase = 'streaming' | 'done' | 'stopped' | 'error';

export interface AiStreamTextProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // The answer: a whole string (revealed a few words at a time, as the prototype's aiStreamHTML
  // does) or an async iterable of chunks (a model's token stream), consumed as they arrive.
  stream?: string | AsyncIterable<string>;
  // Or the caller sets the text progressively and says whether more is coming.
  text?: string;
  streaming?: boolean;
  // Stop where it is: an async stream is closed (its iterator's return() is called), a string stops
  // revealing, and what has arrived is shown as the final text.
  stopped?: boolean;
  // Milliseconds between reveals of a string stream (about two words each).
  revealIntervalMs?: number;
  onComplete?: (text: string) => void;
  onError?: (error: unknown) => void;
  // Said to assistive technology while the text arrives, in place of the partial text. Translatable.
  writingLabel?: string;
  // The language of the answer (te, hi, en …).
  lang?: string;
}

interface Consumer {
  stream: AsyncIterable<string>;
  stop(): void;
}

// Reads an async stream to its end, once, whatever React does with the component meanwhile.
function consume(
  stream: AsyncIterable<string>,
  on: {
    chunk(text: string): void;
    done(text: string): void;
    error(error: unknown): void;
  },
): Consumer {
  let stopped = false;
  const iterator = stream[Symbol.asyncIterator]();
  let text = '';
  void (async () => {
    try {
      for (;;) {
        const step = await iterator.next();
        if (stopped) return;
        if (step.done) {
          on.done(text);
          return;
        }
        text += step.value;
        on.chunk(text);
      }
    } catch (error) {
      if (!stopped) on.error(error);
    }
  })();
  return {
    stream,
    stop() {
      if (stopped) return;
      stopped = true;
      void Promise.resolve(iterator.return?.()).catch(() => undefined);
    },
  };
}

// The index just past the next `words` words of `text` from `at`.
function advance(text: string, at: number, words: number): number {
  let next = at;
  for (let n = 0; n < words && next < text.length; n++) {
    const space = text.indexOf(' ', next + 1);
    next = space === -1 ? text.length : space + 1;
  }
  return next;
}

// The prototype's .ai-cursor: a ▍ in the AI colour, blinking once a second (steps, not a fade).
const BLINK: Keyframe[] = [
  { opacity: 1 },
  { opacity: 1, offset: 0.5 },
  { opacity: 0, offset: 0.5 },
  { opacity: 0 },
];
const BLINK_TIMING: KeyframeAnimationOptions = { duration: 1000 };

function Caret() {
  const ref = useRef<HTMLSpanElement>(null);
  useLoopMotion(ref, BLINK, BLINK_TIMING);
  return (
    <span ref={ref} data-caret="" className="ml-px font-normal text-ai">
      ▍
    </span>
  );
}

// Text that streams in. While it arrives, the partial text is hidden from assistive technology and
// one short status ("HOS AI is writing…") is there instead, so a screen reader never reads the
// answer word by word; when it completes, the whole answer is mounted as a new node, which the
// conversation's polite log announces once. The caret shows only when motion is welcome. Under
// reduced motion nothing animates in: a string renders whole at once, and an async stream's chunks
// show as they arrive (a long answer is never invisible until it ends), without a caret or pacing.
// Nothing here logs or stores the text.
export function AiStreamText({
  stream,
  text,
  streaming = false,
  stopped = false,
  revealIntervalMs = 60,
  onComplete,
  onError,
  writingLabel = 'HOS AI is writing…',
  lang,
  className,
  ...rest
}: AiStreamTextProps) {
  const motion = useMotionAllowed();
  const motionRef = useRef(motion);
  const callbacks = useRef({ onComplete, onError });
  useLayoutEffect(() => {
    motionRef.current = motion;
    callbacks.current = { onComplete, onError };
  });

  const [shown, setShown] = useState(() =>
    typeof stream === 'string' && !motion ? stream : '',
  );
  const [phase, setPhase] = useState<AiStreamPhase>('streaming');
  const received = useRef('');
  const completedFor = useRef<unknown>(null);
  const consumer = useRef<Consumer | null>(null);
  const pendingStop = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // A string stream: revealed word by word, or whole under reduced motion.
  useEffect(() => {
    if (typeof stream !== 'string') return;
    const complete = () => {
      setPhase('done');
      if (completedFor.current === stream) return;
      completedFor.current = stream;
      callbacks.current.onComplete?.(stream);
    };
    if (stopped) {
      setShown(received.current);
      setPhase((current) => (current === 'done' ? current : 'stopped'));
      return;
    }
    if (!motionRef.current) {
      received.current = stream;
      setShown(stream);
      complete();
      return;
    }
    let at = 0;
    received.current = '';
    setShown('');
    setPhase('streaming');
    const timer = setInterval(() => {
      at = advance(stream, at, 2);
      received.current = stream.slice(0, at);
      setShown(received.current);
      if (at >= stream.length) {
        clearInterval(timer);
        complete();
      }
    }, revealIntervalMs);
    return () => clearInterval(timer);
  }, [stream, stopped, revealIntervalMs]);

  // An async stream: read once to the end. The read outlives a StrictMode re-run of this effect
  // (closing the iterator is deferred a tick, and a re-run cancels that), so no chunk is dropped.
  useEffect(() => {
    if (stream === undefined || typeof stream === 'string') return;
    clearTimeout(pendingStop.current);
    if (stopped) {
      consumer.current?.stop();
      setShown(received.current);
      setPhase((current) => (current === 'streaming' ? 'stopped' : current));
      return;
    }
    if (consumer.current?.stream !== stream) {
      consumer.current?.stop();
      received.current = '';
      setShown('');
      setPhase('streaming');
      consumer.current = consume(stream, {
        chunk(next) {
          received.current = next;
          setShown(next);
        },
        done(final) {
          setShown(final);
          setPhase('done');
          callbacks.current.onComplete?.(final);
        },
        error(error) {
          setShown(received.current);
          setPhase('error');
          callbacks.current.onError?.(error);
        },
      });
    }
    const current = consumer.current;
    return () => {
      pendingStop.current = setTimeout(() => current?.stop(), 0);
    };
  }, [stream, stopped]);

  // Text the caller sets: it is streaming while they say so.
  const controlled = stream === undefined;
  const value = controlled ? (text ?? '') : shown;
  const state: AiStreamPhase = controlled
    ? streaming && !stopped
      ? 'streaming'
      : stopped
        ? 'stopped'
        : 'done'
    : phase;

  if (state === 'streaming') {
    return (
      <div className={className} {...rest}>
        <div key="streaming" aria-hidden="true" lang={lang}>
          <SafeMarkdown
            text={value}
            partial
            tail={motion ? <Caret /> : undefined}
          />
        </div>
        <VisuallyHidden>{writingLabel}</VisuallyHidden>
      </div>
    );
  }

  return (
    <div className={className} data-phase={state} {...rest}>
      <SafeMarkdown key="final" text={value.trimEnd()} lang={lang} />
    </div>
  );
}
