import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Tag } from './tag';

afterEach(() => cleanup());

describe('Tag', () => {
  // The prototype's .tag-offline: the darkest chrome with light ink, IBM Plex Mono at 10.5px.
  it('is a solid, neutral label by default', () => {
    render(<Tag>Offline</Tag>);
    const tag = screen.getByText('Offline');
    expect([tag.dataset['variant'], tag.dataset['tone']]).toEqual([
      'solid',
      'neutral',
    ]);
    for (const name of [
      'bg-chrome-1',
      'text-chrome-ink',
      'font-mono',
      'text-[10.5px]',
      'px-2',
      'py-0.5',
    ]) {
      expect(tag.classList.contains(name), name).toBe(true);
    }
  });

  // .tag-offline has no border, so a solid tag draws none and keeps the prototype's height; an
  // outline tag is its border.
  it('draws a border only on an outline tag', () => {
    render(
      <>
        <Tag>Offline</Tag>
        <Tag variant="outline">Beta</Tag>
      </>,
    );
    expect(screen.getByText('Offline').className).not.toMatch(/\bborder\b/);
    expect(screen.getByText('Beta').classList.contains('border')).toBe(true);
  });

  it.each([
    ['solid', 'neutral', ['bg-chrome-1', 'text-chrome-ink']],
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
