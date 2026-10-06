import { useState } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import type { Editor, JSONContent } from '@tiptap/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from './rich-text-editor';
import { RichTextEditorImpl } from './rich-text-editor-impl';

// ProseMirror measures the DOM when it scrolls a selection into view; jsdom has no layout, so it
// gets empty rectangles.
beforeAll(() => {
  const rect = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  };
  const rects = () => ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: function* () {
      /* no rectangles */
    },
  });
  Range.prototype.getBoundingClientRect = () => rect as DOMRect;
  Range.prototype.getClientRects = () => rects() as unknown as DOMRectList;
  Element.prototype.getClientRects = () => rects() as unknown as DOMRectList;
  document.elementFromPoint = () => null;
  // pasteHTML builds the paste event it hands to the editor's handlers.
  globalThis.ClipboardEvent ??=
    class extends Event {} as unknown as typeof ClipboardEvent;
});

afterEach(() => cleanup());

// Tiptap puts its editor on the contenteditable element, which is how a jsdom test drives it
// (there is no real typing or selection to lean on).
function editorOf(container: HTMLElement): Editor {
  const dom = container.querySelector('.ProseMirror') as
    | (HTMLElement & { editor: Editor })
    | null;
  if (!dom) throw new Error('the editor did not mount');
  return dom.editor;
}

function toolbarButton(name: string) {
  return within(screen.getByRole('toolbar')).getByRole('button', { name });
}

// Built from parts so the lint rule against script URLs does not flag a test about refusing them.
const SCRIPT = ['java', 'script'].join('');

function paragraph(text: string): JSONContent {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  };
}

