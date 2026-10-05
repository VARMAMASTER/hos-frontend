// Focus helpers for the dialog's trap. "Visible" is judged from computed style and the hidden and
// inert attributes rather than from geometry, so it behaves the same under jsdom (no layout) and
// in a browser.

const CANDIDATES = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

// The elements Tab can reach inside `root`, in DOM order. `root` itself is never included.
export function getTabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(CANDIDATES)).filter(
    (element) => isTabbable(element, root),
  );
}

function isTabbable(element: HTMLElement, root: HTMLElement): boolean {
  if (isDisabled(element)) return false;
  const tabindex = element.getAttribute('tabindex');
  if (tabindex !== null && Number.parseInt(tabindex, 10) < 0) return false;
  if (element.closest('[inert]')) return false;
  if (element instanceof HTMLInputElement) {
    if (element.type === 'hidden') return false;
    if (element.type === 'radio' && !isRadioStop(element, root)) return false;
  }
  // Only a <details>' first <summary> is a control; a stray one is not.
  if (
    element.localName === 'summary' &&
    !element.matches('details > summary:first-of-type')
  ) {
    return false;
  }
  return isRendered(element, root);
}

function isDisabled(element: HTMLElement): boolean {
  return element.matches(':disabled') || element.closest('fieldset[disabled]') !== null;
}

// Radios of one group (same name, same form) are a single stop: the checked one, or the first when
// none is checked. Arrow keys move within the group.
function isRadioStop(radio: HTMLInputElement, root: HTMLElement): boolean {
  if (!radio.name) return true;
  const group = Array.from(
    root.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  ).filter(
    (other) =>
      other.name === radio.name && other.form === radio.form && !other.disabled,
  );
  return (group.find((other) => other.checked) ?? group[0]) === radio;
}

function isRendered(element: HTMLElement, root: HTMLElement): boolean {
  // visibility is inherited, so the element's own computed value covers its ancestors.
  if (getComputedStyle(element).visibility === 'hidden') return false;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node === root ? null : node.parentElement
  ) {
    if (node.hidden || getComputedStyle(node).display === 'none') return false;
  }
  return true;
}

// Keeps Tab and Shift+Tab inside `panel`. Call it from a keydown listener and it takes over only
// at the edges: anywhere in the middle the browser's own order is already right and is left alone.
export function trapTab(event: KeyboardEvent, panel: HTMLElement): void {
  const tabbables = getTabbables(panel);
  const first = tabbables[0];
  const last = tabbables[tabbables.length - 1];
  if (!first || !last) {
    // Nothing to tab to: stay put rather than leave.
    event.preventDefault();
    panel.focus();
    return;
  }

  const active = document.activeElement;
  if (!(active instanceof Node) || !panel.contains(active)) {
    // Focus has already escaped; Tab brings it back in at the end it would have entered.
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return;
  }

  // The focused element need not be a tab stop itself (the panel is focused by script, a status
  // region may be), so ask whether any stop lies ahead in the direction of travel.
  const ahead = event.shiftKey
    ? Node.DOCUMENT_POSITION_PRECEDING
    : Node.DOCUMENT_POSITION_FOLLOWING;
  const somethingAhead = tabbables.some(
    (element) =>
      element !== active && (active.compareDocumentPosition(element) & ahead) !== 0,
  );
  if (!somethingAhead) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}
