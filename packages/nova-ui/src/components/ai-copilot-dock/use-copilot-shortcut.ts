import { useEffect, useLayoutEffect, useRef } from 'react';

export interface CopilotShortcutOptions {
  // Off, the shortcut is not listened for at all.
  enabled?: boolean;
}

const TEXT_INPUTS = new Set([
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
  'number',
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
]);

// Someone typing: in a text input, a text area or an editor. There Ctrl+K belongs to what they are
// typing in (a link in the rich-text editor), not to the copilot.
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest('[contenteditable]:not([contenteditable="false"])')) {
    return true;
  }
  if (target instanceof HTMLTextAreaElement) return true;
  return target instanceof HTMLInputElement && TEXT_INPUTS.has(target.type);
}

// Ctrl+K (Cmd+K on a Mac) anywhere on the page, the prototype's copilot shortcut. It does not fire
// while the person is typing in an input, a text area or a contenteditable editor, nor with Alt or
// Shift held, and when it fires it keeps the browser from using the key (some browsers focus their
// own search bar on Ctrl+K).
export function useCopilotShortcut(
  onTrigger: () => void,
  { enabled = true }: CopilotShortcutOptions = {},
): void {
  const handler = useRef(onTrigger);
  useLayoutEffect(() => {
    handler.current = onTrigger;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k') return;
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
        return;
      }
      if (event.defaultPrevented || event.isComposing) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      handler.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