describe('RichTextEditor: the field', () => {
  it('is a textbox named by its label, with the toolbar named too', () => {
    render(<RichTextEditorImpl label="Clinical note" />);
    const box = screen.getByRole('textbox', { name: 'Clinical note' });
    expect(box.getAttribute('contenteditable')).toBe('true');
    expect(box.getAttribute('aria-multiline')).toBe('true');
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeTruthy();
  });

  it('wires the label, description and error like TextField: label for, aria-describedby, aria-invalid, required', () => {
    const { container } = render(
      <RichTextEditorImpl
        id="note"
        label="Clinical note"
        description="Findings, plan and advice"
        error="A note is required"
        required
      />,
    );
    const box = screen.getByRole('textbox');
    expect(box.id).toBe('note');
    expect(container.querySelector('label')?.getAttribute('for')).toBe('note');
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(box.getAttribute('aria-required')).toBe('true');
    const ids = (box.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toContain('note-hint');
    expect(ids).toContain('note-error');
    expect(document.getElementById('note-hint')?.textContent).toBe(
      'Findings, plan and advice',
    );
    expect(document.getElementById('note-error')?.textContent).toBe(
      'A note is required',
    );
  });

  it('is not invalid or required unless asked', () => {
    render(<RichTextEditorImpl label="Clinical note" />);
    const box = screen.getByRole('textbox');
    expect(box.getAttribute('aria-invalid')).toBeNull();
    expect(box.getAttribute('aria-required')).toBeNull();
  });

  it('follows aria-invalid when the error appears and clears', () => {
    const { rerender } = render(<RichTextEditorImpl label="Note" />);
    rerender(<RichTextEditorImpl label="Note" error="Required" />);
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe(
      'true',
    );
    rerender(<RichTextEditorImpl label="Note" />);
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBeNull();
  });

  it('shows the placeholder while the note is empty', () => {
    const { container } = render(
      <RichTextEditorImpl label="Note" placeholder="Write the note" />,
    );
    expect(
      container.querySelector('[data-placeholder="Write the note"]'),
    ).toBeTruthy();
  });

  it('applies minHeight to the editing area', () => {
    const { container } = render(
      <RichTextEditorImpl label="Note" minHeight={240} />,
    );
    const area = container.querySelector('.ProseMirror')?.parentElement;
    expect((area as HTMLElement).style.minHeight).toBe('240px');
  });

  it('puts a caller className on the wrapper', () => {
    const { container } = render(
      <RichTextEditorImpl label="Note" className="max-w-md" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      'max-w-md',
    );
  });
});

describe('RichTextEditor: value, defaultValue and onChange', () => {
  it('starts from defaultValue and reports edits as HTML (uncontrolled)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        defaultValue="<p>Ramesh is stable</p>"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('textbox').textContent).toBe('Ramesh is stable');
    act(() => {
      const editor = editorOf(container);
      editor.commands.insertContentAt(
        editor.state.doc.content.size,
        '<p>Review at 6pm</p>',
      );
    });
    expect(onChange).toHaveBeenLastCalledWith(
      '<p>Ramesh is stable</p><p>Review at 6pm</p>',
    );
  });

  it('round-trips a controlled value: it renders the value, reports edits, and follows the parent', () => {
    function Controlled() {
      const [value, setValue] = useState('<p>Ramesh</p>');
      return (
        <>
          <RichTextEditorImpl label="Note" value={value} onChange={setValue} />
          <button
            type="button"
            onClick={() => setValue('<p>Replaced by the parent</p>')}
          >
            Reset
          </button>
          <output data-testid="out">{value}</output>
        </>
      );
    }
    const { container } = render(<Controlled />);
    expect(screen.getByRole('textbox').textContent).toBe('Ramesh');

    act(() => {
      editorOf(container).commands.insertContentAt(7, ' Rao');
    });
    expect(screen.getByTestId('out').textContent).toBe('<p>Ramesh Rao</p>');
    expect(screen.getByRole('textbox').textContent).toBe('Ramesh Rao');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('textbox').textContent).toBe(
      'Replaced by the parent',
    );
  });

  it('reports an empty note as an empty string, not an empty paragraph', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        defaultValue="<p>x</p>"
        onChange={onChange}
      />,
    );
    act(() => {
      editorOf(container).commands.clearContent(true);
    });
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('speaks ProseMirror JSON when format is json', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        format="json"
        defaultValue={paragraph('Ramesh')}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('textbox').textContent).toBe('Ramesh');
    act(() => {
      editorOf(container).commands.insertContentAt(7, ' Rao');
    });
    const last = onChange.mock.calls.at(-1)?.[0] as JSONContent;
    expect(last.type).toBe('doc');
    expect(JSON.stringify(last)).toContain('Ramesh Rao');
  });

  it('follows a controlled JSON value', () => {
    const { rerender } = render(
      <RichTextEditorImpl
        label="Note"
        format="json"
        value={paragraph('One')}
      />,
    );
    expect(screen.getByRole('textbox').textContent).toBe('One');
    rerender(
      <RichTextEditorImpl
        label="Note"
        format="json"
        value={paragraph('Two')}
      />,
    );
    expect(screen.getByRole('textbox').textContent).toBe('Two');
  });
});

