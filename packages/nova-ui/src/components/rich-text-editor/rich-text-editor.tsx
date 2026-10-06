import { lazy, Suspense } from 'react';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { FieldShell } from '../text-field/field-shell';
import type { RichTextEditorProps } from './types';

export type {
  RichTextEditorHtmlProps,
  RichTextEditorJsonProps,
  RichTextEditorProps,
  RichTextFormat,
  RichTextToolbarGroup,
} from './types';
export { RICH_TEXT_TOOLBAR_GROUPS } from './types';

// Tiptap and ProseMirror are most of this component's weight, so the editor itself is its own chunk,
// fetched the first time a RichTextEditor renders. The rest of Nova does not wait for it.
const Editor = lazy(() =>
  import('./rich-text-editor-impl').then((module) => ({
    default: module.RichTextEditorImpl,
  })),
);

// What shows while the chunk loads: the field's label, description and error and a box of the editor's
// height, so the page does not jump when the editor arrives.
function EditorPlaceholder(props: RichTextEditorProps) {
  const { minHeight = 160 } = props;
  return (
    <FieldShell
      id={props.id}
      label={props.label}
      hint={props.description}
      error={props.error}
      required={props.required}
      className={props.className}
    >
      {() => (
        <div
          aria-busy="true"
          style={{ minHeight }}
          className="rounded-sm border border-border-control bg-surface"
        >
          <VisuallyHidden role="status">Loading the editor</VisuallyHidden>
        </div>
      )}
    </FieldShell>
  );
}

// A rich text field for clinical notes, discharge summaries and the like, on Tiptap. Pass `value`
// (controlled) or `defaultValue`, and read edits from `onChange`, as HTML by default or as a
// ProseMirror document with format="json". The label, description and error are wired as in TextField.
// See rich-text-editor-impl.tsx for how pasted and stored content is kept inside the schema.
export function RichTextEditor(props: RichTextEditorProps) {
  return (
    <Suspense fallback={<EditorPlaceholder {...props} />}>
      <Editor {...props} />
    </Suspense>
  );
}
