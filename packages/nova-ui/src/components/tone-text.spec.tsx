import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ActivityFeed } from './activity-feed/activity-feed';
import { TONE_WORDS, type ChipTone } from './chip/chip';
import { KpiTile } from './kpi-tile/kpi-tile';
import { Timeline } from './timeline/timeline';

afterEach(() => cleanup());

// BLUEPRINT §3: every status, AI marker and bed state carries visible text, so the interface
// survives colour blindness and greyscale print. "Visible" is the point: a word only a screen reader
// hears does not help a colour-blind clinician, so text inside .sr-only does not count here.
function visibleText(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  for (const hidden of Array.from(copy.querySelectorAll('.sr-only'))) {
    hidden.remove();
  }
  return copy.textContent ?? '';
}

const TONES: ChipTone[] = ['good', 'warn', 'crit', 'info', 'ai'];

const renderers: Record<string, (tone: ChipTone) => ReactElement> = {
  Timeline: (tone) => (
    <Timeline items={[{ id: 'e', time: '09:12', title: 'Event', tone }]} />
  ),
  ActivityFeed: (tone) => (
    <ActivityFeed items={[{ id: 'e', time: '09:12', title: 'Event', tone }]} />
  ),
};

describe('tone is never carried by colour alone', () => {
  it('names every tone but neutral in words', () => {
    expect(TONE_WORDS.neutral).toBeNull();
    for (const tone of TONES) expect(TONE_WORDS[tone]).toBeTruthy();
  });

  describe.each(Object.keys(renderers))('%s', (name) => {
    it.each(TONES)('shows the %s tone as a visible word', (tone) => {
      render(renderers[name](tone));
      const row = screen.getByRole('listitem');
      expect(visibleText(row)).toContain(TONE_WORDS[tone]);
    });

    it('marks AI with the AI badge (a spark and the word), not a coloured dot', () => {
      render(renderers[name]('ai'));
      const badge = screen
        .getByRole('listitem')
        .querySelector('[data-tone="ai"][data-badge]');
      expect(badge).not.toBeNull();
      expect(visibleText(badge as Element)).toBe('✦AI');
    });

    it('adds no tone word to a neutral event', () => {
      render(renderers[name]('neutral'));
      const text = visibleText(screen.getByRole('listitem'));
      for (const tone of TONES) {
        expect(text).not.toContain(TONE_WORDS[tone]);
      }
    });
  });

  describe('KpiTile', () => {
    it.each(['good', 'warn', 'crit'] as const)(
      'shows %s sentiment as a visible word in the delta pill',
      (tone) => {
        render(
          <KpiTile
            label="Claim rejections"
            value="9"
            delta="+3"
            trend="up"
            tone={tone}
          />,
        );
        const pill = screen.getByText('+3');
        expect(visibleText(pill)).toContain(TONE_WORDS[tone]);
      },
    );

    it('adds no sentiment word to a default tile', () => {
      render(<KpiTile label="Beds" value="14" delta="+2" trend="up" />);
      expect(visibleText(screen.getByText('+2'))).toBe('↑+2');
    });
  });
});
