import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HeroBand } from './hero-band';

afterEach(() => cleanup());

describe('HeroBand', () => {
  it('renders its title as an h1 by default', () => {
    render(<HeroBand title="Today at Sri Care" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Today at Sri Care' }),
    ).toBeTruthy();
  });

  it('renders the title at the requested heading level', () => {
    render(<HeroBand title="Billing" headingLevel={2} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Billing' }),
    ).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('renders the description, the actions and its children', () => {
    render(
      <HeroBand
        title="Today"
        description="12 admissions, 9 discharges"
        actions={<button type="button">New admission</button>}
      >
        <p>Beds free: 4</p>
      </HeroBand>,
    );
    expect(screen.getByText('12 admissions, 9 discharges')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New admission' })).toBeTruthy();
    expect(screen.getByText('Beds free: 4')).toBeTruthy();
  });

  it('renders no description or actions wrapper when none are given', () => {
    const { container } = render(<HeroBand title="Quiet" />);
    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });

  it('carries the hero surface and rounded corners on its root, and merges className and attributes', () => {
    render(
      <HeroBand
        title="Today"
        className="max-w-3xl"
        data-testid="hero"
        id="today"
      />,
    );
    const root = screen.getByTestId('hero');
    expect(root.classList.contains('nova-hero')).toBe(true);
    // The prototype's .page-head.glass-hero: the hero corner, 20px by 24px.
    expect(root.classList.contains('rounded-hero')).toBe(true);
    expect(root.classList.contains('px-s8')).toBe(true);
    expect(root.classList.contains('py-s7')).toBe(true);
    expect(root.classList.contains('max-w-3xl')).toBe(true);
    expect(root.id).toBe('today');
  });

  // The prototype dims the description to 68% white, which is 3:1 at the sky end of the gradient.
  // It takes the hero's own secondary ink instead, which material.spec.ts proves at 4.5:1 there.
  it('sets the description in the hero secondary ink the proof covers, never an ad-hoc dimmed white or an ink token', () => {
    render(<HeroBand title="Today" description="Admissions and discharges" />);
    const description = screen.getByText('Admissions and discharges');
    expect(
      description.classList.contains('text-(color:--nova-hero-ink-2)'),
    ).toBe(true);
    expect(description.classList.contains('text-control')).toBe(true);
    expect(
      Array.from(description.classList).some((name) =>
        name.startsWith('text-on-primary/'),
      ),
    ).toBe(false);
    expect(
      Array.from(description.classList).some((name) =>
        name.startsWith('text-ink'),
      ),
    ).toBe(false);
  });
});
