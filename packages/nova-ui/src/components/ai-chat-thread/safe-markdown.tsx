import { Fragment, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';

// The small markdown subset an AI answer may use: **bold**, *italics* or _italics_, bullet and
// numbered lists, line breaks, paragraphs and [links](https://…). It builds React nodes directly,
// so every character of the answer is text: there is no HTML string, no dangerouslySetInnerHTML,
// and a tag in the answer shows as the characters it is. Links go only to http, https and mailto.

export interface SafeMarkdownProps {
  text: string;
  // The text is still streaming in: an unclosed ** runs to the end as bold, as the prototype's
  // aiStreamHTML does, instead of flashing two asterisks until its pair arrives.
  partial?: boolean;
  // The language of the text (te, hi, en …), for the screen reader's voice and the browser's fonts.
  lang?: string;
  // A node placed inline at the very end of the text: the streaming caret.
  tail?: ReactNode;
  className?: string;
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

// Only an absolute http, https or mailto address. Whitespace or control characters anywhere are
// refused outright (browsers strip them, which is how "java\tscript:" smuggles a scheme past a
// naive check); a relative address has no base here, so it does not parse and is refused too.
export function isSafeHref(href: string): boolean {
  // eslint-disable-next-line no-control-regex
  if (href.length === 0 || /[\u0000- \u007F]/.test(href)) return false;
  try {
    return SAFE_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

// The address may hold one level of balanced parentheses (a Wikipedia-style URL, or a refused
// javascript:alert(1)), so the whole link is consumed and an unsafe one leaves only its label.
const LINK = /^\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/;
const isWordChar = (ch: string | undefined) =>
  ch !== undefined && /[\p{L}\p{N}]/u.test(ch);
const isSpace = (ch: string | undefined) => ch === undefined || /\s/.test(ch);

// Where the emphasis that opens at `open` (a * or _) closes, or -1. It needs text straight after
// the opening mark and straight before the closing one, so "2 * 3 * 4" stays arithmetic; an
// underscore also needs a word boundary on the outside, so drug_code_12 stays a code.
function emphasisClose(s: string, open: number): number {
  const mark = s[open];
  if (isSpace(s[open + 1]) || s[open + 1] === mark) return -1;
  if (mark === '_' && isWordChar(s[open - 1])) return -1;
  for (let j = open + 2; j < s.length; j++) {
    if (s[j] !== mark || isSpace(s[j - 1])) continue;
    if (mark === '*' && s[j + 1] === '*') {
      j++;
      continue;
    }
    if (mark === '_' && isWordChar(s[j + 1])) continue;
    return j;
  }
  return -1;
}

function inline(s: string, key: string, partial: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let text = '';
  const flush = () => {
    if (text) out.push(text);
    text = '';
  };
  const next = () => `${key}.${out.length}`;
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('**', i)) {
      const close = s.indexOf('**', i + 2);
      if (close > i + 2) {
        flush();
        const k = next();
        out.push(
          <strong key={k} className="font-semibold">
            {inline(s.slice(i + 2, close), k, partial)}
          </strong>,
        );
        i = close + 2;
        continue;
      }
      if (close === -1 && partial && i + 2 < s.length) {
        flush();
        const k = next();
        out.push(
          <strong key={k} className="font-semibold">
            {inline(s.slice(i + 2), k, partial)}
          </strong>,
        );
        break;
      }
      text += '**';
      i += 2;
      continue;
    }
    const ch = s[i] ?? '';
    if (ch === '*' || ch === '_') {
      const close = emphasisClose(s, i);
      if (close !== -1) {
        flush();
        const k = next();
        out.push(<em key={k}>{inline(s.slice(i + 1, close), k, partial)}</em>);
        i = close + 1;
        continue;
      }
    }
    if (ch === '[') {
      const link = LINK.exec(s.slice(i));
      if (link) {
        const [whole, label = '', href = ''] = link;
        flush();
        const k = next();
        const content = inline(label, k, partial);
        out.push(
          isSafeHref(href) ? (
            <a
              key={k}
              href={href}
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              className={cx(
                'rounded-control font-semibold text-ai-deep underline underline-offset-tight',
                focusRing,
              )}
            >
              {content}
            </a>
          ) : (
            <Fragment key={k}>{content}</Fragment>
          ),
        );
        i += whole.length;
        continue;
      }
    }
    text += ch;
    i++;
  }
  flush();
  return out;
}

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; start: number; items: string[] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*(\d{1,9})[.)]\s+(.*)$/;

function blocks(text: string): Block[] {
  const out: Block[] = [];
  let current: Block | null = null;
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (line.trim() === '') {
      current = null;
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet) {
      if (current?.kind !== 'ul')
        out.push((current = { kind: 'ul', items: [] }));
      current.items.push(bullet[1] ?? '');
    } else if (numbered) {
      if (current?.kind !== 'ol') {
        current = { kind: 'ol', start: Number(numbered[1]), items: [] };
        out.push(current);
      }
      current.items.push(numbered[2] ?? '');
    } else {
      if (current?.kind !== 'p') out.push((current = { kind: 'p', lines: [] }));
      current.lines.push(line);
    }
  }
  return out;
}

export function SafeMarkdown({
  text,
  partial = false,
  lang,
  tail,
  className,
}: SafeMarkdownProps) {
  const parsed = blocks(text);
  const last = parsed.length - 1;
  const tailAt = (index: number) => (index === last ? tail : null);
  return (
    <div lang={lang} className={cx('flex flex-col gap-s2', className)}>
      {parsed.map((block, b) => {
        const key = String(b);
        if (block.kind === 'p') {
          return (
            <p key={key}>
              {block.lines.map((line, l) => (
                <Fragment key={l}>
                  {l > 0 ? <br /> : null}
                  {inline(line, `${key}.${l}`, partial)}
                </Fragment>
              ))}
              {tailAt(b)}
            </p>
          );
        }
        const items = block.items.map((item, n) => (
          <li key={n}>
            {inline(item, `${key}.${n}`, partial)}
            {n === block.items.length - 1 ? tailAt(b) : null}
          </li>
        ));
        return block.kind === 'ul' ? (
          <ul key={key} className="flex list-disc flex-col gap-s0 pl-s7">
            {items}
          </ul>
        ) : (
          <ol
            key={key}
            start={block.start}
            className="flex list-decimal flex-col gap-s0 pl-s7"
          >
            {items}
          </ol>
        );
      })}
      {parsed.length === 0 && tail ? <p>{tail}</p> : null}
    </div>
  );
}
