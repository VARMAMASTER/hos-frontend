import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Tag } from './tag';

afterEach(() => cleanup());

describe('Tag', () => {
  it('is a solid, neutral label by default', () => {
    render(<Tag>Offline</Tag>);
    const tag = screen.getByText('Offline');
    expect([tag.dataset['variant'], tag.dataset['tone']]).toEqual([
      'solid',
      'neutral',
    ]);
    expect(tag.classList.contains('bg-ink-2')).toBe(true);
    expect(tag.classList.contains('text-surface')).toBe(true);
  });

  it.each([
    ['solid', 'neutral', ['bg-ink-2', 'text-surface']],
    ['solid', 'primary', ['bg-primary', 'text-on-primary']],
    ['solid', 'ai', ['bg-ai', 'text-on-primary']],
    ['outline', 'neutral', ['border-border-strong', 'text-ink-2']],
    ['outline', 'primary', ['border-primary', 'text-primary-strong']],
    ['outline', 'ai', ['border-ai', 'text-ai-deep']],
  ] as const)('maps %s + %s to its classes', (variant, tone, expected) => {
    render(
      <Tag variant={variant} tone={tone}>
        label
      </Tag>,
    );
    const tag = screen.getByText('label');
    expect([tag.dataset['variant'], tag.dataset['tone']]).toEqual([
      variant,
      tone,
    ]);
    for (const cls of expected) expect(tag.classList.contains(cls)).toBe(true);
  });

  it('draws no fill on an outline tag', () => {
    render(<Tag variant="outline">Outline</Tag>);
    const classes = [...screen.getByText('Outline').classList];
    expect(classes.some((c) => /^bg-(?!transparent)/.test(c))).toBe(false);
  });

  it('merges a caller className and passes other attributes through', () => {
    render(
      <Tag className="ml-auto" title="Works offline">
        Offline
      </Tag>,
    );
    const tag = screen.getByText('Offline');
    expect(tag.classList.contains('ml-auto')).toBe(true);
    expect(tag.getAttribute('title')).toBe('Works offline');
  });
});
