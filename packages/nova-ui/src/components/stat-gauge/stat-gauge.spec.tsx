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

  it('has a 6px track with a primary fill, and the ramp type classes', () => {
    render(<StatGauge label="L" value={25} />);
    expect(screen.getByRole('meter').className).toContain('h-1.5');
    expect(
      (screen.getByRole('meter').firstElementChild as HTMLElement).className,
    ).toContain('bg-primary');
    expect(screen.getByText('25%').className).toContain('text-headline');
    expect(screen.getByText('L').className).toContain('text-caption');
  });

  it('uses no shadow and no weight 500', () => {
    const { container } = render(<StatGauge label="L" value={25} />);
    expect(container.innerHTML).not.toMatch(/shadow|font-medium/);
  });

  it('merges className and passes attributes to the root', () => {
    render(<StatGauge label="L" value={1} className="w-48" data-testid="g" />);
    expect(screen.getByTestId('g').className).toContain('w-48');
  });
});
