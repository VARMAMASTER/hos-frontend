import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getTabbables, trapTab } from './focus-trap';

function mount(html: string): HTMLElement {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  return document.getElementById('root') as HTMLElement;
}

function ids(elements: HTMLElement[]): string[] {
  return elements.map((el) => el.id);
}

beforeEach(() => {
  document.body.innerHTML = '';
});
afterEach(() => {
  document.body.innerHTML = '';
});

describe('getTabbables', () => {
  it('returns the natively focusable elements in DOM order', () => {
    const root = mount(`
      <a id="link" href="/x">x</a>
      <button id="button">b</button>
      <input id="input" />
      <select id="select"><option>a</option></select>
      <textarea id="textarea"></textarea>
      <div id="custom" tabindex="0"></div>
      <div id="editable" contenteditable="true"></div>
      <details><summary id="summary">s</summary><p>more</p></details>
    `);
    expect(ids(getTabbables(root))).toEqual([
      'link',
      'button',
      'input',
      'select',
      'textarea',
      'custom',
      'editable',
      'summary',
    ]);
  });

  it('skips what the browser would skip', () => {
    const root = mount(`
      <a id="no-href">x</a>
      <button id="disabled" disabled>b</button>
      <input id="hidden-input" type="hidden" />
      <button id="negative" tabindex="-1">b</button>
      <div id="plain"></div>
      <div id="editable-off" contenteditable="false"></div>
      <fieldset disabled><button id="in-disabled-fieldset">b</button></fieldset>
      <summary id="stray-summary">s</summary>
      <button id="ok">b</button>
    `);
    expect(ids(getTabbables(root))).toEqual(['ok']);
  });

  it('skips elements that are not rendered or not visible', () => {
    const root = mount(`
      <button id="attr-hidden" hidden>b</button>
      <div hidden><button id="in-hidden">b</button></div>
      <div style="display: none"><button id="in-display-none">b</button></div>
      <button id="visibility-hidden" style="visibility: hidden">b</button>
      <div inert><button id="in-inert">b</button></div>
      <button id="ok">b</button>
    `);
    expect(ids(getTabbables(root))).toEqual(['ok']);
  });

  it('counts only the root descendants, not the root itself', () => {
    document.body.innerHTML =
      '<div id="root" tabindex="0"><button id="b">b</button></div>';
    const root = document.getElementById('root') as HTMLElement;
    expect(ids(getTabbables(root))).toEqual(['b']);
  });
});

describe('getTabbables and radio groups', () => {
  it('counts only the checked radio of a group, as the browser does', () => {
    const root = mount(`
      <input id="a" type="radio" name="g" />
      <input id="b" type="radio" name="g" checked />
      <input id="c" type="radio" name="g" />
    `);
    expect(ids(getTabbables(root))).toEqual(['b']);
  });

  it('counts the first radio of a group with nothing checked', () => {
    const root = mount(`
      <input id="a" type="radio" name="g" />
      <input id="b" type="radio" name="g" />
    `);
    expect(ids(getTabbables(root))).toEqual(['a']);
  });

  it('counts one radio per group, and per form', () => {
    const root = mount(`
      <input id="g1a" type="radio" name="g1" />
      <input id="g1b" type="radio" name="g1" />
      <input id="g2a" type="radio" name="g2" />
      <form><input id="f1" type="radio" name="g1" /></form>
      <form><input id="f2" type="radio" name="g1" /></form>
    `);
    expect(ids(getTabbables(root))).toEqual(['g1a', 'g2a', 'f1', 'f2']);
  });

  it('skips a disabled first radio when choosing the stop of an unchecked group', () => {
    const root = mount(`
      <input id="a" type="radio" name="g" disabled />
      <input id="b" type="radio" name="g" />
    `);
    expect(ids(getTabbables(root))).toEqual(['b']);
  });

  it('treats a nameless radio as its own stop', () => {
    const root = mount(`
      <input id="a" type="radio" />
      <input id="b" type="radio" />
    `);
    expect(ids(getTabbables(root))).toEqual(['a', 'b']);
  });
});

