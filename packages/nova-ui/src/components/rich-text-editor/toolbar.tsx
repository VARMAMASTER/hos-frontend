import {
  useEffect,
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
  useRef,
} from 'react';
import type { ChainedCommands, Editor } from '@tiptap/react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Tooltip } from '../tooltip/tooltip';
import type { RichTextToolbarGroup } from './types';

// A keyboard shortcut, written once and shown per platform: Ctrl+Shift+B, or the Mac glyphs.
interface Shortcut {
  key: string;
  shift?: boolean;
  alt?: boolean;
}

function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
}

// The keys in order (modifier, Alt, Shift, key), joined by + for the text forms.
function chord({ key, shift, alt }: Shortcut, modifier: string): string[] {
  const keys = [modifier];
  if (alt) keys.push('Alt');
  if (shift) keys.push('Shift');
  keys.push(key);
  return keys;
}

export function shortcutLabel(shortcut: Shortcut): string {
  if (isMac()) {
    const { key, shift, alt } = shortcut;
    return `⌘${alt ? '⌥' : ''}${shift ? '⇧' : ''}${key}`;
  }
  return chord(shortcut, 'Ctrl').join('+');
}

// The WAI-ARIA name of the same shortcut, for aria-keyshortcuts.
function shortcutKeys(shortcut: Shortcut): string {
  return chord(shortcut, isMac() ? 'Meta' : 'Control').join('+');
}

interface Tool {
  id: string;
  label: string;
  shortcut: Shortcut;
  icon: ReactNode;
  isActive: (editor: Editor) => boolean;
  // The command it runs; the link button opens the link editor instead and has none.
  run?: (chain: ChainedCommands) => ChainedCommands;
}

const iconProps = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  className: 'size-icon-md',
};

// Letters stand in for the text marks, so they read as what they do.
const glyph = (text: string, className?: string) => (
  <span
    aria-hidden="true"
    className={cx('text-control leading-none', className)}
  >
    {text}
  </span>
);