describe('RichTextEditor: the toolbar', () => {
  it('toggles a mark and reflects it in aria-pressed', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        defaultValue="<p>Ramesh</p>"
        onChange={onChange}
      />,
    );
    const bold = toolbarButton('Bold');
    expect(bold.getAttribute('aria-pressed')).toBe('false');
    act(() => {
      editorOf(container).commands.selectAll();
    });
    fireEvent.click(bold);
    expect(bold.getAttribute('aria-pressed')).toBe('true');
    expect(onChange).toHaveBeenLastCalledWith('<p><strong>Ramesh</strong></p>');
    fireEvent.click(bold);
    expect(bold.getAttribute('aria-pressed')).toBe('false');
    expect(onChange).toHaveBeenLastCalledWith('<p>Ramesh</p>');
  });

  it.each([
    ['Italic', '<em>'],
    ['Underline', '<u>'],
    ['Strikethrough', '<s>'],
    ['Inline code', '<code>'],
  ])('the %s button writes %s', (name, tag) => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        defaultValue="<p>Ramesh</p>"
        onChange={onChange}
      />,
    );
    act(() => {
      editorOf(container).commands.selectAll();
    });
    fireEvent.click(toolbarButton(name));
    expect(toolbarButton(name).getAttribute('aria-pressed')).toBe('true');
    expect(onChange.mock.calls.at(-1)?.[0]).toContain(tag);
  });

  it.each([
    ['Heading 1', '<h1>'],
    ['Heading 2', '<h2>'],
    ['Heading 3', '<h3>'],
    ['Quote', '<blockquote>'],
    ['Bulleted list', '<ul>'],
    ['Numbered list', '<ol>'],
    ['Checklist', 'data-type="taskList"'],
  ])('the %s button writes %s and is pressed', (name, markup) => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        defaultValue="<p>Ramesh</p>"
        onChange={onChange}
      />,
    );
    act(() => {
      editorOf(container).commands.selectAll();
    });
    fireEvent.click(toolbarButton(name));
    expect(onChange.mock.calls.at(-1)?.[0]).toContain(markup);
    expect(toolbarButton(name).getAttribute('aria-pressed')).toBe('true');
  });

  it('lets a checklist item be ticked', () => {
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        defaultValue='<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Cannula site checked</p></li></ul>'
      />,
    );
    const tick = screen.getByRole('checkbox');
    expect((tick as HTMLInputElement).checked).toBe(false);
    fireEvent.click(tick);
    expect(container.querySelector('li[data-checked="true"]')).toBeTruthy();
  });

  it('has every command that can run enabled from the first render, before anyone types', () => {
    render(<RichTextEditorImpl label="Note" />);
    for (const name of ['Bold', 'Heading 2', 'Bulleted list', 'Link']) {
      expect((toolbarButton(name) as HTMLButtonElement).disabled, name).toBe(
        false,
      );
    }
  });

  it('disables undo and redo until there is something to undo or redo', () => {
    const { container } = render(
      <RichTextEditorImpl label="Note" defaultValue="<p>Ramesh</p>" />,
    );
    expect((toolbarButton('Undo') as HTMLButtonElement).disabled).toBe(true);
    expect((toolbarButton('Redo') as HTMLButtonElement).disabled).toBe(true);
    act(() => {
      editorOf(container).commands.insertContentAt(7, ' Rao');
    });
    expect((toolbarButton('Undo') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(toolbarButton('Undo'));
    expect(screen.getByRole('textbox').textContent).toBe('Ramesh');
    expect((toolbarButton('Redo') as HTMLButtonElement).disabled).toBe(false);
  });

  it('keeps one tab stop and moves it with the arrow keys, Home and End', () => {
    render(<RichTextEditorImpl label="Note" defaultValue="<p>Ramesh</p>" />);
    const toolbar = screen.getByRole('toolbar');
    const enabled = () =>
      within(toolbar)
        .getAllByRole('button')
        .filter((button) => !(button as HTMLButtonElement).disabled);
    const tabStops = () =>
      within(toolbar)
        .getAllByRole('button')
        .filter((button) => button.tabIndex === 0);
    expect(tabStops()).toHaveLength(1);
    expect(tabStops()[0]).toBe(enabled()[0]);

    act(() => enabled()[0]?.focus());
    fireEvent.keyDown(document.activeElement as Element, {
      key: 'ArrowRight',
    });
    expect(document.activeElement).toBe(enabled()[1]);
    expect(tabStops()).toEqual([enabled()[1]]);

    fireEvent.keyDown(document.activeElement as Element, { key: 'End' });
    expect(document.activeElement).toBe(enabled().at(-1));
    fireEvent.keyDown(document.activeElement as Element, {
      key: 'ArrowRight',
    });
    expect(document.activeElement).toBe(enabled()[0]);
    fireEvent.keyDown(document.activeElement as Element, {
      key: 'ArrowLeft',
    });
    expect(document.activeElement).toBe(enabled().at(-1));
    fireEvent.keyDown(document.activeElement as Element, { key: 'Home' });
    expect(document.activeElement).toBe(enabled()[0]);
    expect(tabStops()).toEqual([enabled()[0]]);
  });

  it('shows the keyboard shortcut in the tooltip when a button takes focus', () => {
    render(<RichTextEditorImpl label="Note" />);
    fireEvent.focus(toolbarButton('Bold'));
    expect(screen.getByRole('tooltip').textContent).toContain('Ctrl+B');
    expect(toolbarButton('Bold').getAttribute('aria-keyshortcuts')).toBe(
      'Control+B',
    );
  });

  it('draws only the groups asked for, in the order given', () => {
    render(<RichTextEditorImpl label="Note" toolbar={['lists', 'marks']} />);
    const names = within(screen.getByRole('toolbar'))
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));
    expect(names).toEqual([
      'Bulleted list',
      'Numbered list',
      'Checklist',
      'Bold',
      'Italic',
      'Underline',
      'Strikethrough',
      'Inline code',
    ]);
  });

  it('draws no toolbar when toolbar is false', () => {
    render(<RichTextEditorImpl label="Note" toolbar={false} />);
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('names the toolbar from toolbarLabel', () => {
    render(<RichTextEditorImpl label="Note" toolbarLabel="Note formatting" />);
    expect(
      screen.getByRole('toolbar', { name: 'Note formatting' }),
    ).toBeTruthy();
  });
});

