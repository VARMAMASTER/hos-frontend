import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import {
  RichTextEditor,
  type RichTextEditorHtmlProps,
  type RichTextEditorJsonProps,
} from './rich-text-editor';

const constrained: Decorator = (Story) => (
  <div className="max-w-2xl">
    <Story />
  </div>
);

// Made-up patient and findings; no real record is used anywhere in these stories.
const CLINICAL_NOTE = `
<h2>Ward round, 6 October</h2>
<p><strong>Ramesh Rao</strong>, 58, bed 12 (General ward). Day 3 after laparoscopic cholecystectomy.
Afebrile overnight, pain <em>2/10</em> on oral analgesia, tolerating a light diet.</p>
<h3>Plan</h3>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Cannula site checked, no phlebitis</p></li>
  <li data-type="taskItem" data-checked="true"><p>Wound dressing changed</p></li>
  <li data-type="taskItem" data-checked="false"><p>Repeat bloods before discharge</p></li>
  <li data-type="taskItem" data-checked="false"><p>Discharge counselling with family</p></li>
</ul>
<blockquote><p>Patient asked about returning to work; advised two weeks of light duty.</p></blockquote>
<p>Review by the <a href="https://example.org/surgical-guidelines">surgical team</a> at 6pm. Dose reference: <code>paracetamol 1 g q6h</code>.</p>
`;

const DISCHARGE_SUMMARY = `
<h2>Discharge summary</h2>
<p><strong>Ramesh Rao</strong> was admitted on 3 October with biliary colic and discharged on 6 October after an uncomplicated laparoscopic cholecystectomy.</p>
<h3>On discharge</h3>
<ol>
  <li><p>Paracetamol 1 g up to four times daily for five days</p></li>
  <li><p>Light diet; no heavy lifting for two weeks</p></li>
  <li><p>Return to the surgical clinic in ten days</p></li>
</ol>
<blockquote><p>Come back sooner for fever, worsening pain, or yellowing of the eyes.</p></blockquote>
`;

const meta = {
  title: 'Components/RichTextEditor',
  component: RichTextEditor,
  args: { label: 'Clinical note' },
  decorators: [constrained],
} satisfies Meta<typeof RichTextEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Write the clinical note' },
};

// A ward-round note with headings, a checklist, a quote and a link. It is controlled, and the
// emitted HTML is shown beneath it so the output (Tiptap's schema only) can be seen.
export const ClinicalNoteWithChecklist: Story = {
  args: { description: 'Findings, plan and advice for the ward team' },
  render: function Render(args) {
    const [value, setValue] = useState(CLINICAL_NOTE);
    return (
      <div className="flex flex-col gap-s5">
        <RichTextEditor
          {...(args as RichTextEditorHtmlProps)}
          format="html"
          value={value}
          onChange={setValue}
          minHeight={280}
        />
        <details className="text-label text-ink-2">
          <summary className="cursor-pointer">The saved HTML</summary>
          <pre className="mt-s3 overflow-x-auto rounded-control border border-border bg-surface-2 p-s5 font-mono text-label whitespace-pre-wrap text-ink">
            {value}
          </pre>
        </details>
      </div>
    );
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Discharge summary',
    readOnly: true,
    defaultValue: DISCHARGE_SUMMARY,
    description: 'Signed by the consultant; it can no longer be edited',
  },
};

export const WithError: Story = {
  args: {
    label: 'Discharge advice',
    required: true,
    error: 'Add the discharge advice before you finish',
    placeholder: 'Medicines, diet, activity and when to come back',
  },
};

export const CompactToolbar: Story = {
  args: {
    label: 'Nursing comment',
    toolbar: ['marks', 'lists'],
    toolbarLabel: 'Comment formatting',
    minHeight: 96,
    maxLength: 280,
    placeholder: 'A short handover comment',
    defaultValue: '<p>Slept well. <strong>Pain controlled</strong>.</p>',
  },
};

export const WithCharacterLimit: Story = {
  args: {
    label: 'Chief complaint',
    maxLength: 120,
    minHeight: 96,
    toolbar: ['marks', 'history'],
    defaultValue: '<p>Right upper abdominal pain for two days after meals.</p>',
  },
};

export const NoToolbar: Story = {
  args: {
    label: 'Remarks',
    toolbar: false,
    minHeight: 96,
    placeholder: 'Plain remarks; shortcuts such as Ctrl+B still work',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue:
      '<p>This note is locked while the order is being processed.</p>',
  },
};

// The same editor, speaking ProseMirror JSON instead of HTML.
export const JsonFormat: Story = {
  args: { label: 'Structured note', minHeight: 120 },
  render: function Render(args) {
    const [doc, setDoc] = useState<object>({});
    return (
      <div className="flex flex-col gap-s5">
        <RichTextEditor
          {...(args as RichTextEditorJsonProps)}
          format="json"
          onChange={(next) => setDoc(next)}
        />
        <pre className="overflow-x-auto rounded-control border border-border bg-surface-2 p-s5 font-mono text-label whitespace-pre-wrap text-ink">
          {JSON.stringify(doc, null, 2)}
        </pre>
      </div>
    );
  },
};
