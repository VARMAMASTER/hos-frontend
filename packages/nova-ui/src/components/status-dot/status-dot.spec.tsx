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

  it('draws the prototype .dot: a 7px circle', () => {
    render(<StatusDot tone="good" label="Stable" />);
    const dot = dotOf('Stable');
    expect(dot?.classList.contains('size-[7px]')).toBe(true);
    expect(dot?.classList.contains('rounded-full')).toBe(true);
    expect(dot?.className).not.toMatch(/corner-shape/);
  });

  it('requires a label, and has no AI tone', () => {
    // @ts-expect-error a bare coloured dot is colour-only signalling, so label is mandatory
    render(<StatusDot tone="good" />);
    // @ts-expect-error AI output is marked by AiBadge (spark and text), never by a dot
    render(<StatusDot tone="ai" label="Drafting" />);
  });

  describe('pulse', () => {
    // An animation utility is always behind motion-safe: an unconditional one would ignore
    // prefers-reduced-motion.
    const animationClasses = (el: Element | null | undefined) =>
      [...(el?.classList ?? [])].filter((cls) => /animate-/.test(cls));
    const ringOf = (label: string) =>
      dotOf(label)?.querySelector('[aria-hidden="true"]') ?? null;

    it('is still by default: no animation class and no ring', () => {
      render(<StatusDot tone="crit" label="Critical" />);
      expect(animationClasses(dotOf('Critical'))).toEqual([]);
      expect(ringOf('Critical')).toBeNull();
      expect(screen.getByText('Critical').outerHTML).not.toMatch(/animate-/);
    });

    it('stays still for pulse={false}', () => {
      render(<StatusDot tone="crit" label="Critical" pulse={false} />);
      expect(screen.getByText('Critical').outerHTML).not.toMatch(/animate-/);
      expect(ringOf('Critical')).toBeNull();
    });

    it.each([true, 'slow', 'fast'] as const)(
      'pulse=%s beats the dot and expands a ring behind it',
      (pulse) => {
        render(<StatusDot tone="crit" label="Critical" pulse={pulse} />);
        expect(
          dotOf('Critical')?.classList.contains(
            'motion-safe:animate-heartbeat',
          ),
        ).toBe(true);
        expect(
          ringOf('Critical')?.classList.contains(
            'motion-safe:animate-pulse-ring',
          ),
        ).toBe(true);
      },
    );

    it('only ever animates behind motion-safe, and shows no ring under reduced motion', () => {
      render(<StatusDot tone="warn" label="Watch" pulse="fast" />);
      const animated = animationClasses(dotOf('Watch')).concat(
        animationClasses(ringOf('Watch')),
      );
      expect(animated).toHaveLength(2);
      for (const cls of animated) {
        expect(cls.startsWith('motion-safe:')).toBe(true);
      }
      // The ring is hidden unless motion is allowed, so a reduced-motion user sees a plain dot.
      expect(ringOf('Watch')?.classList.contains('hidden')).toBe(true);
      expect(ringOf('Watch')?.classList.contains('motion-safe:block')).toBe(
        true,
      );
    });

    it('takes its cadence from a named speed: slow (the default for true) or fast', () => {
      const { rerender } = render(
        <StatusDot tone="good" label="Live" pulse={true} />,
      );
      expect(dotOf('Live')?.classList.contains('pulse-slow')).toBe(true);
      rerender(<StatusDot tone="good" label="Live" pulse="slow" />);
      expect(dotOf('Live')?.classList.contains('pulse-slow')).toBe(true);
      rerender(<StatusDot tone="good" label="Live" pulse="fast" />);
      expect(dotOf('Live')?.classList.contains('pulse-fast')).toBe(true);
      expect(dotOf('Live')?.classList.contains('pulse-slow')).toBe(false);
    });

    it.each([
      ['good', 'bg-good/40'],
      ['warn', 'bg-warn/40'],
      ['crit', 'bg-crit/40'],
      ['info', 'bg-info/40'],
      ['neutral', 'bg-ink-3/40'],
    ] as const)(
      'draws the %s ring in the tone colour at low alpha (%s)',
      (tone, ringClass) => {
        render(<StatusDot tone={tone} label={tone} pulse />);
        expect(ringOf(tone)?.classList.contains(ringClass)).toBe(true);
        expect(ringOf(tone)?.classList.contains('rounded-full')).toBe(true);
      },
    );

    it('keeps the label rendered and the dot hidden from assistive technology', () => {
      render(<StatusDot tone="crit" label="Critical" pulse="fast" />);
      expect(screen.getByText('Critical')).toBeTruthy();
      expect(dotOf('Critical')?.getAttribute('aria-hidden')).toBe('true');
      expect(dotOf('Critical')?.textContent).toBe('');
      // The motion carries no meaning: no live region, no role, no extra name.
      expect(screen.getByText('Critical').getAttribute('role')).toBeNull();
      expect(screen.getByText('Critical').getAttribute('aria-live')).toBeNull();
    });
  });
});
