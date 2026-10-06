import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Editor } from '@tiptap/react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Button } from '../button/button';
import { normalizeLinkUrl } from './link-url';

export interface LinkEditorProps {
  editor: Editor;
  onClose: () => void;
}

const LINK_ERROR = 'Enter a link that starts with http, https or mailto.';

// The row under the toolbar where a link is added, changed or removed. Only a URL that
// normalizeLinkUrl accepts (http, https or mailto) is ever stored; anything else is refused here
// with a message, and Tiptap's own isAllowedUri check refuses it again as a second gate.
export function LinkEditor({ editor, onClose }: LinkEditorProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const editing = editor.isActive('link');
  const [value, setValue] = useState(
    () => (editor.getAttributes('link')['href'] as string | undefined) ?? '',
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Closing hands focus back to the editor, with the selection where the person left it.
  const close = () => {
    onClose();
    editor.chain().focus().run();
  };

  const apply = () => {
    const href = normalizeLinkUrl(value);
    if (href === null) {
      setError(true);
      inputRef.current?.focus();
      return;
    }
    const chain = editor.chain().focus();
    if (editor.state.selection.empty && !editing) {
      // Nothing selected: the link's text is its address.
      chain
        .insertContent({
          type: 'text',
          text: value.trim(),
          marks: [{ type: 'link', attrs: { href } }],
        })
        .run();
    } else {
      chain.extendMarkRange('link').setLink({ href }).run();
    }
    onClose();
  };

  const remove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'Enter' && event.target === inputRef.current) {
      event.preventDefault();
      apply();
    }
  };

  // A div, not a form: the editor is usually inside the caller's own <form>, and forms do not nest.
  return (
    <div
      role="group"
      aria-label="Link"
      onKeyDown={onKeyDown}
      className="flex flex-wrap items-start gap-2 border-b border-border bg-surface px-3 py-2"
    >
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          aria-label="Link address"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder="https://example.org"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(false);
          }}
          className={cx(
            'nova-field block w-full rounded-sm px-2.5 py-1.5 text-[13px] text-ink placeholder:text-ink-3',
            focusRing,
          )}
        />
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-[12px] font-semibold text-crit-deep"
          >
            {LINK_ERROR}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={apply}>
          Apply link
        </Button>
        {editing ? (
          <Button size="sm" variant="danger" onClick={remove}>
            Remove link
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={close}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