const TOOLS: Record<string, Tool> = {
  h1: {
    id: 'h1',
    label: 'Heading 1',
    shortcut: { key: '1', alt: true },
    icon: glyph('H1', 'font-bold'),
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
    run: (chain) => chain.toggleHeading({ level: 1 }),
  },
  h2: {
    id: 'h2',
    label: 'Heading 2',
    shortcut: { key: '2', alt: true },
    icon: glyph('H2', 'font-bold'),
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
    run: (chain) => chain.toggleHeading({ level: 2 }),
  },
  h3: {
    id: 'h3',
    label: 'Heading 3',
    shortcut: { key: '3', alt: true },
    icon: glyph('H3', 'font-bold'),
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
    run: (chain) => chain.toggleHeading({ level: 3 }),
  },
  bold: {
    id: 'bold',
    label: 'Bold',
    shortcut: { key: 'B' },
    icon: glyph('B', 'font-bold'),
    isActive: (editor) => editor.isActive('bold'),
    run: (chain) => chain.toggleBold(),
  },
  italic: {
    id: 'italic',
    label: 'Italic',
    shortcut: { key: 'I' },
    icon: glyph('I', 'italic'),
    isActive: (editor) => editor.isActive('italic'),
    run: (chain) => chain.toggleItalic(),
  },
  underline: {
    id: 'underline',
    label: 'Underline',
    shortcut: { key: 'U' },
    icon: glyph('U', 'underline'),
    isActive: (editor) => editor.isActive('underline'),
    run: (chain) => chain.toggleUnderline(),
  },
  strike: {
    id: 'strike',
    label: 'Strikethrough',
    shortcut: { key: 'S', shift: true },
    icon: glyph('S', 'line-through'),
    isActive: (editor) => editor.isActive('strike'),
    run: (chain) => chain.toggleStrike(),
  },
  code: {
    id: 'code',
    label: 'Inline code',
    shortcut: { key: 'E' },
    icon: glyph('</>', 'font-mono'),
    isActive: (editor) => editor.isActive('code'),
    run: (chain) => chain.toggleCode(),
  },
  bulletList: {
    id: 'bulletList',
    label: 'Bulleted list',
    shortcut: { key: '8', shift: true },
    icon: (
      <svg {...iconProps}>
        <path d="M7.5 5h9M7.5 10h9M7.5 15h9" />
        <path d="M3.5 5h.01M3.5 10h.01M3.5 15h.01" strokeWidth={2.5} />
      </svg>
    ),
    isActive: (editor) => editor.isActive('bulletList'),
    run: (chain) => chain.toggleBulletList(),
  },
  orderedList: {
    id: 'orderedList',
    label: 'Numbered list',
    shortcut: { key: '7', shift: true },
    icon: (
      <svg {...iconProps}>
        <path d="M8 5h8.5M8 10h8.5M8 15h8.5" />
        <path d="M3 4.25 4 3.75V7M3 11.5c0-.8 2-.8 2 .1 0 .9-2 1.4-2 2.4h2" />
      </svg>
    ),
    isActive: (editor) => editor.isActive('orderedList'),
    run: (chain) => chain.toggleOrderedList(),
  },
  taskList: {
    id: 'taskList',
    label: 'Checklist',
    shortcut: { key: '9', shift: true },
    icon: (
      <svg {...iconProps}>
        <path d="M3 4.5h4v4H3zM3 11.5h4v4H3z" />
        <path d="M4 14l.8.8L6.2 13M10 6.5h7M10 13.5h7" />
      </svg>
    ),
    isActive: (editor) => editor.isActive('taskList'),
    run: (chain) => chain.toggleTaskList(),
  },
  blockquote: {
    id: 'blockquote',
    label: 'Quote',
    shortcut: { key: 'B', shift: true },
    icon: (
      <svg {...iconProps}>
        <path d="M4 4v12M8 6h8M8 10h8M8 14h5" />
      </svg>
    ),
    isActive: (editor) => editor.isActive('blockquote'),
    run: (chain) => chain.toggleBlockquote(),
  },
  link: {
    id: 'link',
    label: 'Link',
    shortcut: { key: 'K' },
    icon: (
      <svg {...iconProps}>
        <path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.8-2.8a3 3 0 0 0-4.2-4.2l-.9.9" />
        <path d="M11.5 8.5a3 3 0 0 0-4.2 0l-2.8 2.8a3 3 0 0 0 4.2 4.2l.9-.9" />
      </svg>
    ),
    isActive: (editor) => editor.isActive('link'),
  },
  undo: {
    id: 'undo',
    label: 'Undo',
    shortcut: { key: 'Z' },
    icon: (
      <svg {...iconProps}>
        <path d="M7 4 3.5 7.5 7 11M3.5 7.5H12a4.5 4.5 0 0 1 0 9H8" />
      </svg>
    ),
    isActive: () => false,
    run: (chain) => chain.undo(),
  },
  redo: {
    id: 'redo',
    label: 'Redo',
    shortcut: { key: 'Z', shift: true },
    icon: (
      <svg {...iconProps}>
        <path d="M13 4l3.5 3.5L13 11M16.5 7.5H8a4.5 4.5 0 0 0 0 9h4" />
      </svg>
    ),
    isActive: () => false,
    run: (chain) => chain.redo(),
  },
};

const GROUP_TOOLS: Record<RichTextToolbarGroup, string[]> = {
  headings: ['h1', 'h2', 'h3'],
  marks: ['bold', 'italic', 'underline', 'strike', 'code'],
  lists: ['bulletList', 'orderedList', 'taskList'],
  quote: ['blockquote'],
  link: ['link'],
  history: ['undo', 'redo'],
};

export interface ToolbarProps {
  editor: Editor;
  groups: readonly RichTextToolbarGroup[];
  label: string;
  disabled: boolean;
  onLink: () => void;
}

type ToolStates = Record<string, { active: boolean; can: boolean }>;

// Whether each button's mark or node is active here, and whether its command can run at the cursor
// (so it can be disabled when it cannot). No .focus() in the check: before the view is mounted its
// focus command reports false, which would leave every button disabled.
function readToolStates(
  editor: Editor,
  groups: readonly RichTextToolbarGroup[],
): ToolStates {
  const states: ToolStates = {};
  for (const group of groups) {
    for (const id of GROUP_TOOLS[group]) {
      const tool = TOOLS[id];
      if (!tool) continue;
      states[id] = {
        active: tool.isActive(editor),
        can: tool.run
          ? tool.run(editor.can().chain()).run()
          : editor.isEditable,
      };
    }
  }
  return states;
}

