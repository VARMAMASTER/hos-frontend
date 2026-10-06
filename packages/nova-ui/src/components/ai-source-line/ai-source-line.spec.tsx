import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AiSourceLine } from './ai-source-line';

afterEach(() => cleanup());

// What a screen reader reads: the text, minus anything hidden from assistive technology.
function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  return Array.from(node.childNodes).map(assistiveText).join('');
}

describe('AiSourceLine', () => {
  it('reads as one line of provenance: "Source: …"', () => {
    const { container } = render(
      <AiSourceLine>214 summaries sampled</AiSourceLine>,
    );
    expect(assistiveText(container).replace(/\s+/g, ' ').trim()).toBe(
      'Source: 214 summaries sampled',
    );
  });

  it('is the prototype .ai-src: 11.5px in the AI ink, green once its block is approved', () => {
    const { container } = render(<AiSourceLine>Theatre log</AiSourceLine>);
    const line = container.firstElementChild as HTMLElement;
    expect(line.className).toContain('text-[11.5px]');
    expect(line.className).toContain('text-ai-deep');
    expect(line.className).toContain('in-data-[approved=true]:text-good-deep');
  });

  it('takes its label as a prop, so it can be translated', () => {
    const { container } = render(
      <AiSourceLine label="स्रोत">Theatre log</AiSourceLine>,
    );
    expect(assistiveText(container)).toContain('स्रोत: ');
  });

  it.each([
    ['high', 'Confidence high'],
    ['medium', 'Confidence medium'],
  ] as const)(
    'says the confidence (%s) in words beside its icon, never by colour alone',
    (level, words) => {
      const { container } = render(
        <AiSourceLine confidence={level}>214 summaries sampled</AiSourceLine>,
      );
      expect(assistiveText(container)).toContain(words);
      const mark = container.querySelector(`[data-confidence="${level}"]`);
      expect(mark).not.toBeNull();
      expect(mark?.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
        'true',
      );
    },
  );

  it('draws each confidence level with a different icon shape', () => {
    const shapes = (['high', 'medium', 'low'] as const).map((level) => {
      const { container } = render(
        <AiSourceLine confidence={level}>x</AiSourceLine>,
      );
      const svg = container.querySelector(`[data-confidence="${level}"] svg`);
      const html = svg?.innerHTML ?? '';
      cleanup();
      return html;
    });
    expect(new Set(shapes).size).toBe(3);
  });

  it('marks low confidence with the explicit "read it yourself" warning chip', () => {
    render(
      <AiSourceLine confidence="low">page 1 · line 6 · blurred</AiSourceLine>,
    );
    const chip = screen.getByText(/Low confidence — read it yourself/);
    expect(chip.closest('[data-tone]')?.getAttribute('data-tone')).toBe('warn');
  });

  it('takes the confidence words as props', () => {
    const { container } = render(
      <AiSourceLine
        confidence="low"
        confidenceLabels={{ low: 'तक्कुव नम्मकम — मीरे चदवंडि' }}
      >
        x
      </AiSourceLine>,
    );
    expect(assistiveText(container)).toContain('तक्कुव नम्मकम — मीरे चदवंडि');
  });

  it('links to the event it came from', () => {
    render(
      <AiSourceLine eventHref="#event-2291" eventLabel="from event">
        Nursing note 16 Jul
      </AiSourceLine>,
    );
    const link = screen.getByRole('link', { name: 'from event' });
    expect(link.getAttribute('href')).toBe('#event-2291');
  });

  it('opens the event from a button when it has a handler instead of a link', () => {
    const onEventClick = vi.fn();
    render(
      <AiSourceLine onEventClick={onEventClick}>
        Nursing note 16 Jul
      </AiSourceLine>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'From event' }));
    expect(onEventClick).toHaveBeenCalledTimes(1);
  });

  it('puts the caller language on the content only, not on the fixed label', () => {
    render(<AiSourceLine contentLang="te">కన్సల్ట్ ఆడియో 10:41</AiSourceLine>);
    const content = screen.getByText('కన్సల్ట్ ఆడియో 10:41');
    expect(content.getAttribute('lang')).toBe('te');
    expect(content.parentElement?.getAttribute('lang')).toBeNull();
  });

  it('passes attributes through and merges a className', () => {
    const { container } = render(
      <AiSourceLine id="src" className="mt-2">
        x
      </AiSourceLine>,
    );
    const line = container.firstElementChild as HTMLElement;
    expect(line.id).toBe('src');
    expect(line.classList.contains('mt-2')).toBe(true);
  });
});
