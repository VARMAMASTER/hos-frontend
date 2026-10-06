import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Menu, MenuItem } from '../components/menu/menu';
import { ModuleSwitcher } from '../components/module-switcher/module-switcher';
import { focusRing } from '../primitives/focus-ring';

afterEach(() => cleanup());

// jsdom does not inherit custom properties, so this spec does the one step it cannot: it walks the
// real DOM a component renders, nearest ancestor first, and takes --nova-focus-ring from the first
// element whose material utility (as theme.css really declares it) sets one. That is exactly how the
// browser resolves an inherited custom property, so the reviewer's scenario (a menu anchored in the
// dark chrome or the brand hero) is checked against the real markup and the real stylesheet.
const css = readFileSync(join(process.cwd(), 'src/styles/theme.css'), 'utf8');

function ringDeclaredBy(utility: string): string | undefined {
  const start = css.indexOf(`@utility ${utility} {`);
  if (start === -1) return undefined;
  const body = css.slice(start, css.indexOf('}', start));
  return /--nova-focus-ring:\s*([^;]+);/.exec(body)?.[1].trim();
}

// focusRing's own fallback when no ancestor sets the token.
const FALLBACK = /var\(--nova-focus-ring,(var\([^)]+\))\)/.exec(focusRing)?.[1];

function resolvedRing(element: Element): string | undefined {
  for (let node: Element | null = element; node; node = node.parentElement) {
    for (const name of Array.from(node.classList)) {
      if (!name.startsWith('nova-')) continue;
      const declared = ringDeclaredBy(name);
      if (declared) return declared;
    }
  }
  return FALLBACK;
}

describe('the keyboard focus ring a nested light surface resolves', () => {
  it('falls back to the brand primary on the page', () => {
    expect(FALLBACK).toBe('var(--nova-color-primary)');
  });

  it('is white for a control sitting on the chrome itself', () => {
    render(
      <div className="nova-chrome">
        <button type="button">Wards</button>
      </div>,
    );
    expect(resolvedRing(screen.getByRole('button', { name: 'Wards' }))).toBe(
      '#fff',
    );
  });

  it('is the brand primary for the module menu, an overlay anchored in the dark chrome', () => {
    render(
      <div className="nova-chrome">
        <ModuleSwitcher
          current="ipd"
          modules={[
            { id: 'ipd', label: 'IPD', group: 'Clinical' },
            { id: 'icu', label: 'ICU', group: 'Clinical' },
          ]}
        />
      </div>,
    );
    fireEvent.keyDown(screen.getByRole('button', { name: /Current module/ }), {
      key: 'ArrowDown',
    });
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' });
    const focused = document.activeElement as Element;
    expect(focused.getAttribute('role')).toBe('menuitemradio');
    expect(resolvedRing(focused)).toBe('var(--nova-color-primary)');
  });

  it('is the brand primary for a menu opened from the brand hero', () => {
    render(
      <div className="nova-hero">
        <Menu trigger={<button type="button">Actions</button>} defaultOpen>
          <MenuItem>Edit</MenuItem>
        </Menu>
      </div>,
    );
    const item = screen.getByRole('menuitem', { name: 'Edit' });
    expect(document.activeElement).toBe(item);
    expect(resolvedRing(item)).toBe('var(--nova-color-primary)');
  });
});