// The states are read again on every transaction, and also on mount and create: the editor's view is
// attached to the page just after the first render, with no transaction to follow, so a read made
// before that would stay stale (a command cannot run on a view that is not there yet).
function useToolStates(
  editor: Editor,
  groups: readonly RichTextToolbarGroup[],
): ToolStates {
  const [states, setStates] = useState(() => readToolStates(editor, groups));
  const groupsKey = groups.join();
  useEffect(() => {
    const read = () => {
      const next = readToolStates(editor, groups);
      setStates((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    read();
    editor.on('transaction', read);
    editor.on('mount', read);
    editor.on('create', read);
    return () => {
      editor.off('transaction', read);
      editor.off('mount', read);
      editor.off('create', read);
    };
    // groups is keyed by its content, so a new array with the same groups does not resubscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, groupsKey]);
  return states;
}

// The toolbar is a roving-tabindex widget: one tab stop, then the arrow keys, Home and End move
// between the buttons that can be used (a disabled button cannot take focus, so it is skipped).
export function Toolbar({
  editor,
  groups,
  label,
  disabled,
  onLink,
}: ToolbarProps) {
  const states = useToolStates(editor, groups);
  const rootRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sections = groups
    .map((group) =>
      GROUP_TOOLS[group].flatMap((id) => {
        const tool = TOOLS[id];
        return tool ? [tool] : [];
      }),
    )
    .filter((tools) => tools.length > 0);

  const isDisabled = (tool: Tool) =>
    disabled || !(states[tool.id]?.can ?? false);
  const enabledIds = sections
    .flat()
    .filter((tool) => !isDisabled(tool))
    .map((tool) => tool.id);
  const tabStop =
    activeId !== null && enabledIds.includes(activeId)
      ? activeId
      : (enabledIds[0] ?? null);

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)',
      ) ?? [],
    );
    const current = buttons.findIndex(
      (button) => button === document.activeElement,
    );
    if (current === -1) return;
    let next: number;
    if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
    else if (event.key === 'ArrowLeft')
      next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    const target = buttons[next];
    target?.focus();
    setActiveId(target?.dataset['tool'] ?? null);
  };

  const press = (tool: Tool) => {
    setActiveId(tool.id);
    if (!tool.run) {
      onLink();
      return;
    }
    tool.run(editor.chain().focus()).run();
  };

  return (
    // A hairline under a panel-2 strip, as the prototype's card header draws it.
    <div
      ref={rootRef}
      role="toolbar"
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={move}
      className="flex flex-wrap items-center gap-s1 border-b border-border bg-surface-2 px-s2 py-s1"
    >
      {sections.map((tools, index) => (
        <div key={tools[0]?.id} className="flex items-center gap-s0">
          {index > 0 ? (
            <span
              role="separator"
              aria-orientation="vertical"
              className="mr-s1 h-s7 w-px bg-border-strong"
            />
          ) : null}
          {tools.map((tool) => {
            const active = states[tool.id]?.active ?? false;
            const key = `${baseId}-${tool.id}`;
            return (
              <Tooltip
                key={key}
                placement="bottom"
                content={
                  <span className="flex items-center gap-s3">
                    {tool.label}
                    <kbd className="font-mono text-meta text-ink-2">
                      {shortcutLabel(tool.shortcut)}
                    </kbd>
                  </span>
                }
              >
                <button
                  type="button"
                  data-tool={tool.id}
                  aria-label={tool.label}
                  aria-pressed={active}
                  aria-keyshortcuts={shortcutKeys(tool.shortcut)}
                  disabled={isDisabled(tool)}
                  tabIndex={tabStop === tool.id ? 0 : -1}
                  // Keep the selection in the editor: a click on a button must not blur it first.
                  onMouseDown={(event) => event.preventDefault()}
                  onFocus={() => setActiveId(tool.id)}
                  onClick={() => press(tool)}
                  className={cx(
                    'inline-flex size-s9 items-center justify-center rounded-control border text-ink-2 transition-colors',
                    'border-transparent hover:bg-primary-ghost hover:text-ink',
                    // Pressed is a fill and a drawn edge, so it never relies on colour alone.
                    'aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-strong',
                    focusRing,
                    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
                  )}
                >
                  {tool.icon}
                </button>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}
