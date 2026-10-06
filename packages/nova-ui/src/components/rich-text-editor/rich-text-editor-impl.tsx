import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { FieldShell } from '../text-field/field-shell';
import { LinkEditor } from './link-editor';
import { isAllowedLinkUrl } from './link-url';
import { Toolbar } from './toolbar';
import {
  RICH_TEXT_TOOLBAR_GROUPS,
  type RichTextEditorProps,
  type RichTextToolbarGroup,
} from './types';

// SECURITY. The note is rich text that is stored and shown again, so what it may contain is decided
// by Tiptap's schema, never by the markup that arrives:
//  - Input, paste and drop all go through ProseMirror's DOMParser against the schema below, so a
//    <script>, <iframe>, <img>, an inline style, a class, an on* handler or any tag or attribute the
//    schema does not name is dropped before it exists as content. There is no raw-HTML passthrough.
//  - A link's href must pass isAllowedLinkUrl (http, https, mailto) both when it is typed and when it
//    is read back from pasted HTML or stored content, so a javascript: link never exists.
//  - The HTML handed to onChange is serialised from that schema (editor.getHTML()), and the content is
//    only ever rendered by ProseMirror from its document. This component never uses
//    dangerouslySetInnerHTML; a caller that renders the stored HTML elsewhere should still sanitise
//    it on the server, since this component cannot vouch for HTML that did not come from it.
// HEALTH DATA. A note is clinical content: nothing here logs it, and nothing may be added that does.

const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

const BASE_ATTRIBUTES = {
  role: 'textbox',
  'aria-multiline': 'true',
} as const;

// The prototype's type for rich content: 13.5px body at its 1.55 line height; h1 23px, h2 17px and
// h3 14px in the display face at weight 600; code in the mono face at 12px; a quote with a left rule.
const CONTENT_CLASS = cx(
  'block w-full px-3 py-2.5 text-[13.5px] leading-[1.55] text-ink outline-none',
  '[&>*+*]:mt-2',
  '[&_h1]:font-display [&_h1]:text-[23px] [&_h1]:font-semibold [&_h1]:tracking-[-0.015em]',
  '[&_h2]:font-display [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:tracking-[-0.01em]',
  '[&_h3]:font-display [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:tracking-[-0.005em]',
  '[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through',
  '[&_a]:text-primary-strong [&_a]:underline [&_a]:underline-offset-2',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li>p]:my-0',
  "[&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0",
  '[&_li[data-checked]]:flex [&_li[data-checked]]:items-start [&_li[data-checked]]:gap-2',
  '[&_li[data-checked]>label]:mt-0.5 [&_li[data-checked]>div]:flex-1',
  "[&_li[data-checked='true']>div]:text-ink-2 [&_li[data-checked='true']>div]:line-through",
  '[&_input[type=checkbox]]:size-4 [&_input[type=checkbox]]:accent-primary',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:text-ink-2',
  '[&_code]:rounded-sm [&_code]:border [&_code]:border-border [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px]',
  // The placeholder is the first empty paragraph's data-placeholder, drawn before it.
  '[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-ink-3 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
);

export function RichTextEditorImpl(props: RichTextEditorProps) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const labelId = `${id}-label`;
  const countId = `${id}-count`;

  return (
    <FieldShell
      id={id}
      label={
        // The label names the editor through aria-labelledby (a contenteditable is not a labelable
        // element, so label-for alone would name nothing); a click on it moves focus into the editor.
        <span id={labelId} onClick={() => document.getElementById(id)?.focus()}>
          {props.label}
        </span>
      }
      hint={props.description}
      error={props.error}
      required={props.required}
      describedBy={props.maxLength !== undefined ? countId : undefined}
      className={props.className}
    >
      {(field) => (
        <EditorField
          {...props}
          id={field.id}
          labelId={labelId}
          countId={countId}
          invalid={field['aria-invalid'] === true}
          describedBy={field['aria-describedby']}
        />
      )}
    </FieldShell>
  );
}

type EditorFieldProps = RichTextEditorProps & {
  id: string;
  labelId: string;
  countId: string;
  invalid: boolean;
  describedBy: string | undefined;
};

function serialise(editor: Editor, format: 'html' | 'json') {
  if (format === 'json') return editor.getJSON();
  return editor.isEmpty ? '' : editor.getHTML();
}

function sameContent(
  editor: Editor,
  format: 'html' | 'json',
  next: string | JSONContent,
) {
  return JSON.stringify(serialise(editor, format)) === JSON.stringify(next);
}

