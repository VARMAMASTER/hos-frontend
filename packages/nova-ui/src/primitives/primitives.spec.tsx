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
import { Surface, SURFACE_MATERIALS } from './surface';
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
  it('only shows the ring for keyboard focus', () => {
    expect(focusRing).toContain('focus-visible:outline-2');
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

  it('defaults to a large radius and lets a caller choose another', () => {
    render(
      <>
        <Surface material="surface">default</Surface>
        <Surface material="surface" radius="sm">
          small
        </Surface>
      </>,
    );
    expect(screen.getByText('default').classList.contains('rounded-lg')).toBe(
      true,
    );
    expect(screen.getByText('small').classList.contains('rounded-sm')).toBe(
      true,
    );
  });

  it('renders as another element, merges className and forwards its ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Surface
        as="section"
        material="data"
        className="p-4"
        ref={ref}
        aria-label="Beds"
      >
        beds
      </Surface>,
    );
    const node = screen.getByRole('region', { name: 'Beds' });
    expect(node.tagName).toBe('SECTION');
    expect(node.classList.contains('p-4')).toBe(true);
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