describe('RichTextEditor: maxLength', () => {
  it('shows the count against the limit and counts as the note grows', () => {
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        maxLength={2000}
        defaultValue="<p>Ramesh</p>"
      />,
    );
    expect(screen.getByText('6 / 2000')).toBeTruthy();
    act(() => {
      editorOf(container).commands.insertContentAt(7, ' Rao');
    });
    expect(screen.getByText('10 / 2000')).toBeTruthy();
  });

  it('blocks input past the limit', () => {
    const { container } = render(
      <RichTextEditorImpl label="Note" maxLength={10} />,
    );
    act(() => {
      editorOf(container).commands.insertContent('Ramesh Rao is a patient');
    });
    expect(
      screen.getByRole('textbox').textContent?.length ?? 0,
    ).toBeLessThanOrEqual(10);
    act(() => {
      editorOf(container).commands.insertContent('more');
    });
    expect(
      screen.getByRole('textbox').textContent?.length ?? 0,
    ).toBeLessThanOrEqual(10);
    expect(screen.getByText(/^\d+ \/ 10$/)).toBeTruthy();
  });

  it('says so in words when the limit is reached, not by colour alone', () => {
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        maxLength={6}
        defaultValue="<p>Ramesh</p>"
      />,
    );
    expect(screen.getByText('6 / 6')).toBeTruthy();
    expect(
      screen.getAllByText('Character limit reached').length,
    ).toBeGreaterThan(0);
    expect(container.querySelector('[role="status"]')).toBeTruthy();
  });

  it('draws no count without a limit', () => {
    render(<RichTextEditorImpl label="Note" defaultValue="<p>Ramesh</p>" />);
    expect(screen.queryByText(/ \/ /)).toBeNull();
  });

  it('includes the count in the description of the editor', () => {
    render(<RichTextEditorImpl label="Note" maxLength={50} />);
    const box = screen.getByRole('textbox');
    const ids = (box.getAttribute('aria-describedby') ?? '').split(' ');
    expect(
      ids.some((id) => document.getElementById(id)?.textContent === '0 / 50'),
    ).toBe(true);
  });
});

