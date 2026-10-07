import {
  forwardRef,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { motionAllowed } from '../../primitives/motion';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { MOTION_DURATIONS_MS, MOTION_EASINGS } from '../../tokens/scale';

// Which side of the conversation: in (the other party, on the left) or out (this side, on the right).
export type ChatBubbleDirection = 'in' | 'out';
// Not a status Tone: who is speaking. default is a message; ai is a message a machine wrote (marked
// with the ✦ and a word); system is an event between messages ("Call ended · 2:12"), drawn as a
// centred pill rather than a bubble.
export type ChatBubbleTone = 'default' | 'ai' | 'system';
// nova is the product's own colours (the call transcript); whatsapp is WhatsApp's brand, from the
// --nova-wa-* tokens, for a thread drawn as the patient sees it.
export type ChatBubblePalette = 'nova' | 'whatsapp';

export interface ChatBubbleProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  direction?: ChatBubbleDirection;
  tone?: ChatBubbleTone;
  palette?: ChatBubblePalette;
  // What was said. Text is the caller's, in whatever language it was said.
  children?: ReactNode;
  // The language of the content (te, hi, en), set on the content only.
  contentLang?: string;
  // An id for the content, so a control elsewhere can be described by what was said.
  contentId?: string;
  // Who said it, shown above the content ("K. Yadamma · patient"). An AI bubble always shows one.
  speaker?: ReactNode;
  // The AI bubble's word when no speaker is given.
  aiLabel?: string;
  // A translation under the content: the English of a Telugu message.
  gloss?: ReactNode;
  glossLang?: string;
  // The time stamp ("09:24 AM", or "0:28" into a call) and its machine-readable form.
  time?: ReactNode;
  dateTime?: string;
  // After the time: delivery ticks, for a message that was sent.
  delivery?: ReactNode;
  // A prefix read before the content and not shown ("You sent", "Patient said"). When it is given,
  // the visible speaker is hidden from assistive technology, so it is not read twice.
  senderLabel?: string;
  // Under the content: interactive replies, a link to a report.
  actions?: ReactNode;
  // The other side is writing (or speaking): three dots, and typingLabel in words.
  typing?: boolean;
  typingLabel?: string;
  // A system event that needs attention (an escalation): an icon and criticalLabel, in the crit tone.
  critical?: boolean;
  criticalLabel?: string;
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

// The prototype's .wa-msg, .wa-in and .wa-out (hos.css), and their call-transcript retint (.call-b
// in 02-reception.html): white incoming bubbles, the brand's soft tint outgoing.
const fills: Record<ChatBubblePalette, Record<ChatBubbleDirection, string>> = {
  nova: { in: 'bg-surface text-ink', out: 'bg-primary-soft text-ink' },
  whatsapp: { in: 'bg-wa-in text-wa-ink', out: 'bg-wa-out text-wa-ink' },
};

// The secondary ink of a bubble: the speaker, the gloss and the time.
const quiet: Record<ChatBubblePalette, { speaker: string; gloss: string }> = {
  nova: { speaker: 'text-ink-3', gloss: 'text-ink-2 italic' },
  whatsapp: { speaker: 'text-wa-ink-2', gloss: 'text-wa-ink-2' },
};

const dotFill: Record<ChatBubblePalette, string> = {
  nova: 'bg-ink-3',
  whatsapp: 'bg-wa-dot',
};

// The prototype's typing dots (sim.css .wa-typing, @keyframes thinking): each fades up and lifts 3px
// and settles, 1.2s round, the second and third a beat behind. Played through the Web Animations API
// only when motion is welcome, so reduced motion leaves three still dots and the words.
const DOT_CYCLE_MS = MOTION_DURATIONS_MS.slow * 5;
const DOT_STAGGER_MS = MOTION_DURATIONS_MS.slow * 0.75;
const DOT_KEYFRAMES: Keyframe[] = [
  { opacity: 0.25, transform: 'translateY(0)' },
  { opacity: 1, transform: 'translateY(calc(var(--nova-typing-hop) * -1))' },
  { opacity: 0.25, transform: 'translateY(0)' },
];

function TypingDots({ palette }: { palette: ChatBubblePalette }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const dots = ref.current;
    if (!dots || !motionAllowed()) return undefined;
    const animations = Array.from(dots.children).flatMap((dot, index) =>
      typeof dot.animate === 'function'
        ? [
            dot.animate(DOT_KEYFRAMES, {
              duration: DOT_CYCLE_MS,
              delay: index * DOT_STAGGER_MS,
              iterations: Infinity,
              easing: MOTION_EASINGS.standard,
            }),
          ]
        : [],
    );
    return () => {
      for (const animation of animations) animation?.cancel?.();
    };
  }, []);
  return (
    <span
      ref={ref}
      data-slot="dots"
      aria-hidden="true"
      className="inline-flex items-center gap-s1 py-s1"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={cx('size-s2 rounded-full', dotFill[palette])}
        />
      ))}
    </span>
  );
}

