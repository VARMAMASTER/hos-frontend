import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { WhyTrail } from './why-trail';

afterEach(() => cleanup());

const reasons = [
  'The discharge summary asks for review in OPD on 26 Jul.',
  '26 Jul is a Sunday; Orthopaedics has no OPD session that day.',
  'Monday 27 Jul at 10:30 AM is free on the consultant list.',
];

function toggle(name = 'Why this?') {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}

describe('WhyTrail', () => {
  it('is a "Why this?" disclosure, closed by default', () => {
    render(<WhyTrail reasons={reasons} />);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('controls a region, named by the toggle, that holds the reasons as a list', () => {
    render(<WhyTrail reasons={reasons} />);
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    const region = screen.getByRole('region', { name: 'Why this?' });
    expect(toggle().getAttribute('aria-controls')).toBe(region.id);
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent?.replace('·', ''))).toEqual(
      reasons,
    );
  });

  it('keeps the controlled element in the document while closed, so aria-controls always resolves', () => {
    render(<WhyTrail reasons={reasons} />);
    const id = toggle().getAttribute('aria-controls') ?? '';
    const region = document.getElementById(id);
    expect(region).not.toBeNull();
    expect(region?.hidden).toBe(true);
  });

  it('closes again from the same button', () => {
    render(<WhyTrail reasons={reasons} defaultOpen />);
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('is a real button, so Enter and Space work and it sits in the tab order', () => {
    render(<WhyTrail reasons={reasons} />);
    expect(toggle().tagName).toBe('BUTTON');
    expect(toggle().type).toBe('button');
  });

  it('shows its sources line under the reasons', () => {
    render(
      <WhyTrail
        reasons={reasons}
        sources="IPD discharge summary · Orthopaedics OPD roster"
        defaultOpen
      />,
    );
    expect(
      screen
        .getByText(/IPD discharge summary · Orthopaedics OPD roster/)
        .closest('p')?.textContent,
    ).toBe('Sources: IPD discharge summary · Orthopaedics OPD roster');
  });

  it('can be controlled', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <WhyTrail reasons={reasons} open={false} onOpenChange={onOpenChange} />,
    );
    fireEvent.click(toggle());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    rerender(<WhyTrail reasons={reasons} open onOpenChange={onOpenChange} />);
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
  });

  it('takes its fixed words as props', () => {
    render(
      <WhyTrail
        reasons={reasons}
        sources="OPD roster"
        toggleLabel="ఎందుకు?"
        sourcesLabel="ఆధారాలు"
        defaultOpen
      />,
    );
    expect(toggle('ఎందుకు?')).toBeTruthy();
    expect(screen.getByText(/OPD roster/).closest('p')?.textContent).toBe(
      'ఆధారాలు: OPD roster',
    );
  });

  it('puts the caller language on the reasons', () => {
    render(
      <WhyTrail reasons={['ఆదివారం OPD లేదు']} contentLang="te" defaultOpen />,
    );
    expect(screen.getByRole('list').getAttribute('lang')).toBe('te');
  });

  it('fades in only when motion is welcome', () => {
    render(<WhyTrail reasons={reasons} defaultOpen />);
    const region = screen.getByRole('region');
    expect(region.className).toContain('motion-safe:animate-fade-in');
    expect(region.className).not.toMatch(/(^|\s)animate-/);
  });

  it('hides the bullets from assistive technology', () => {
    render(<WhyTrail reasons={reasons} defaultOpen />);
    for (const item of screen.getAllByRole('listitem')) {
      expect(item.querySelector('[aria-hidden="true"]')?.textContent).toBe('·');
    }
  });
});
