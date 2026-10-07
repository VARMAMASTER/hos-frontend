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
  it('is the prototype card by default: opaque under either material', () => {
    render(<Card>default card</Card>);
    const card = screen.getByText('default card');
    expect(card.dataset['variant']).toBe('panel');
    expect(card.classList.contains('nova-card')).toBe(true);
    expect(card.classList.contains('nova-surface')).toBe(false);
    expect(card.classList.contains('nova-data')).toBe(false);
  });

  it('renders the data variant with the opaque data utility (the gradient edge)', () => {
    render(<Card variant="data">data card</Card>);
    const card = screen.getByText('data card');
    expect(card.dataset['variant']).toBe('data');
    expect(card.classList.contains('nova-data')).toBe(true);
    expect(card.classList.contains('nova-card')).toBe(false);
  });

  it('renders the glass variant with the material-aware glass panel', () => {
    render(<Card variant="glass">glass card</Card>);
    expect(
      screen.getByText('glass card').classList.contains('nova-surface'),
    ).toBe(true);
  });

  it('paints nothing over the surface utility: fill, border and shadow come from it', () => {
    render(<Card>plain card</Card>);
    const card = screen.getByText('plain card');
    for (const flat of ['bg-surface', 'border', 'border-border', 'shadow-sm']) {
      expect(card.classList.contains(flat)).toBe(false);
    }
  });

  it.each(['panel', 'data', 'glass'] as const)(
    'rounds at the prototype card radius, merges className and passes attributes through (%s)',
    (variant) => {
      render(
        <Card variant={variant} className="max-w-xl" id="claims">
          merged {variant}
        </Card>,
      );
      const card = screen.getByText(`merged ${variant}`);
      expect(card.classList.contains('rounded-card')).toBe(true);
      expect(card.classList.contains('max-w-xl')).toBe(true);
      expect(card.id).toBe('claims');
    },
  );
});

describe('Card, the prototype .card-h and .card-b', () => {
  it('sets an h2 title as the prototype h2 (17px semibold) with the .tiny description beside it', () => {
    render(<CardHeader title="Ward 4B" description="12 of 18 beds" />);
    const title = screen.getByRole('heading', { name: 'Ward 4B' });
    expect([...title.classList]).toEqual(
      expect.arrayContaining(['text-title', 'font-semibold', 'tracking-h2']),
    );
    expect([...screen.getByText('12 of 18 beds').classList]).toEqual(
      expect.arrayContaining(['text-label', 'text-ink-2']),
    );
  });

  it('sets an h3 title as the prototype h3 (14px semibold)', () => {
    render(<CardHeader title="Vitals" headingLevel={3} />);
    expect([
      ...screen.getByRole('heading', { name: 'Vitals' }).classList,
    ]).toEqual(expect.arrayContaining(['text-body', 'font-semibold']));
  });

  it('pads the header 12 by 16 on the tinted head, the body 16, and lays the footer out space-between', () => {
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
    const header = screen.getByRole('heading', { name: 'Claims' })
      .parentElement as HTMLElement;
    expect([...header.classList]).toEqual(
      expect.arrayContaining([
        'nova-card-head',
        'px-card',
        'py-card-bar',
        'border-b',
      ]),
    );
    expect(screen.getByText('body').classList).toContain('p-card');
    const footer = screen.getByText('3 open').parentElement as HTMLElement;
    expect([...footer.classList]).toEqual(
      expect.arrayContaining(['flex', 'justify-between', 'border-t']),
    );
  });

  it.each([
    ['panel', 'surface'],
    ['data', 'data'],
    ['glass', 'surface'],
  ] as const)(
    'lifts an interactive %s card 2px to shadow-md on hover, only when motion is welcome',
    (variant, token) => {
      render(
        <>
          <Card variant={variant} interactive>
            hover me
          </Card>
          <Card variant={variant}>still</Card>
        </>,
      );
      const card = screen.getByText('hover me');
      expect(card.dataset['interactive']).toBe('true');
      expect([...card.classList]).toEqual(
        expect.arrayContaining([
          `hover:[--nova-${token}-lift:var(--nova-shadow-md)]`,
          'hover:border-border-strong',
          'motion-safe:hover:-translate-y-s0',
          'motion-reduce:transition-none',
        ]),
      );
      expect(card.className).toMatch(/transition-\[[^\]]*box-shadow/);
      expect(screen.getByText('still').className).not.toMatch(/translate|lift/);
    },
  );

  it.each(['panel', 'data', 'glass'] as const)(
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
