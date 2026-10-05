interface InertRecord {
  count: number;
  wasInert: boolean;
}

// Per element, so two layers that share a sibling (stacked dialogs) each undo only their own claim.
const records = new WeakMap<Element, InertRecord>();

// Makes everything else directly under <body> inert (unfocusable, unclickable, and hidden from
// assistive technology), which is what makes a modal modal. `keep` is the layer that stays live.
// Returns the function that undoes it; calling that twice is harmless.
//
// A layer marked data-nova-layer that sits after `keep` is above it and is left alone. Without that,
// two dialogs mounting in one commit would have the first inert the second, which is already in the
// document by the time the first one's effect runs.
export function inertOutside(keep: Element): () => void {
  const children = Array.from(document.body.children);
  const keepIndex = children.indexOf(keep);
  const targets = children.filter(
    (element, index) =>
      element !== keep &&
      !(index > keepIndex && element.hasAttribute('data-nova-layer')),
  );
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
