import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Card, CardBody, CardFooter, CardHeader } from './card';

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

describe('Card, Apple-refined', () => {
  it('sets the title at 600 on the headline step and the supporting copy on callout', () => {
    render(<CardHeader title="Ward 4B" description="12 of 18 beds" />);
    const title = screen.getByRole('heading', { name: 'Ward 4B' });
    expect([...title.classList]).toEqual(
      expect.arrayContaining(['text-headline', 'font-semibold']),
    );
    expect(screen.getByText('12 of 18 beds').classList).toContain(
      'text-callout',
    );
  });

  it('pads the header, body and footer by 20 and lays the footer out space-between', () => {
    render(
      <Card>
        <CardHeader title="Claims" />
        <CardBody>body</CardBody>
        <CardFooter>
          <span>3 open</span>
          <button type="button">View</button>
        </CardFooter>
      </Card>,
    );
    const header = screen
      .getByRole('heading', { name: 'Claims' })
      .closest('.p-5');
    expect(header).not.toBeNull();
    expect(screen.getByText('body').classList).toContain('p-5');
    const footer = screen.getByText('3 open').parentElement as HTMLElement;
    expect([...footer.classList]).toEqual(
      expect.arrayContaining(['flex', 'justify-between', 'p-5', 'border-t']),
    );
  });

  it('presses an interactive card to scale(0.98), only when motion is welcome', () => {
    render(
      <>
        <Card interactive>pressable</Card>
        <Card>still</Card>
      </>,
    );
    const pressable = screen.getByText('pressable');
    expect(pressable.classList).toContain('motion-safe:active:scale-[0.98]');
    expect(pressable.dataset['interactive']).toBe('true');
    expect(screen.getByText('still').className).not.toMatch(/scale/);
  });

  it.each([
    ['panel', 'surface'],
    ['data', 'data'],
  ] as const)(
    'steps an interactive %s card from elevation 1 to 2 on hover, with no transition under reduced motion',
    (variant, token) => {
      render(
        <Card variant={variant} interactive>
          hover me
        </Card>,
      );
      const card = screen.getByText('hover me');
      expect(card.classList).toContain(
        `hover:[--nova-${token}-lift:var(--nova-elevation-2)]`,
      );
      expect(card.classList).toContain('motion-reduce:transition-none');
      expect(card.className).toMatch(/transition-\[[^\]]*box-shadow/);
    },
  );

  it.each(['panel', 'data'] as const)(
    'marks a selected %s card for the 2px primary border theme.css draws, and nothing else',
    (variant) => {
      render(
        <>
          <Card variant={variant} selected>
            chosen
          </Card>
          <Card variant={variant}>other</Card>
        </>,
      );
      const chosen = screen.getByText('chosen');
      expect(chosen.dataset['selected']).toBe('true');
      expect(chosen.className).not.toMatch(/shadow|ring-|border-2/);
      expect(screen.getByText('other').dataset['selected']).toBeUndefined();
    },
  );
});
