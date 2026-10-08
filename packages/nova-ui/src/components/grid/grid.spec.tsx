import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Grid } from './grid';

afterEach(() => cleanup());

describe('Grid Component', () => {
  it('renders CSS grid with specified columns and gap', () => {
    render(
      <Grid columns={4} gap="s4">
        <div>Item</div>
      </Grid>,
    );
    const grid = screen.getByText('Item').parentElement;
    expect(grid?.className).toContain('grid');
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('lg:grid-cols-4');
    expect(grid?.className).toContain('gap-s4');
  });

  it('supports polymorphic container tag', () => {
    render(
      <Grid as="section" columns={2}>
        <div>Col</div>
      </Grid>,
    );
    const grid = screen.getByText('Col').parentElement;
    expect(grid?.tagName).toBe('SECTION');
  });
});
