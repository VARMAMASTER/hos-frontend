import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StatusDot } from './status-dot';

afterEach(() => cleanup());

function dotOf(label: string) {
  return screen.getByText(label).querySelector('[aria-hidden="true"]');
}

describe('StatusDot', () => {
  it('renders its label as text', () => {
    render(<StatusDot tone="crit" label="Critical" />);
    expect(screen.getByText('Critical')).toBeTruthy();
  });

  it('hides the dot from assistive technology, so only the label is read', () => {
    render(<StatusDot tone="good" label="Stable" />);
    expect(dotOf('Stable')).not.toBeNull();
    expect(dotOf('Stable')?.textContent).toBe('');
  });

  it.each([
    ['good', 'bg-good'],
    ['warn', 'bg-warn'],
    ['crit', 'bg-crit'],
    ['info', 'bg-info'],
    ['neutral', 'bg-ink-3'],
  ] as const)('maps the %s tone to the %s class', (tone, expectedClass) => {
    render(<StatusDot tone={tone} label={tone} />);
    expect(dotOf(tone)?.classList.contains(expectedClass)).toBe(true);
    expect(screen.getByText(tone).dataset['tone']).toBe(tone);
  });

  it('requires a label, and has no AI tone', () => {
    // @ts-expect-error a bare coloured dot is colour-only signalling, so label is mandatory
    render(<StatusDot tone="good" />);
    // @ts-expect-error AI output is marked by AiBadge (spark and text), never by a dot
    render(<StatusDot tone="ai" label="Drafting" />);
  });
});
