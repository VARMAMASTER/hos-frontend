import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AiBadge } from './ai-badge';

afterEach(() => cleanup());

// What a screen reader reads: the text, minus anything hidden from assistive technology.
function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  return Array.from(node.childNodes).map(assistiveText).join('');
}

describe('AiBadge', () => {
  it('says "AI draft" by default', () => {
    render(<AiBadge />);
    expect(screen.getByText('AI draft')).toBeTruthy();
  });

  it('takes a custom label', () => {
    render(<AiBadge label="AI summary" />);
    expect(screen.getByText('AI summary')).toBeTruthy();
    expect(screen.queryByText('AI draft')).toBeNull();
  });

  it('is read as its label and nothing else, so the accessible name includes the label', () => {
    const { container } = render(<AiBadge label="AI summary" />);
    expect(assistiveText(container).trim()).toBe('AI summary');
  });

  it('shows a visible ✦ spark that assistive technology skips', () => {
    const { container } = render(<AiBadge />);
    const spark = container.querySelector('[aria-hidden="true"]');
    expect(spark?.textContent).toBe('✦');
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it('is never identified by colour alone: the spark and the label are both in the markup', () => {
    render(<AiBadge />);
    const badge = screen.getByText('AI draft');
    expect(badge.textContent).toContain('✦');
    expect(badge.textContent).toContain('AI draft');
  });

  it('uses the ai tokens, and no status colour', () => {
    render(<AiBadge />);
    const badge = screen.getByText('AI draft');
    expect(badge.dataset['tone']).toBe('ai');
    expect(badge.classList.contains('bg-ai-soft')).toBe(true);
    expect(badge.classList.contains('text-ai-deep')).toBe(true);
    expect(badge.className).not.toMatch(/good|warn|crit|info/);
  });

  it('merges a custom className and passes attributes through', () => {
    render(<AiBadge className="ml-s3" id="draft-badge" />);
    const badge = screen.getByText('AI draft');
    expect(badge.classList.contains('ml-s3')).toBe(true);
    expect(badge.classList.contains('bg-ai-soft')).toBe(true);
    expect(badge.id).toBe('draft-badge');
  });

  it('supports the glow variant for elevated glass styling', () => {
    render(<AiBadge variant="glow" />);
    const badge = screen.getByText('AI draft');
    expect(badge.dataset['variant']).toBe('glow');
    expect(badge.classList.contains('nova-ai-badge-pill')).toBe(true);
  });
});
