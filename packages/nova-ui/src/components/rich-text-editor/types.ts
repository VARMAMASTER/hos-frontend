import type { ReactNode } from 'react';
import type { JSONContent } from '@tiptap/react';

// Types only, so importing them never pulls Tiptap into the main bundle.

export type RichTextFormat = 'html' | 'json';

// The toolbar's button groups. A compact note passes fewer of them; the order given is the order drawn.
//   headings: H1, H2, H3         marks:   bold, italic, underline, strike, inline code
//   lists:    bullets, numbers, checklist   quote: blockquote
//   link:     add, edit, remove   history: undo, redo
export type RichTextToolbarGroup =
  | 'headings'
  | 'marks'
  | 'lists'
  | 'quote'
  | 'link'
  | 'history';

export const RICH_TEXT_TOOLBAR_GROUPS: readonly RichTextToolbarGroup[] = [
  'headings',
  'marks',
  'lists',
  'quote',
  'link',
  'history',
];

interface RichTextEditorBaseProps {
  label: ReactNode;
  description?: ReactNode;
  // Setting it marks the field invalid and announces the message; clear it to clear the state.
  error?: ReactNode;
  required?: boolean;
  placeholder?: string;
  // Content shows and can be selected and copied, its links open, and the toolbar is not drawn.
  readOnly?: boolean;
  // Nothing can be changed or focused; the toolbar stays, greyed out.
  disabled?: boolean;
  // Characters of text (markup is not counted). Input stops at the limit and the count shows beside the field.
  maxLength?: number;
  // The editing area's minimum height: a number is px, a string any CSS length. Defaults to 160.
  minHeight?: number | string;
  // The button groups to draw, or false for none. Defaults to all of them.
  toolbar?: readonly RichTextToolbarGroup[] | false;
  // The toolbar's accessible name. Defaults to "Formatting".
  toolbarLabel?: string;
  id?: string;
  // Styles the wrapper (width, margins), never the editor.
  className?: string;
}

export interface RichTextEditorHtmlProps extends RichTextEditorBaseProps {
  format?: 'html';
  // The note as HTML, in Tiptap's schema (an empty note is ''). Controlled when given.
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export interface RichTextEditorJsonProps extends RichTextEditorBaseProps {
  format: 'json';
  // The note as a ProseMirror document. Controlled when given.
  value?: JSONContent;
  defaultValue?: JSONContent;
  onChange?: (value: JSONContent) => void;
}

export type RichTextEditorProps =
  | RichTextEditorHtmlProps
  | RichTextEditorJsonProps;
