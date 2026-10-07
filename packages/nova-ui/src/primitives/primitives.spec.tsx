import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { cx } from './cx';
import { focusRing } from './focus-ring';
import { nextRovingIndex, RADIO_KEYS, ROW_KEYS } from './roving-index';
import { Surface, SURFACE_MATERIALS, SURFACE_RADII } from './surface';
import { useControllableState } from './use-controllable-state';
import { VisuallyHidden } from './visually-hidden';

afterEach(() => cleanup());

describe('cx', () => {
  it('joins class names and drops falsy parts', () => {
    expect(cx('a', false, 'b', null, undefined, '', 'c')).toBe('a b c');
  });

  it('returns an empty string when nothing is given', () => {
    expect(cx()).toBe('');
  });
});

describe('focusRing', () => {
  it('only shows the ring for keyboard focus, at the focus width and offset tokens', () => {
    expect(focusRing).toContain('focus-visible:outline-focus');
    expect(focusRing).toContain('focus-visible:outline-offset-focus');
    expect(focusRing).not.toMatch(/(^|\s)focus:/);
  });

  // The brand ring is ~2:1 on the dark chrome and hero, below the 3:1 a focus indicator needs.
  // The ring colour is a token a surface can override, falling back to the brand where unset.
  it('takes its colour from --nova-focus-ring, falling back to the brand primary', () => {
    expect(focusRing).toContain(
      'focus-visible:outline-[var(--nova-focus-ring,var(--nova-color-primary))]',
    );
  });
});

describe('VisuallyHidden', () => {
  it('keeps text for assistive tech while hiding it visually', () => {
    render(<VisuallyHidden>Up</VisuallyHidden>);
    const node = screen.getByText('Up');
    expect(node.tagName).toBe('SPAN');
    expect(node.classList.contains('sr-only')).toBe(true);
  });

  it('renders as another element when asked, so it can hold block content such as a table', () => {
    render(<VisuallyHidden as="div">Table</VisuallyHidden>);
    const node = screen.getByText('Table');
    expect(node.tagName).toBe('DIV');
    expect(node.classList.contains('sr-only')).toBe(true);
  });
});

describe('Surface', () => {
  it('maps every material role to its nova utility, so components never repeat surface CSS', () => {
    for (const material of SURFACE_MATERIALS) {
      cleanup();
      render(<Surface material={material}>{material}</Surface>);
      const node = screen.getByText(material);
      expect(node.classList.contains(`nova-${material}`)).toBe(true);
      expect(node.dataset['surface']).toBe(material);
    }
  });

  const corners = (text: string) =>
    screen.getByText(text).className.match(/rounded-[\w-]+/g);

  it('draws exactly one radius role, the overlay corner by default', () => {
    render(
      <>
        <Surface material="surface">default</Surface>
        <Surface material="surface" radius="control">
          control
        </Surface>
        <Surface material="card" radius="card">
          card
        </Surface>
        <Surface material="hero" radius="hero">
          hero
        </Surface>
      </>,
    );
    expect(corners('default')).toEqual(['rounded-overlay']);
    expect(corners('control')).toEqual(['rounded-control']);
    expect(corners('card')).toEqual(['rounded-card']);
    expect(corners('hero')).toEqual(['rounded-hero']);
  });

  // A frame (the sidebar, the top bar, a header that fills its parent's edge) is square, and says
  // so: it never relies on a later rounded-none winning over the default corner.
  it('draws a square frame with radius="none" and no other corner', () => {
    render(
      <Surface material="chrome" radius="none">
        frame
      </Surface>,
    );
    expect(corners('frame')).toEqual(['rounded-none']);
  });

  it('takes every radius role and none, and no scale name', () => {
    for (const radius of [...SURFACE_RADII]) {
      cleanup();
      render(
        <Surface material="surface" radius={radius}>
          {radius}
        </Surface>,
      );
      expect(corners(radius)).toEqual([`rounded-${radius}`]);
    }
    expect([...SURFACE_RADII].sort()).toEqual(
      [
        'card',
        'chip',
        'control',
        'hero',
        'none',
        'overlay',
        'pill',
        'tag',
      ].sort(),
    );
  });

  it('renders as another element, merges className and forwards its ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Surface
        as="section"
        material="data"
        className="p-card"
        ref={ref}
        aria-label="Beds"
      >
        beds
      </Surface>,
    );
    const node = screen.getByRole('region', { name: 'Beds' });
    expect(node.tagName).toBe('SECTION');
    expect(node.classList.contains('p-card')).toBe(true);
    expect(ref.current).toBe(node);
  });
});

describe('useControllableState', () => {
  it('owns the value when uncontrolled and reports changes', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ defaultValue: 'a', onChange }),
    );
    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('follows the caller when controlled and never changes on its own', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: 'a', defaultValue: 'z', onChange }),
    );
    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('a');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('picks up a new controlled value', () => {
    function Harness() {
      const [outer, setOuter] = useState('a');
      const [value] = useControllableState({ value: outer, defaultValue: 'z' });
      return (
        <button type="button" onClick={() => setOuter('b')}>
          {value}
        </button>
      );
    }
    render(<Harness />);
    act(() => screen.getByRole('button').click());
    expect(screen.getByRole('button').textContent).toBe('b');
  });
});

describe('nextRovingIndex', () => {
  it('steps and wraps with the arrows, and jumps to the ends with Home and End', () => {
    expect(nextRovingIndex('ArrowRight', 0, 2)).toBe(1);
    expect(nextRovingIndex('ArrowRight', 2, 2)).toBe(0);
    expect(nextRovingIndex('ArrowDown', 1, 2)).toBe(2);
    expect(nextRovingIndex('ArrowLeft', 0, 2)).toBe(2);
    expect(nextRovingIndex('ArrowUp', 2, 2)).toBe(1);
    expect(nextRovingIndex('Home', 2, 2)).toBe(0);
    expect(nextRovingIndex('End', 0, 2)).toBe(2);
  });

  it('names the row keys and the radio keys (a radio group also reads Up and Down)', () => {
    expect([...ROW_KEYS]).toEqual(['ArrowLeft', 'ArrowRight', 'Home', 'End']);
    expect([...RADIO_KEYS]).toEqual([...ROW_KEYS, 'ArrowUp', 'ArrowDown']);
  });
});
