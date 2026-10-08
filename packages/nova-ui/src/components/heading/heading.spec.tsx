import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Heading } from './heading';

afterEach(() => cleanup());

describe('Heading Component', () => {
  it('renders h2 by default with semantic ink color', () => {
    render(<Heading>Clinical Operations</Heading>);
    const heading = screen.getByRole('heading', { level: 2, name: 'Clinical Operations' });
    expect(heading).toBeTruthy();
    expect(heading.tagName).toBe('H2');
    expect(heading.className).toContain('text-ink');
  });

  it('renders requested heading level and tone', () => {
    render(<Heading level="h1" tone="crit">Critical Alert</Heading>);
    const heading = screen.getByRole('heading', { level: 1, name: 'Critical Alert' });
    expect(heading.tagName).toBe('H1');
    expect(heading.className).toContain('text-crit');
  });

  it('applies truncation class when truncate is true', () => {
    render(<Heading truncate>Long heading</Heading>);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.className).toContain('truncate');
  });

  it('applies explicit alignment and size overrides', () => {
    render(<Heading level="h3" size="display" align="center">Centered</Heading>);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.className).toContain('text-display');
    expect(heading.className).toContain('text-center');
  });
});
