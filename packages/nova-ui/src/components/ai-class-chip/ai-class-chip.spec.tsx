import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AiClassChip } from './ai-class-chip';
import { TierCard } from './tier-card';

afterEach(() => cleanup());

// What a screen reader reads: the text, minus anything hidden from assistive technology.
function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  if (node instanceof HTMLElement && node.hidden) return '';
  return Array.from(node.childNodes).map(assistiveText).join('');
}

const chipOf = (container: HTMLElement) =>
  container.querySelector('[data-tone]') as HTMLElement;

describe('AiClassChip', () => {
  it.each([
    ['green', 'Tier: green', 'good'],
    ['amber', 'Tier: amber', 'warn'],
    ['red', 'Tier: red', 'crit'],
  ] as const)(
    'says the %s tier in words, drawn in an existing semantic tone',
    (tier, words, tone) => {
      const { container } = render(<AiClassChip tier={tier} />);
      expect(assistiveText(chipOf(container)).trim()).toBe(words);
      expect(chipOf(container).dataset['tone']).toBe(tone);
      expect(chipOf(container).dataset['tier']).toBe(tier);
    },
  );

  it('draws each tier with a different icon shape, hidden from assistive technology', () => {
    const shapes = (['green', 'amber', 'red'] as const).map((tier) => {
      const { container } = render(<AiClassChip tier={tier} />);
      const icon = chipOf(container).querySelector('[data-slot="icon"]');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
      const html = icon?.innerHTML ?? '';
      cleanup();
      return html;
    });
    expect(new Set(shapes).size).toBe(3);
  });

  it('adds what the tier is for after the tier', () => {
    const { container } = render(
      <AiClassChip tier="green" detail="productivity" />,
    );
    expect(assistiveText(chipOf(container)).trim()).toBe(
      'Tier: green · productivity',
    );
  });

  it('takes its words as props, so they can be translated', () => {
    const { container } = render(
      <AiClassChip tier="amber" labels={{ amber: 'श्रेणी: एम्बर' }} />,
    );
    expect(assistiveText(chipOf(container)).trim()).toBe('श्रेणी: एम्बर');
  });

  it('is not a control on green or amber: no button, no tab stop', () => {
    render(<AiClassChip tier="green" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(document.querySelectorAll('[tabindex]')).toHaveLength(0);
  });

  it('marks RED disabled and leaves it out of the tab order: it can never be switched on', () => {
    const { container } = render(<AiClassChip tier="red" />);
    const chip = chipOf(container);
    expect(chip.getAttribute('aria-disabled')).toBe('true');
    expect(chip.hasAttribute('tabindex')).toBe(false);
    expect(chip.getAttribute('role')).toBeNull();
  });

  it('explains a RED block from a "Why blocked" disclosure the keyboard can reach', () => {
    const reason =
      'Needs a CDSCO Class C licence, an ICMR ethics review and separate DPDP consent.';
    const { container } = render(<AiClassChip tier="red" reason={reason} />);
    const why = screen.getByRole('button', { name: 'Why blocked' });
    expect(why.getAttribute('aria-expanded')).toBe('false');
    const description = document.getElementById(
      why.getAttribute('aria-controls') ?? '',
    );
    expect(description?.textContent).toBe(reason);
    expect(description?.hidden).toBe(true);
    // The chip is described by the reason even while it is folded away.
    expect(chipOf(container).getAttribute('aria-describedby')).toBe(
      description?.id,
    );
    fireEvent.click(why);
    expect(why.getAttribute('aria-expanded')).toBe('true');
    expect(description?.hidden).toBe(false);
  });

  it('offers no "Why blocked" on green or amber', () => {
    render(<AiClassChip tier="amber" reason="Reference only." />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('takes the "Why blocked" words as a prop', () => {
    render(
      <AiClassChip
        tier="red"
        reason="Licence required."
        labels={{ whyBlocked: 'ఎందుకు ఆపారు?' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'ఎందుకు ఆపారు?' })).toBeTruthy();
  });
});

describe('TierCard', () => {
  it('adds a short description to the tier, with the AI spark and a title', () => {
    render(
      <TierCard
        tier="green"
        title="Discharge Drafter"
        description="Drafts only. A human always signs."
      />,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Discharge Drafter' }),
    ).toBeTruthy();
    expect(screen.getByText('Drafts only. A human always signs.')).toBeTruthy();
    expect(screen.getByText(/Tier: green/)).toBeTruthy();
    const spark = document.querySelector('.nova-ai-spark');
    expect(spark?.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(spark?.getAttribute('aria-hidden')).toBe('true');
  });

  it('is a group named by its title, and draws the tier rail on its left edge', () => {
    render(
      <TierCard
        tier="amber"
        title="Lab Summarizer"
        description="Quotes references. Never tells you what to do."
      />,
    );
    const card = screen.getByRole('group', { name: 'Lab Summarizer' });
    expect(card.dataset['tier']).toBe('amber');
    expect(card.className).toContain('border-l-warn');
  });

  it('carries the RED "Why blocked" explanation', () => {
    render(
      <TierCard
        tier="red"
        title="Deterioration forecast"
        description="Predicts a future clinical event."
        reason="CDSCO Class C licence required."
      />,
    );
    expect(screen.getByRole('button', { name: 'Why blocked' })).toBeTruthy();
  });

  it('puts the caller language on the description', () => {
    render(
      <TierCard
        tier="green"
        title="AI Scribe"
        description="డ్రాఫ్ట్ మాత్రమే."
        contentLang="te"
      />,
    );
    expect(screen.getByText('డ్రాఫ్ట్ మాత్రమే.').getAttribute('lang')).toBe(
      'te',
    );
  });
});
