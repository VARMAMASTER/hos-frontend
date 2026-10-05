import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Divider } from './divider';

afterEach(() => cleanup());

describe('Divider', () => {
  it('is a horizontal separator by default', () => {
    render(<Divider />);
    const rule = screen.getByRole('separator');
    expect(rule.getAttribute('aria-orientation')).toBe('horizontal');
    expect(rule.dataset['orientation']).toBe('horizontal');
  });

  it('can be vertical, and says so to assistive technology', () => {
    render(<Divider orientation="vertical" />);
    const rule = screen.getByRole('separator');
    expect(rule.getAttribute('aria-orientation')).toBe('vertical');
    expect(rule.dataset['orientation']).toBe('vertical');
  });

  it('draws a different rule for each orientation', () => {
    render(
      <>
        <Divider data-testid="h" />
        <Divider data-testid="v" orientation="vertical" />
      </>,
    );
    expect(screen.getByTestId('h').classList.contains('h-px')).toBe(true);
    expect(screen.getByTestId('v').classList.contains('w-px')).toBe(true);
  });

  it('hides a purely decorative rule from assistive technology', () => {
    render(<Divider decorative data-testid="rule" />);
    expect(screen.queryByRole('separator')).toBeNull();
    expect(screen.getByTestId('rule').getAttribute('aria-hidden')).toBe('true');
  });

  it('exposes its label text as a named separator', () => {
    render(<Divider label="Yesterday" />);
    const rule = screen.getByRole('separator', { name: 'Yesterday' });
    expect(rule.textContent).toContain('Yesterday');
    expect(screen.getByText('Yesterday')).toBeTruthy();
  });

  it('keeps the labelled form visible to assistive technology, in either orientation', () => {
    render(<Divider label="or" orientation="vertical" />);
    const rule = screen.getByRole('separator', { name: 'or' });
    expect(rule.getAttribute('aria-hidden')).toBeNull();
    expect(rule.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('merges a caller className', () => {
    render(<Divider className="my-4" data-testid="rule" />);
    expect(screen.getByTestId('rule').classList.contains('my-4')).toBe(true);
  });
});
