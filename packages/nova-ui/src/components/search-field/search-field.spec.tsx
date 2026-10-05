import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SearchField } from './search-field';

afterEach(() => cleanup());

describe('SearchField', () => {
  it('is a searchbox named by its label', () => {
    render(<SearchField label="Search patients" />);
    const input = screen.getByRole('searchbox', { name: 'Search patients' });
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('type')).toBe('search');
    expect(screen.getByLabelText('Search patients')).toBe(input);
  });

  it('ties a visually hidden <label> to the input by id', () => {
    render(<SearchField label="Search patients" />);
    const input = screen.getByRole('searchbox');
    const label = screen.getByText('Search patients');
    expect(label.tagName).toBe('LABEL');
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.id).not.toBe('');
    expect(label.classList.contains('sr-only')).toBe(true);
  });

  it('can receive focus, which the prototype search box could not', () => {
    render(<SearchField label="Search patients" />);
    const input = screen.getByRole('searchbox');
    input.focus();
    expect(document.activeElement).toBe(input);
    expect(input.tabIndex).toBe(0);
  });

  it('reports the new value when the user types', () => {
    const onValueChange = vi.fn();
    render(
      <SearchField label="Search patients" onValueChange={onValueChange} />,
    );
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Ramesh' },
    });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('Ramesh');
  });

  it('still calls a native onChange handler as well', () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(
      <SearchField
        label="Search patients"
        onChange={onChange}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Ramesh' },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('Ramesh');
  });

  it('respects a caller-supplied id, on the input and in the label', () => {
    render(<SearchField label="Search patients" id="global-search" />);
    const input = screen.getByRole('searchbox');
    expect(input.id).toBe('global-search');
    expect(screen.getByText('Search patients').getAttribute('for')).toBe(
      'global-search',
    );
  });

  it('generates a distinct id for each field when none is given', () => {
    render(
      <>
        <SearchField label="Search patients" />
        <SearchField label="Search claims" />
      </>,
    );
    const first = screen.getByRole('searchbox', { name: 'Search patients' });
    const second = screen.getByRole('searchbox', { name: 'Search claims' });
    expect(first.id).not.toBe(second.id);
  });

  it('renders the icon and the shortcut hint, both hidden from assistive tech', () => {
    render(
      <SearchField
        label="Search patients"
        icon={<svg data-testid="icon" />}
        shortcutHint="Ctrl K"
      />,
    );
    expect(screen.getByTestId('icon').closest('[aria-hidden="true"]')).toBe(
      screen.getByTestId('icon').parentElement,
    );
    const hint = screen.getByText('Ctrl K');
    expect(hint.closest('[aria-hidden="true"]')).toBeTruthy();
    // Neither one changes the accessible name.
    expect(
      screen.getByRole('searchbox', { name: 'Search patients' }),
    ).toBeTruthy();
  });

  it('makes room for the icon and the hint only when they are given', () => {
    render(
      <>
        <SearchField label="Plain" />
        <SearchField label="Decorated" icon={<svg />} shortcutHint="Ctrl K" />
      </>,
    );
    const plain = screen.getByRole('searchbox', { name: 'Plain' });
    const decorated = screen.getByRole('searchbox', { name: 'Decorated' });
    expect(plain.classList.contains('pl-3')).toBe(true);
    expect(plain.classList.contains('pr-3')).toBe(true);
    expect(decorated.classList.contains('pl-10')).toBe(true);
    expect(decorated.classList.contains('pr-14')).toBe(true);
  });

  it('is drawn for the dark chrome: translucent white fill and rim, brand focus ring, secondary-ink placeholder', () => {
    render(<SearchField label="Search patients" />);
    const input = screen.getByRole('searchbox');
    for (const name of [
      'bg-on-primary/12',
      'border',
      'border-on-primary/25',
      'focus-visible:outline-primary',
      'placeholder:text-[color:var(--nova-chrome-ink-2)]',
    ]) {
      expect(input.classList.contains(name), name).toBe(true);
    }
    // nova-field is the light-canvas material.
    expect(input.classList.contains('nova-field')).toBe(false);
  });

  it('forwards its ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchField label="Search patients" ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('searchbox'));
  });

  it('passes input attributes through and merges a caller className onto the input', () => {
    render(
      <SearchField
        label="Search patients"
        placeholder="Name, MRN or phone"
        name="q"
        defaultValue="Ramesh"
        className="extra"
      />,
    );
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input.placeholder).toBe('Name, MRN or phone');
    expect(input.name).toBe('q');
    expect(input.value).toBe('Ramesh');
    expect(input.classList.contains('extra')).toBe(true);
  });
});
