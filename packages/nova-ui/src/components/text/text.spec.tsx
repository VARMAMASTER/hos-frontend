import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Text } from './text';

afterEach(() => cleanup());

describe('Text Component', () => {
  it('renders paragraph with body styling by default', () => {
    render(<Text>Patient is stable.</Text>);
    const p = screen.getByText('Patient is stable.');
    expect(p.tagName).toBe('P');
    expect(p.className).toContain('text-body');
    expect(p.className).toContain('text-ink');
  });

  it('renders requested polymorphic element and tone', () => {
    render(
      <Text as="span" tone="muted" size="sm">
        Secondary note
      </Text>,
    );
    const span = screen.getByText('Secondary note');
    expect(span.tagName).toBe('SPAN');
    expect(span.className).toContain('text-ink-2');
    expect(span.className).toContain('text-caption');
  });

  it('renders code and label variants correctly', () => {
    render(<Text variant="code">MRN-1029</Text>);
    const code = screen.getByText('MRN-1029');
    expect(code.className).toContain('font-mono');

    render(
      <Text as="label" variant="label">
        Blood Pressure
      </Text>,
    );
    const label = screen.getByText('Blood Pressure');
    expect(label.tagName).toBe('LABEL');
    expect(label.className).toContain('text-label');
  });

  it('applies multi-font family class when font prop is specified', () => {
    render(<Text font="mono">Monospace Text</Text>);
    const text = screen.getByText('Monospace Text');
    expect(text.className).toContain('font-mono');

    render(<Text font="display">Display Text</Text>);
    const disp = screen.getByText('Display Text');
    expect(disp.className).toContain('font-display');
  });
});