describe('RichTextEditor: links', () => {
  function openLinkDialog(container: HTMLElement, text = 'Ramesh') {
    act(() => {
      editorOf(container).commands.setContent(`<p>${text}</p>`);
      editorOf(container).commands.selectAll();
    });
    fireEvent.click(toolbarButton('Link'));
    return screen.getByLabelText('Link address') as HTMLInputElement;
  }

  it('adds a link to the selection', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditorImpl label="Note" onChange={onChange} />,
    );
    const input = openLinkDialog(container);
    fireEvent.change(input, { target: { value: 'example.org/guidelines' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply link' }));
    const html = onChange.mock.calls.at(-1)?.[0] as string;
    expect(html).toContain('href="https://example.org/guidelines"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(toolbarButton('Link').getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByLabelText('Link address')).toBeNull();
  });

  it.each([
    `${SCRIPT}:alert(1)`,
    `${SCRIPT.toUpperCase()}:alert(1)`,
    'data:text/html;base64,PHNjcmlwdD4=',
    'vbscript:x',
    'java\nscript:alert(1)',
  ])('rejects %j and says why', (bad) => {
    const { container } = render(<RichTextEditorImpl label="Note" />);
    const input = openLinkDialog(container);
    fireEvent.change(input, { target: { value: bad } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply link' }));
    expect(screen.getByRole('alert').textContent).toMatch(
      /http, https or mailto/i,
    );
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(editorOf(container).getHTML()).not.toContain('href');
    expect(editorOf(container).isActive('link')).toBe(false);
  });

  it('applies on Enter and closes on Escape', () => {
    const { container } = render(<RichTextEditorImpl label="Note" />);
    const input = openLinkDialog(container);
    fireEvent.change(input, { target: { value: 'mailto:ward@example.org' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(editorOf(container).getHTML()).toContain('mailto:ward@example.org');

    fireEvent.click(toolbarButton('Link'));
    const again = screen.getByLabelText('Link address') as HTMLInputElement;
    expect(again.value).toBe('mailto:ward@example.org');
    fireEvent.keyDown(again, { key: 'Escape' });
    expect(screen.queryByLabelText('Link address')).toBeNull();
  });

  it('removes a link', () => {
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        defaultValue='<p><a href="https://example.org/">Ramesh</a></p>'
      />,
    );
    act(() => {
      editorOf(container).commands.setTextSelection(3);
    });
    fireEvent.click(toolbarButton('Link'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove link' }));
    expect(editorOf(container).getHTML()).toBe('<p>Ramesh</p>');
  });

  it('does not offer to remove where there is no link', () => {
    const { container } = render(<RichTextEditorImpl label="Note" />);
    openLinkDialog(container);
    expect(screen.queryByRole('button', { name: 'Remove link' })).toBeNull();
  });

  it('drops a javascript: link that arrives as stored HTML', () => {
    const { container } = render(
      <RichTextEditorImpl
        label="Note"
        defaultValue='<p><a href="javascript:alert(1)">Ramesh</a></p>'
      />,
    );
    expect(container.innerHTML).not.toMatch(/javascript:/i);
    expect(screen.getByRole('textbox').textContent).toBe('Ramesh');
  });
});

describe('RichTextEditor: pasted content goes through the schema', () => {
  function paste(container: HTMLElement, html: string) {
    act(() => {
      editorOf(container).view.pasteHTML(html);
    });
  }

  it('drops scripts, handlers, styles, iframes and images, keeping the text and the allowed formatting', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditorImpl label="Note" onChange={onChange} />,
    );
    paste(
      container,
      '<p onclick="steal()" style="color:red">Ramesh <b>stable</b></p>' +
        '<script>steal()</script><iframe src="https://evil.example"></iframe>' +
        '<img src=x onerror="steal()"><style>p{display:none}</style>' +
        '<div class="x"><span style="font-size:99px">on ward</span></div>',
    );
    const html = onChange.mock.calls.at(-1)?.[0] as string;
    expect(html).toContain('<strong>stable</strong>');
    expect(html).toContain('Ramesh');
    expect(html).toContain('on ward');
    for (const banned of [
      'onclick',
      'onerror',
      'style',
      '<script',
      '<iframe',
      '<img',
      'steal',
      'class=',
    ]) {
      expect(html, banned).not.toContain(banned);
    }
    expect(container.querySelector('script, iframe, img')).toBeNull();
  });

  it('drops a pasted javascript: link but keeps its text, and keeps a safe link', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditorImpl label="Note" onChange={onChange} />,
    );
    paste(
      container,
      '<p><a href="javascript:alert(1)">bad</a> <a href="https://example.org">good</a> <a href="data:text/html,x">data</a></p>',
    );
    const html = onChange.mock.calls.at(-1)?.[0] as string;
    expect(html).not.toMatch(/javascript:|data:/i);
    expect(html).toContain('href="https://example.org"');
    expect(html).toContain('bad');
  });

  it('turns a pasted code block, table or heading level 5 into what the schema allows', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditorImpl label="Note" onChange={onChange} />,
    );
    paste(
      container,
      '<pre><code>x = 1</code></pre><table><tr><td>Hb 11</td></tr></table><h5>Plan</h5>',
    );
    const html = onChange.mock.calls.at(-1)?.[0] as string;
    expect(html).not.toMatch(/<pre|<table|<td|<h5/);
    expect(html).toContain('x = 1');
    expect(html).toContain('Hb 11');
    expect(html).toContain('Plan');
  });
});

describe('RichTextEditor: readOnly and disabled', () => {
  it('readOnly draws no toolbar, is not editable and still reads as a textbox', () => {
    render(
      <RichTextEditorImpl
        label="Discharge summary"
        readOnly
        defaultValue="<p>Ramesh was discharged</p>"
      />,
    );
    expect(screen.queryByRole('toolbar')).toBeNull();
    const box = screen.getByRole('textbox', { name: 'Discharge summary' });
    expect(box.getAttribute('contenteditable')).toBe('false');
    expect(box.getAttribute('aria-readonly')).toBe('true');
    // Focusable, so the keyboard can reach the text to scroll and select it.
    expect(box.tabIndex).toBe(0);
    expect(box.textContent).toBe('Ramesh was discharged');
  });

  it('readOnly takes no edits', () => {
    const { container } = render(
      <RichTextEditorImpl label="Note" readOnly defaultValue="<p>Ramesh</p>" />,
    );
    expect(editorOf(container).isEditable).toBe(false);
  });

  it('readOnly leaves a checklist untickable', () => {
    render(
      <RichTextEditorImpl
        label="Note"
        readOnly
        defaultValue='<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Done</p></li></ul>'
      />,
    );
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it('disabled keeps the toolbar but disables every button, and takes the editor out of the tab order', () => {
    render(<RichTextEditorImpl label="Note" disabled />);
    const buttons = within(screen.getByRole('toolbar')).getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
    const box = screen.getByRole('textbox');
    expect(box.getAttribute('contenteditable')).toBe('false');
    expect(box.getAttribute('aria-disabled')).toBe('true');
    expect(box.tabIndex).toBe(-1);
  });
});

describe('RichTextEditor: health data never reaches the console', () => {
  it('logs nothing while a note with a patient name is edited, formatted, linked and pasted', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const { container, unmount } = render(
      <RichTextEditorImpl
        label="Note"
        defaultValue="<p>Ramesh</p>"
        maxLength={20}
        onChange={() => undefined}
      />,
    );
    act(() => {
      editorOf(container).commands.selectAll();
    });
    fireEvent.click(toolbarButton('Bold'));
    fireEvent.click(toolbarButton('Link'));
    fireEvent.change(screen.getByLabelText('Link address'), {
      target: { value: `${SCRIPT}:Ramesh` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply link' }));
    act(() => {
      editorOf(container).view.pasteHTML(
        '<script>Ramesh</script><p>Ramesh</p>',
      );
    });
    unmount();
    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });
});

describe('RichTextEditor: the lazy public component', () => {
  it('loads the editor on demand and shows the label meanwhile', async () => {
    render(
      <RichTextEditor
        label="Clinical note"
        defaultValue="<p>Ramesh</p>"
        toolbar={['marks']}
      />,
    );
    expect(screen.getByText('Clinical note')).toBeTruthy();
    const box = await screen.findByRole('textbox', { name: 'Clinical note' });
    expect(box.textContent).toBe('Ramesh');
    expect(screen.getByRole('toolbar')).toBeTruthy();
  });
});
