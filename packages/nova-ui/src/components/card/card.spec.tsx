import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Card, CardBody, CardHeader } from './card';

afterEach(() => cleanup());

describe('Card', () => {
  it('renders its title as an h2 by default, with description, actions and body', () => {
    render(
      <Card>
        <CardHeader
          title="Claims in flight"
          description="Every scheme's own clock"
          actions={<button type="button">File</button>}
        />
        <CardBody>3 claims</CardBody>
      </Card>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Claims in flight' }),
    ).toBeTruthy();
    expect(screen.getByText("Every scheme's own clock")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'File' })).toBeTruthy();
    expect(screen.getByText('3 claims')).toBeTruthy();
  });

  it('renders the title at the requested heading level', () => {
    render(<CardHeader title="Nested" headingLevel={3} />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Nested' }),
    ).toBeTruthy();
  });
});

describe('Card variant', () => {
  it('is a glass/solid panel by default', () => {
    render(<Card>default card</Card>);
    const card = screen.getByText('default card');
    expect(card.dataset['variant']).toBe('panel');
    expect(card.classList.contains('nova-surface')).toBe(true);
    expect(card.classList.contains('nova-data')).toBe(false);
  });

  it('renders the panel variant with the surface utility', () => {
    render(<Card variant="panel">panel card</Card>);
    const card = screen.getByText('panel card');
    expect(card.dataset['variant']).toBe('panel');
    expect(card.classList.contains('nova-surface')).toBe(true);
  });

  it('renders the data variant with the opaque data utility and none of the glass', () => {
    render(<Card variant="data">data card</Card>);
    const card = screen.getByText('data card');
    expect(card.dataset['variant']).toBe('data');
    expect(card.classList.contains('nova-data')).toBe(true);
    expect(card.classList.contains('nova-surface')).toBe(false);
  });

  it('does not paint an opaque fill, border or shadow over the glass panel', () => {
    // bg-surface would cover nova-surface's translucent fill and defeat the material.
    render(<Card>glass card</Card>);
    const card = screen.getByText('glass card');
    for (const flat of ['bg-surface', 'border', 'border-border', 'shadow-sm']) {
      expect(card.classList.contains(flat)).toBe(false);
    }
  });

  it.each(['panel', 'data'] as const)(
    'keeps the rounded corners, merges className and passes attributes through (%s)',
    (variant) => {
      render(
        <Card variant={variant} className="max-w-xl" id="claims">
          merged {variant}
        </Card>,
      );
      const card = screen.getByText(`merged ${variant}`);
      expect(card.classList.contains('rounded-lg')).toBe(true);
      expect(card.classList.contains('max-w-xl')).toBe(true);
      expect(card.id).toBe('claims');
    },
  );
});