function EditorField(props: EditorFieldProps) {
  const {
    id,
    labelId,
    countId,
    invalid,
    describedBy,
    format = 'html',
    readOnly = false,
    disabled = false,
    required = false,
    placeholder,
    maxLength,
    minHeight = 160,
    toolbar,
    toolbarLabel = 'Formatting',
  } = props;
  const editable = !readOnly && !disabled;
  const groups: readonly RichTextToolbarGroup[] =
    toolbar === false ? [] : (toolbar ?? RICH_TEXT_TOOLBAR_GROUPS);

  const [content, setContent] = useControllableState<string | JSONContent>({
    value: props.value,
    defaultValue: props.defaultValue ?? (format === 'json' ? EMPTY_DOC : ''),
    onChange: props.onChange as
      | ((value: string | JSONContent) => void)
      | undefined,
  });

  // The editor is created once and reads what changes later through refs, so typing never rebuilds it.
  const contentRef = useRef(content);
  contentRef.current = content;
  const setContentRef = useRef(setContent);
  setContentRef.current = setContent;
  const placeholderRef = useRef(placeholder);
  placeholderRef.current = placeholder;
  const openLinkRef = useRef<() => void>(() => undefined);
  const lastEmitted = useRef<string | JSONContent | undefined>(undefined);
  const [linkOpen, setLinkOpen] = useState(false);

  const attributes = useMemo(
    () => ({
      ...BASE_ATTRIBUTES,
      id,
      class: CONTENT_CLASS,
      'aria-labelledby': labelId,
      ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      ...(invalid ? { 'aria-invalid': 'true' } : {}),
      ...(required ? { 'aria-required': 'true' } : {}),
      ...(readOnly ? { 'aria-readonly': 'true' } : {}),
      ...(disabled ? { 'aria-disabled': 'true' } : {}),
      // A read-only note is still reachable by keyboard, so it can be scrolled and selected.
      ...(readOnly && !disabled ? { tabindex: '0' } : {}),
      ...(disabled ? { tabindex: '-1' } : {}),
    }),
    [id, labelId, describedBy, invalid, required, readOnly, disabled],
  );

  const editorProps = useMemo(
    () => ({
      attributes,
      handleKeyDown: (_view: unknown, event: KeyboardEvent) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'k'
        ) {
          event.preventDefault();
          openLinkRef.current();
          return true;
        }
        return false;
      },
    }),
    [attributes],
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          // Clinical notes are prose: no code blocks or rules, which pasted ones fall back to text from.
          codeBlock: false,
          horizontalRule: false,
          // No empty paragraph appended after a list or quote: it would end up in the saved note.
          trailingNode: false,
          link: {
            openOnClick: false,
            autolink: false,
            defaultProtocol: 'https',
            isAllowedUri: (url) => isAllowedLinkUrl(url),
            HTMLAttributes: {
              rel: 'noopener noreferrer nofollow',
              target: '_blank',
            },
          },
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({
          placeholder: () => placeholderRef.current ?? '',
        }),
        ...(maxLength !== undefined
          ? [CharacterCount.configure({ limit: maxLength })]
          : []),
      ],
      content: contentRef.current,
      editable,
      editorProps,
      immediatelyRender: true,
      onUpdate: ({ editor: updated }) => {
        const next = serialise(updated, format);
        lastEmitted.current = next;
        setContentRef.current(next);
      },
    },
    [maxLength, format],
  );

  useEffect(() => {
    openLinkRef.current = () => {
      if (editor?.isEditable) setLinkOpen(true);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (editor.isEditable !== editable) editor.setEditable(editable);
    if (!editable) setLinkOpen(false);
  }, [editor, editable]);

  // Tiptap undoes a tick made in a read-only note but leaves the checkbox looking usable; disabling it
  // tells everyone, assistive technology included, that it cannot be changed. Nodes are redrawn by
  // ProseMirror, so this runs again after every transaction.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return undefined;
    const sync = () => {
      editor.view.dom
        .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
        .forEach((box) => {
          box.disabled = !editable;
        });
    };
    sync();
    editor.on('transaction', sync);
    return () => {
      editor.off('transaction', sync);
    };
  }, [editor, editable]);

  // New attributes (an error appears, the description changes) reach the contenteditable element.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setOptions({ editorProps });
  }, [editor, editorProps]);

  // A controlled value that did not come from this editor replaces its content. Content the editor
  // just emitted is skipped, so the caret never jumps while someone types.
  const controlledValue = props.value;
  useEffect(() => {
    if (!editor || editor.isDestroyed || controlledValue === undefined) return;
    if (
      controlledValue === lastEmitted.current ||
      sameContent(editor, format, controlledValue)
    ) {
      return;
    }
    editor.commands.setContent(controlledValue, { emitUpdate: false });
  }, [editor, controlledValue, format]);

  const characters = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      (
        current?.storage['characterCount'] as
          | { characters: () => number }
          | undefined
      )?.characters() ?? 0,
  });

  if (!editor) return null;

  const atLimit = maxLength !== undefined && characters >= maxLength;
  const showToolbar = !readOnly && groups.length > 0;

  return (
    <>
      <div
        data-invalid={invalid ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        className={cx(
          // The prototype's .f-input: the field edge, radius and fill, and its edge turns primary on
          // focus. The keyboard ring shows when anything inside takes focus-visible.
          'nova-field overflow-hidden rounded-sm transition-colors',
          'focus-within:[--nova-field-edge:var(--nova-color-primary)] data-[invalid=true]:[--nova-field-edge:var(--nova-color-crit)]',
          'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--nova-focus-ring,var(--nova-color-primary))]',
          'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50',
          readOnly && 'bg-surface-2',
        )}
      >
        {showToolbar ? (
          <Toolbar
            editor={editor}
            groups={groups}
            label={toolbarLabel}
            disabled={disabled}
            onLink={() => setLinkOpen((open) => !open)}
          />
        ) : null}
        {linkOpen && editable ? (
          <LinkEditor editor={editor} onClose={() => setLinkOpen(false)} />
        ) : null}
        <EditorContent
          editor={editor}
          style={{ minHeight }}
          className={cx(disabled && 'pointer-events-none')}
        />
      </div>
      {maxLength !== undefined ? (
        <>
          <p
            id={countId}
            className={cx(
              'mt-1 flex justify-end gap-2 text-[12px]',
              atLimit ? 'font-semibold text-crit-deep' : 'text-ink-2',
            )}
          >
            {atLimit ? <span>Limit reached</span> : null}
            <span>{`${characters} / ${maxLength}`}</span>
          </p>
          <VisuallyHidden role="status">
            {atLimit ? 'Character limit reached' : ''}
          </VisuallyHidden>
        </>
      ) : null}
    </>
  );
}
