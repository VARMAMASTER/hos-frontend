import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { Button } from '../button/button';
import { AiStreamText } from './ai-stream-text';
import { FollowupChips } from './followup-chips';

// done: complete. streaming: still arriving. error: it failed (Retry is offered). stopped: the
// person stopped it, and what had arrived stays.
export type ChatAnswerStatus = 'streaming' | 'done' | 'error' | 'stopped';

export interface ChatAnswerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // Rich content (a table, a chart); takes the place of text and stream.
  children?: ReactNode;
  // The answer as markdown (the safe subset SafeMarkdown renders), final or set progressively.
  text?: string;
  // Or a stream: a whole string revealed word by word, or an async iterable of chunks.
  stream?: string | AsyncIterable<string>;
  // Given, it wins. Left out, a stream says for itself (streaming, then done or error) and text is
  // done.
  status?: ChatAnswerStatus;
  onComplete?: (text: string) => void;
  onStreamError?: (error: unknown) => void;
  // Follow-up questions, offered once the answer is done.
  followups?: readonly string[];
  onFollowup?: (question: string) => void;
  followupsDisabled?: boolean;
  followupsLabel?: string;
  // Where the answer came from (the prototype's .ai-src), inside the bubble under the text.
  source?: ReactNode;
  // Actions on the answer ("Add to note"): a slot, shown once the answer is no longer arriving.
  actions?: ReactNode;
  // A translation under the answer (an English gloss under Telugu), in its own language.
  gloss?: ReactNode;
  glossLang?: string;
  // The language of the answer itself.
  lang?: string;
  onRetry?: () => void;
  // Fixed words, all translatable.
  errorMessage?: ReactNode;
  retryLabel?: string;
  stoppedLabel?: string;
  label?: string;
  speakerLabel?: string;
  writingLabel?: string;
}

function ErrorIcon() {
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
      className="size-icon-sm shrink-0"
    >
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4.5M10 13.5h.01" />
    </svg>
  );
}

// HOS AI's turn: the prototype's .aichat-a. The ✦ spark, then the bubble (.aichat-a-body: the AI
// wash with the AI line, 13px ink, padded 8px by 12px, at most 88% wide). Nova adds a small visible
// "HOS AI" above the bubble, so the answer is marked in words as well as by the spark (AI is never
// colour-only), and a hidden "HOS AI answered:" for screen readers. The prototype tucks one corner
// to 3px; Nova's radius grammar has no per-corner radius, so all four are the md radius. The error
// and stopped states are Nova's own: the prototype has neither.
export function ChatAnswer({
  children,
  text,
  stream,
  status: statusProp,
  onComplete,
  onStreamError,
  followups,
  onFollowup,
  followupsDisabled,
  followupsLabel = 'Suggested follow-up questions',
  source,
  actions,
  gloss,
  glossLang = 'en',
  lang,
  onRetry,
  errorMessage = 'HOS AI could not answer that.',
  retryLabel = 'Retry',
  stoppedLabel = 'Stopped',
  label = 'HOS AI',
  speakerLabel = 'HOS AI answered',
  writingLabel,
  className,
  ...rest
}: ChatAnswerProps) {
  const [streamState, setStreamState] = useState<ChatAnswerStatus>('streaming');
  const status: ChatAnswerStatus =
    statusProp ?? (stream !== undefined ? streamState : 'done');

  let content: ReactNode = null;
  if (children !== undefined && children !== null) {
    content = children;
  } else if (stream !== undefined) {
    content = (
      <AiStreamText
        stream={stream}
        stopped={status === 'stopped'}
        lang={lang}
        writingLabel={writingLabel}
        onComplete={(final) => {
          setStreamState('done');
          onComplete?.(final);
        }}
        onError={(error) => {
          setStreamState('error');
          onStreamError?.(error);
        }}
      />
    );
  } else if (text !== undefined && text !== '') {
    content = (
      <AiStreamText
        text={text}
        streaming={status === 'streaming'}
        stopped={status === 'stopped'}
        lang={lang}
        writingLabel={writingLabel}
      />
    );
  }

  const settled = status === 'done';
  return (
    <div
      data-chat-turn="answer"
      data-status={status}
      className={cx('my-s2 flex items-start gap-s3', className)}
      {...rest}
    >
      <span aria-hidden="true" className="nova-ai-spark mt-s0">
        ✦
      </span>
      <div className="flex min-w-0 max-w-(--nova-ai-bubble-max-w) flex-col items-start gap-s2">
        <span
          aria-hidden="true"
          className="text-caption font-semibold text-ai-deep"
        >
          {label}
        </span>
        <VisuallyHidden>{`${speakerLabel}:`}</VisuallyHidden>
        {content !== null ? (
          <div className="min-w-0 max-w-full break-words rounded-card border border-ai-line bg-ai-ghost px-s5 py-s3 text-control text-ink">
            {content}
            {gloss ? (
              <p lang={glossLang} className="mt-s2 text-label text-ink-2">
                {gloss}
              </p>
            ) : null}
            {source ? (
              <div className="mt-s2 text-caption text-ai-deep">{source}</div>
            ) : null}
          </div>
        ) : null}
        {status === 'stopped' ? (
          <p className="inline-flex items-center gap-s2 text-label text-ink-2">
            <span
              aria-hidden="true"
              className="inline-block size-s3 bg-ink-2"
            />
            {stoppedLabel}
          </p>
        ) : null}
        {status === 'error' ? (
          <div className="flex flex-wrap items-center gap-s3 text-body-sm font-semibold text-crit-deep">
            <span className="inline-flex items-center gap-s2">
              <ErrorIcon />
              {errorMessage}
            </span>
            {onRetry ? (
              <Button size="sm" variant="ghost" onClick={onRetry}>
                {retryLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
        {actions && status !== 'streaming' ? (
          <div className="flex flex-wrap items-center gap-s3">{actions}</div>
        ) : null}
        {settled && followups && onFollowup ? (
          <FollowupChips
            questions={followups}
            onSelect={onFollowup}
            disabled={followupsDisabled}
            label={followupsLabel}
            className="mt-s0"
          />
        ) : null}
      </div>
    </div>
  );
}
