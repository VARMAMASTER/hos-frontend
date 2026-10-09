// Test-only (never in the library build): what assistive technology gets from an element, so a spec
// asserts the words a screen reader reads instead of textContent, which also counts text inside
// aria-hidden subtrees that no screen reader ever reaches.

// The element's text with every aria-hidden subtree left out. Screen-reader-only text (sr-only,
// VisuallyHidden) outside a hidden subtree is kept: a screen reader reads it.
export function accessibleText(element: Element): string {
  if (element.getAttribute('aria-hidden') === 'true') return '';
  let text = '';
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === node.TEXT_NODE) text += node.textContent ?? '';
    else if (node.nodeType === node.ELEMENT_NODE) {
      text += accessibleText(node as Element);
    }
  }
  return text;
}

// Dead markup: screen-reader-only text inside a subtree assistive technology never reads.
export function deadScreenReaderText(element: Element): Element[] {
  return Array.from(element.querySelectorAll('[aria-hidden="true"] .sr-only'));
}

// The AI spark drawn as decoration: the SparkleCluster mark inside an aria-hidden subtree.
export function decorativeSpark(element: Element): Element | null {
  return element.querySelector('[aria-hidden="true"] [data-sparkle-cluster]');
}
