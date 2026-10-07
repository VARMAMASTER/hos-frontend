import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StatGauge } from './stat-gauge';

afterEach(() => cleanup());

describe('StatGauge meter semantics', () => {
  it('is a meter with now, min, max and a name from its label', () => {
    render(<StatGauge label="Bed occupancy" value={72} />);
    const meter = screen.getByRole('meter', { name: 'Bed occupancy' });
    expect(meter.getAttribute('aria-valuenow')).toBe('72');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('100');
  });

  it('takes a custom range', () => {
    render(<StatGauge label="Beds used" value={42} min={0} max={60} />);
    const meter = screen.getByRole('meter');
    expect(meter.getAttribute('aria-valuenow')).toBe('42');
    expect(meter.getAttribute('aria-valuemax')).toBe('60');
  });

  it('clamps a value outside the range', () => {
    const { rerender } = render(<StatGauge label="L" value={140} />);
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('100');
    rerender(<StatGauge label="L" value={-5} />);
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('0');
  });

  it('treats a non-finite value as the minimum', () => {
    render(<StatGauge label="L" value={Number.NaN} />);
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('0');
  });

  it('does not divide by zero when max is not above min', () => {
    render(<StatGauge label="L" value={5} min={10} max={10} />);
    expect(
      (screen.getByRole('meter').firstElementChild as HTMLElement).style.width,
    ).toBe('0%');
  });
});

describe('StatGauge value as text', () => {
  it('shows the value as a percentage in text by default', () => {
    render(<StatGauge label="Bed occupancy" value={72} />);
    expect(screen.getByText('72%')).toBeTruthy();
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toBe(
      '72%',
    );
  });

  it('computes the percentage over the range', () => {
    render(<StatGauge label="Beds" value={30} max={60} />);
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toBe(
      '50%',
    );
  });

  it('shows and announces a custom valueText', () => {
    render(
      <StatGauge label="Beds used" value={42} max={60} valueText="42 of 60" />,
    );
    expect(screen.getByText('42 of 60')).toBeTruthy();
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toBe(
      '42 of 60',
    );
  });

  it('shows the label in text', () => {
    render(<StatGauge label="ICU capacity" value={10} />);
    expect(screen.getByText('ICU capacity')).toBeTruthy();
  });
});

describe('StatGauge look', () => {
  it('fills the track in proportion', () => {
    render(<StatGauge label="L" value={25} max={50} />);
    expect(
      (screen.getByRole('meter').firstElementChild as HTMLElement).style.width,
    ).toBe('50%');
  });

  // hos.css .sb-bar: a 5px track with a full radius, filled with a full-radius bar.
  it('has the prototype 5px track (.sb-bar) with its gradient fill', () => {
    render(<StatGauge label="L" value={25} />);
    const track = screen.getByRole('meter');
    expect(track.className).toContain('h-(--nova-dot-sm)');
    expect(track.className).toContain('rounded-full');
    expect(track.className).not.toContain('h-1.5');
    const fill = track.firstElementChild as HTMLElement;
    // The prototype's .sb-bar fill, extended to a panel: the brand into the highlight.
    expect(fill.className).toContain('nova-highlight-grad');
    expect(fill.className).not.toContain('bg-primary');
    expect(fill.className).toContain('rounded-full');
  });

  // hos.css .kpi: the label at 12px / 500 in ink-2 (.kpi-l), the figure at 26px / 700 (.kpi-v), on a
  // --r-md card with a line border, 16px padding and --shadow-sm.
  it('is the prototype .kpi: a 12px label, a 26px bold figure, shadow-sm on an md card', () => {
    const { container } = render(
      <StatGauge label="L" value={25} data-testid="g" />,
    );
    const label = screen.getByText('L');
    expect(label.className).toContain('text-label');
    expect(label.className).toContain('font-medium');
    expect(label.className).toContain('text-ink-2');
    const figure = screen.getByText('25%');
    expect(figure.className).toContain('text-kpi');
    expect(figure.className).toContain('font-bold');
    expect(figure.className).toContain('tabular-nums');
    const root = screen.getByTestId('g');
    expect(root.className).toContain('rounded-card');
    expect(root.className).toContain('shadow-sm');
    expect(root.className).toContain('p-card');
    expect(root.className).toContain('border-border');
    expect(container.innerHTML).not.toMatch(
      /text-(?:headline|caption)|shadow-elevation|rounded-lg/,
    );
  });

  it('reads the label before the figure, like the .kpi tile', () => {
    render(<StatGauge label="L" value={25} data-testid="g" />);
    const text = screen.getByTestId('g').textContent;
    expect(text?.indexOf('L')).toBeLessThan(text?.indexOf('25%') ?? -1);
  });

  it('merges className and passes attributes to the root', () => {
    render(<StatGauge label="L" value={1} className="w-48" data-testid="g" />);
    expect(screen.getByTestId('g').className).toContain('w-48');
  });
});