// One message in a conversation, the shared bubble of the WhatsApp thread and the call transcript
// (the prototype reuses .wa-msg for both). It carries what was said, who said it (a speaker line, and
// a hidden sender prefix for a screen reader), a translation, a time stamp and a delivery slot. A
// system tone draws the .call-sys pill instead; typing draws the three dots.
export const ChatBubble = forwardRef<HTMLDivElement, ChatBubbleProps>(
  function ChatBubble(
    {
      direction = 'in',
      tone = 'default',
      palette = 'nova',
      children,
      contentLang,
      contentId,
      speaker,
      aiLabel = 'AI',
      gloss,
      glossLang = 'en',
      time,
      dateTime,
      delivery,
      senderLabel,
      actions,
      typing = false,
      typingLabel = 'Typing…',
      critical = false,
      criticalLabel = 'Escalation',
      className,
      ...rest
    },
    ref,
  ) {
    if (tone === 'system') {
      return (
        <div
          ref={ref}
          data-chat-bubble=""
          data-tone="system"
          data-palette={palette}
          data-critical={critical ? 'true' : undefined}
          className={cx(
            // .call-sys: a centred 11.5px pill, 6px by 12px, a dashed strong edge on the panel.
            'max-w-(--nova-chat-note-max-w) self-center rounded-full border border-dashed px-s5 py-s2 text-center text-caption',
            critical
              ? 'border-crit bg-crit-soft font-semibold text-crit-deep'
              : palette === 'whatsapp'
                ? 'border-border-strong bg-wa-in text-wa-ink-2'
                : 'border-border-strong bg-surface text-ink-2',
            className,
          )}
          {...rest}
        >
          {critical ? (
            <>
              <svg
                {...svg}
                className="mr-s1 inline-block size-icon-xs align-(--nova-glyph-baseline)"
              >
                <path d="M10 3 18 17H2z" />
                <path d="M10 8.5v3.5M10 14.5v.01" />
              </svg>
              <VisuallyHidden>{criticalLabel}: </VisuallyHidden>
            </>
          ) : null}
          <span lang={contentLang}>{children}</span>
        </div>
      );
    }

    const ai = tone === 'ai';
    const speakerText = ai ? (speaker ?? aiLabel) : speaker;
    const hasMeta = time !== undefined || delivery !== undefined;

    return (
      <div
        ref={ref}
        data-chat-bubble=""
        data-direction={direction}
        data-tone={tone}
        data-palette={palette}
        data-typing={typing ? 'true' : undefined}
        className={cx(
          // .wa-msg: 12.5px, 8px by 10px, a 10px radius (md on Nova's grammar), the small shadow;
          // 86% of the thread wide, 92% in the call transcript.
          'relative rounded-card px-s4 py-s3 text-body-sm shadow-sm',
          palette === 'whatsapp'
            ? 'max-w-(--nova-chat-bubble-max-w-wa)'
            : 'max-w-(--nova-chat-bubble-max-w)',
          direction === 'out' ? 'self-end' : 'self-start',
          fills[palette][direction],
          className,
        )}
        {...rest}
      >
        {senderLabel ? (
          <VisuallyHidden data-slot="sender">{senderLabel}: </VisuallyHidden>
        ) : null}
        {typing ? (
          <>
            <TypingDots palette={palette} />
            <VisuallyHidden>{typingLabel}</VisuallyHidden>
          </>
        ) : (
          <>
            {speakerText !== undefined && speakerText !== null ? (
              <span
                data-slot="speaker"
                aria-hidden={senderLabel ? true : undefined}
                className={cx(
                  // .spk: 10.5px bold capitals, a little tracked, 2px above the content.
                  'mb-s0 block text-overline font-bold uppercase tracking-label',
                  quiet[palette].speaker,
                )}
              >
                {ai ? <span aria-hidden="true">✦ </span> : null}
                {speakerText}
              </span>
            ) : null}
            {speakerText !== undefined &&
            speakerText !== null &&
            !senderLabel ? (
              <VisuallyHidden>: </VisuallyHidden>
            ) : null}
            <div data-slot="content" id={contentId} lang={contentLang}>
              {children}
            </div>
            {gloss !== undefined && gloss !== null ? (
              <span
                data-slot="gloss"
                lang={glossLang}
                // .gloss (call) and .te-eng (lab): a block of 11.5px secondary ink under the content.
                className={cx('mt-s0 block text-caption', quiet[palette].gloss)}
              >
                {gloss}
              </span>
            ) : null}
            {actions ? <div data-slot="actions">{actions}</div> : null}
            {hasMeta ? (
              <div
                data-slot="meta"
                // .wa-time: 9.5px, right-aligned, 2px under the message.
                className={cx(
                  'mt-s0 flex items-center justify-end gap-s1 text-micro',
                  quiet[palette].speaker,
                )}
              >
                {time !== undefined ? (
                  <time dateTime={dateTime}>{time}</time>
                ) : null}
                {delivery}
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  },
);
