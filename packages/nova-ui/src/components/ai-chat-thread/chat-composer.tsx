import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type FormHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { Button } from '../button/button';
import { Textarea } from '../textarea/textarea';

export interface ChatComposerProps
  extends Omit<
    FormHTMLAttributes<HTMLFormElement>,
    'onSubmit' | 'defaultValue' | 'children'
  > {
  // Called with the trimmed question. The composer then clears and keeps focus in the field.
  onSend: (question: string) => void;
  // Controlled when given; uncontrolled otherwise, starting from defaultValue.
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  // HOS AI is answering: nothing can be sent. With onStop, the send button becomes Stop, and
  // Escape in the field stops the answer too.
  busy?: boolean;
  onStop?: () => void;
  // A slot before the field (an attach button).
  attach?: ReactNode;
  // The field grows with its text up to this many pixels, then scrolls.
  maxHeight?: number;
  // The language the person types in, when it is known.
  lang?: string;
  // Fixed words, all translatable. The label is for assistive technology (the prototype shows only
  // a placeholder).
  label?: string;
  placeholder?: string;
  sendLabel?: string;
  stopLabel?: string;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

// Where a question is typed: the prototype's .hcp-form, the field and the ✦ Ask button 8px apart.
// The field is Nova's Textarea (its label hidden, the prototype has none on screen) that starts one
// line tall and grows with the text to maxHeight. Enter sends, Shift+Enter is a new line, and Enter
// while an input method is composing (Telugu, Hindi) only picks the word. The text is the person's:
// it is never logged or stored.
export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(
  function ChatComposer(
    {
      onSend,
      value: valueProp,
      defaultValue = '',
      onValueChange,
      busy = false,
      onStop,
      attach,
      maxHeight = 160,
      lang,
      label = 'Ask HOS AI a question',
      placeholder = 'Ask anything…',
      sendLabel = 'Ask',
      stopLabel = 'Stop',
      className,
      ...rest
    },
    ref,
  ) {
    const [value, setValue] = useControllableState({
      value: valueProp,
      defaultValue,
      onChange: onValueChange,
    });
    const field = useRef<HTMLTextAreaElement | null>(null);
    const setField = useCallback(
      (node: HTMLTextAreaElement | null) => {
        field.current = node;
        assignRef(ref, node);
      },
      [ref],
    );

    // Grow to fit the text (the scroll height plus the border), up to maxHeight, then scroll.
    useLayoutEffect(() => {
      const area = field.current;
      if (!area) return;
      area.style.height = 'auto';
      if (area.scrollHeight === 0) {
        area.style.height = '';
        return;
      }
      const style = getComputedStyle(area);
      const natural =
        area.scrollHeight +
        (parseFloat(style.borderTopWidth) || 0) +
        (parseFloat(style.borderBottomWidth) || 0);
      area.style.height = `${Math.min(natural, maxHeight)}px`;
      area.style.overflowY = natural > maxHeight ? 'auto' : 'hidden';
    }, [value, maxHeight]);

    function send() {
      if (busy) return;
      const question = value.trim();
      if (!question) return;
      onSend(question);
      setValue('');
      field.current?.focus();
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      send();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
      if (event.key === 'Escape' && busy && onStop) {
        event.preventDefault();
        onStop();
        return;
      }
      if (event.key !== 'Enter' || event.shiftKey) return;
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      send();
    }

    return (
      <form
        className={cx('flex items-end gap-2', className)}
        onSubmit={handleSubmit}
        {...rest}
      >
        {attach ? (
          <div className="flex shrink-0 items-center">{attach}</div>
        ) : null}
        <Textarea
          ref={setField}
          label={<VisuallyHidden>{label}</VisuallyHidden>}
          rows={1}
          lang={lang}
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={busy}
          aria-disabled={busy || undefined}
          // A composer starts one line tall: no minimum height and no drag handle (it grows itself).
          style={{ minHeight: 0, resize: 'none' }}
          className="min-w-0 flex-1"
        />
        {busy && onStop ? (
          <Button variant="ghost" onClick={onStop}>
            {stopLabel}
          </Button>
        ) : (
          <Button type="submit" variant="ai" aria-disabled={busy || undefined}>
            {sendLabel}
          </Button>
        )}
      </form>
    );
  },
);