describe('trapTab', () => {
  function tab(shiftKey = false): KeyboardEvent {
    return new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey,
      cancelable: true,
      bubbles: true,
    });
  }
  const panelWith = (html: string) => {
    const root = mount(html);
    root.tabIndex = -1;
    return root;
  };

  it('wraps Tab from the last element to the first', () => {
    const panel = panelWith(
      '<button id="a">a</button><button id="b">b</button>',
    );
    document.getElementById('b')?.focus();
    const event = tab();
    trapTab(event, panel);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('a');
  });

  it('wraps Shift+Tab from the first element to the last', () => {
    const panel = panelWith(
      '<button id="a">a</button><button id="b">b</button>',
    );
    document.getElementById('a')?.focus();
    const event = tab(true);
    trapTab(event, panel);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('b');
  });

  it('wraps Shift+Tab from the panel itself to the last element', () => {
    const panel = panelWith(
      '<button id="a">a</button><button id="b">b</button>',
    );
    panel.focus();
    const event = tab(true);
    trapTab(event, panel);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('b');
  });

  it('leaves Tab alone anywhere in the middle', () => {
    const panel = panelWith(
      '<button id="a">a</button><button id="b">b</button><button id="c">c</button>',
    );
    document.getElementById('b')?.focus();
    const forward = tab();
    trapTab(forward, panel);
    const backward = tab(true);
    trapTab(backward, panel);
    expect(forward.defaultPrevented).toBe(false);
    expect(backward.defaultPrevented).toBe(false);
    expect(document.activeElement?.id).toBe('b');
  });

  it('wraps from a focused element that is not itself a tab stop, once nothing lies ahead', () => {
    const panel = panelWith(`
      <div id="before" tabindex="-1"></div>
      <button id="a">a</button>
      <button id="b">b</button>
      <div id="status" tabindex="-1"></div>
    `);
    document.getElementById('status')?.focus();
    const forward = tab();
    trapTab(forward, panel);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('a');
    document.getElementById('before')?.focus();
    const backward = tab(true);
    trapTab(backward, panel);
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('b');
  });

  it('leaves Tab to the browser from a non-tab-stop that still has a stop ahead', () => {
    const panel = panelWith(`
      <button id="a">a</button>
      <div id="note" tabindex="-1"></div>
      <button id="b">b</button>
    `);
    document.getElementById('note')?.focus();
    const forward = tab();
    trapTab(forward, panel);
    const backward = tab(true);
    trapTab(backward, panel);
    expect(forward.defaultPrevented).toBe(false);
    expect(backward.defaultPrevented).toBe(false);
  });

  it('pulls focus back in when it has escaped the panel', () => {
    document.body.innerHTML =
      '<button id="outside">o</button><div id="root" tabindex="-1"><button id="a">a</button><button id="b">b</button></div>';
    const panel = document.getElementById('root') as HTMLElement;
    document.getElementById('outside')?.focus();
    const forward = tab();
    trapTab(forward, panel);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('a');
    document.getElementById('outside')?.focus();
    const backward = tab(true);
    trapTab(backward, panel);
    expect(document.activeElement?.id).toBe('b');
  });

  it('keeps focus on the panel when there is nothing to tab to', () => {
    const panel = panelWith('<p>Read only</p>');
    panel.focus();
    const event = tab();
    trapTab(event, panel);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(panel);
  });

  it('ignores a disabled or hidden element at the end when finding the last stop', () => {
    const panel = panelWith(`
      <button id="a">a</button>
      <button id="b">b</button>
      <button id="c" disabled>c</button>
      <button id="d" hidden>d</button>
    `);
    document.getElementById('b')?.focus();
    const event = tab();
    trapTab(event, panel);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('a');
  });

  it('wraps from a radio group that ends the panel, however it is entered', () => {
    const panel = panelWith(`
      <button id="a">a</button>
      <input id="r1" type="radio" name="g" />
      <input id="r2" type="radio" name="g" checked />
      <input id="r3" type="radio" name="g" />
    `);
    document.getElementById('r2')?.focus();
    const event = tab();
    trapTab(event, panel);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('a');
  });
});
