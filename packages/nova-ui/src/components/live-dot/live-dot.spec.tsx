import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LiveDot } from './live-dot';

afterEach(() => cleanup());

describe('LiveDot', () => {
  it('is a status region whose visible label is its text (a status role takes no name from content, so a change to it is announced)', () => {
    render(<LiveDot label="Live" />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Live');
    expect(status.getAttribute('aria-label')).toBeNull();
  });

  it('can be a bare dot when it carries an aria-label', () => {
    render(<LiveDot aria-label="Live vitals" />);
    const status = screen.getByRole('status', { name: 'Live vitals' });
    expect(status.textContent).toBe('');
    expect(status.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('requires an accessible name: a label or an aria-label', () => {
    // @ts-expect-error a dot with neither a label nor an aria-label has no name
    render(<LiveDot />);
  });

  it('is good-toned and beats at the slow cadence by default', () => {
    render(<LiveDot label="Live" />);
    const status = screen.getByRole('status');
    expect(status.dataset['tone']).toBe('good');
    const dot = status.querySelector('[aria-hidden="true"]');
    expect(dot?.classList.contains('bg-good')).toBe(true);
    expect(dot?.classList.contains('motion-safe:animate-heartbeat')).toBe(true);
    expect(dot?.classList.contains('pulse-slow')).toBe(true);
  });

  it('takes a tone and a speed', () => {
    render(<LiveDot label="Recording" tone="crit" pulse="fast" />);
    const status = screen.getByRole('status');
    expect(status.dataset['tone']).toBe('crit');
    const dot = status.querySelector('[aria-hidden="true"]');
    expect(dot?.classList.contains('bg-crit')).toBe(true);
    expect(dot?.classList.contains('pulse-fast')).toBe(true);
  });

  it('never animates outside motion-safe, and keeps the status region itself exposed', () => {
    render(<LiveDot label="Live" />);
    const status = screen.getByRole('status');
    const parts = [...status.querySelectorAll('[aria-hidden="true"]')];
    expect(parts).toHaveLength(2);
    for (const part of parts) {
      for (const cls of part.classList) {
        if (/animate-/.test(cls)) {
          expect(cls.startsWith('motion-safe:')).toBe(true);
        }
      }
    }
    expect(status.getAttribute('aria-hidden')).toBeNull();
  });

  it('can be switched still, for a feed that has gone offline', () => {
    render(<LiveDot label="Offline" tone="neutral" pulse={false} />);
    expect(screen.getByRole('status').outerHTML).not.toMatch(/animate-/);
  });

  it('merges a caller className', () => {
    render(<LiveDot label="Live" className="ml-2" />);
    expect(screen.getByRole('status').classList.contains('ml-2')).toBe(true);
  });
});
