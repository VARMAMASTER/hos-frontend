import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inertOutside } from './inert';

function element(id: string): HTMLElement {
  const el = document.createElement('div');
  el.id = id;
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
});
afterEach(() => {
  document.body.innerHTML = '';
});

describe('inertOutside', () => {
  it('makes every other child of <body> inert, and leaves the kept one alone', () => {
    const app = element('app');
    const keep = element('keep');
    const toasts = element('toasts');
    inertOutside(keep);
    expect(app.hasAttribute('inert')).toBe(true);
    expect(toasts.hasAttribute('inert')).toBe(true);
    expect(keep.hasAttribute('inert')).toBe(false);
  });

  // A dialog portalled into a themed root sits deep in the page, not directly under <body>.
  it('inerts the siblings at every level above a nested layer, and never its ancestors', () => {
    const app = element('app');
    const themed = element('themed');
    const content = document.createElement('main');
    const keep = document.createElement('div');
    themed.append(content, keep);
    const release = inertOutside(keep);
    expect(app.hasAttribute('inert')).toBe(true);
    expect(content.hasAttribute('inert')).toBe(true);
    expect(themed.hasAttribute('inert')).toBe(false);
    expect(keep.hasAttribute('inert')).toBe(false);
    release();
    expect(app.hasAttribute('inert')).toBe(false);
    expect(content.hasAttribute('inert')).toBe(false);
  });

  it('restores everything it changed', () => {
    const app = element('app');
    const keep = element('keep');
    const release = inertOutside(keep);
    release();
    expect(app.hasAttribute('inert')).toBe(false);
  });

  it('does not strip inert that was already there', () => {
    const app = element('app');
    app.setAttribute('inert', '');
    const keep = element('keep');
    const release = inertOutside(keep);
    release();
    expect(app.hasAttribute('inert')).toBe(true);
  });

  it('is safe to release twice', () => {
    const app = element('app');
    const keep = element('keep');
    const release = inertOutside(keep);
    release();
    release();
    expect(app.hasAttribute('inert')).toBe(false);
  });

  it('does not inert a layer that sits above it, so dialogs mounting together all stay live', () => {
    const app = element('app');
    const bottom = element('bottom');
    bottom.setAttribute('data-nova-layer', '');
    const top = element('top');
    top.setAttribute('data-nova-layer', '');
    // The bottom layer's effect runs first, while the top layer is already in the document.
    const releaseBottom = inertOutside(bottom);
    expect(top.hasAttribute('inert')).toBe(false);
    expect(app.hasAttribute('inert')).toBe(true);
    // The top layer's effect then covers the bottom one.
    const releaseTop = inertOutside(top);
    expect(bottom.hasAttribute('inert')).toBe(true);
    expect(top.hasAttribute('inert')).toBe(false);
    releaseTop();
    expect(bottom.hasAttribute('inert')).toBe(false);
    releaseBottom();
    expect(app.hasAttribute('inert')).toBe(false);
  });

  it('still inerts other things that come after it, which are not layers', () => {
    const keep = element('keep');
    keep.setAttribute('data-nova-layer', '');
    const toasts = element('toasts');
    inertOutside(keep);
    expect(toasts.hasAttribute('inert')).toBe(true);
  });

  it('keeps stacked layers correct when they close in order', () => {
    const app = element('app');
    const first = element('first');
    const releaseFirst = inertOutside(first);
    const second = element('second');
    const releaseSecond = inertOutside(second);
    expect(first.hasAttribute('inert')).toBe(true);
    expect(app.hasAttribute('inert')).toBe(true);
    releaseSecond();
    expect(first.hasAttribute('inert')).toBe(false);
    expect(app.hasAttribute('inert')).toBe(true);
    releaseFirst();
    expect(app.hasAttribute('inert')).toBe(false);
  });

  it('keeps stacked layers correct when they close out of order', () => {
    const app = element('app');
    const first = element('first');
    const releaseFirst = inertOutside(first);
    const second = element('second');
    const releaseSecond = inertOutside(second);
    releaseFirst();
    // The second layer is still open, so the page must stay inert behind it.
    expect(app.hasAttribute('inert')).toBe(true);
    expect(first.hasAttribute('inert')).toBe(true);
    releaseSecond();
    expect(app.hasAttribute('inert')).toBe(false);
    expect(first.hasAttribute('inert')).toBe(false);
  });
});
