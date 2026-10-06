interface InertRecord {
  count: number;
  wasInert: boolean;
}

// Per element, so two layers that share a sibling (stacked dialogs) each undo only their own claim.
const records = new WeakMap<Element, InertRecord>();

// Makes everything else on the page inert (unfocusable, unclickable, and hidden from assistive
// technology), which is what makes a modal modal. `keep` is the layer that stays live. It may sit
// directly under <body> or deeper (a dialog portalled into a themed root): at every level from `keep`
// up to <body>, the siblings of the path are made inert and the path itself is left alone. Returns
// the function that undoes it; calling that twice is harmless.
//
// A live region marked data-nova-live-region (the Toaster's) is never made inert, and neither is the
// path from it up to <body>: inert content is hidden from assistive technology, and a clinician has
// to hear "Save failed" while a dialog is open. A sibling that merely contains a live region is not
// inerted whole; its other children are, one by one.
//
// A layer marked data-nova-layer that sits after the path is above it and is left alone. Without
// that, two dialogs mounting in one commit would have the first inert the second, which is already in
// the document by the time the first one's effect runs.
const LIVE_REGION = '[data-nova-live-region]';

// Adds `element` to the elements to make inert, unless it is a live region. One that holds a live
// region is split into its children, so only the parts without one go inert.
function collect(element: Element, targets: Element[]): void {
  if (element.hasAttribute('data-nova-live-region')) return;
  if (element.querySelector(LIVE_REGION)) {
    for (const child of Array.from(element.children)) collect(child, targets);
  } else {
    targets.push(element);
  }
}

export function inertOutside(keep: Element): () => void {
  const targets: Element[] = [];
  for (
    let node: Element = keep;
    node !== document.body && node.parentElement !== null;
    node = node.parentElement
  ) {
    const siblings = Array.from(node.parentElement.children);
    const index = siblings.indexOf(node);
    for (const [at, element] of siblings.entries()) {
      if (element === node) continue;
      if (at > index && element.hasAttribute('data-nova-layer')) continue;
      collect(element, targets);
    }
  }
  for (const element of targets) {
    const record = records.get(element);
    if (record) {
      record.count += 1;
    } else {
      records.set(element, {
        count: 1,
        wasInert: element.hasAttribute('inert'),
      });
      element.setAttribute('inert', '');
    }
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const element of targets) {
      const record = records.get(element);
      if (!record) continue;
      record.count -= 1;
      if (record.count > 0) continue;
      records.delete(element);
      // Leave inert alone if it was there before the dialog came and not ours to remove.
      if (!record.wasInert) element.removeAttribute('inert');
    }
  };
}
