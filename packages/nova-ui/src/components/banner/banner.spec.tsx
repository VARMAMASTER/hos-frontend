import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Banner, type BannerTone } from './banner';

afterEach(() => cleanup());

const tones: readonly BannerTone[] = ['info', 'good', 'warn', 'crit'];

describe('Banner role', () => {
  it.each([
    ['crit', 'alert'],
    ['warn', 'alert'],
    ['info', 'status'],
    ['good', 'status'],
  ] as const)('a %s banner is announced as role="%s"', (tone, role) => {
    render(<Banner tone={tone} title="Allergy list updated" />);
    expect(screen.getByRole(role)).toBeTruthy();
    const other = role === 'alert' ? 'status' : 'alert';
    expect(screen.queryByRole(other)).toBeNull();
  });
});

describe('Banner tone', () => {
  it.each(tones)(
    'the %s tone uses its -soft fill with its -deep text',
    (tone) => {
      render(<Banner tone={tone} title="Heads up" />);
      const banner = screen.getByRole(
        tone === 'crit' || tone === 'warn' ? 'alert' : 'status',
      );
      expect(banner.classList).toContain(`bg-${tone}-soft`);
      expect(banner.classList).toContain(`text-${tone}-deep`);
      expect(banner.dataset['tone']).toBe(tone);
    },
  );

  it('uses no other tone classes', () => {
    render(<Banner tone="crit" title="Heads up" />);
    const classes = [...screen.getByRole('alert').classList];
    for (const other of tones.filter((tone) => tone !== 'crit')) {
      expect(classes).not.toContain(`bg-${other}-soft`);
      expect(classes).not.toContain(`text-${other}-deep`);
    }
  });

  it('shows the tone as a shape too, so colour is never the only signal', () => {
    const shapes = tones.map((tone) => {
      const { container, unmount } = render(<Banner tone={tone} title="Hi" />);
      const icon = container.querySelector('svg');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
      const markup = icon?.innerHTML ?? '';
      unmount();
      return markup;
    });
    expect(shapes.every(Boolean)).toBe(true);
    expect(new Set(shapes).size).toBe(tones.length);
  });
});

describe('Banner content', () => {
  it('renders the title, the body and the action', () => {
    render(
      <Banner
        tone="warn"
        title="Penicillin allergy"
        action={<button type="button">Review</button>}
      >
        Documented on 3 May
      </Banner>,
    );
    expect(screen.getByText('Penicillin allergy')).toBeTruthy();
    expect(screen.getByText('Documented on 3 May')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Review' })).toBeTruthy();
  });

  it('renders just the title when there is no body, action or dismiss', () => {
    render(<Banner tone="info" title="Ward round at 4" />);
    expect(screen.getByText('Ward round at 4')).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('merges className and passes other attributes to the banner', () => {
    render(
      <Banner tone="info" title="Hi" className="mb-4" data-testid="notice" />,
    );
    const banner = screen.getByTestId('notice');
    expect(banner.classList).toContain('mb-4');
    expect(banner.classList).toContain('bg-info-soft');
  });
});

describe('Banner dismiss', () => {
  it('has no dismiss control unless onDismiss is given', () => {
    render(<Banner tone="info" title="Hi" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers a real button with an accessible name that fires onDismiss', () => {
    const onDismiss = vi.fn();
    render(<Banner tone="info" title="Hi" onDismiss={onDismiss} />);
    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith();
  });

  it('lets the dismiss label be localised or made specific', () => {
    render(
      <Banner
        tone="info"
        title="Hi"
        onDismiss={() => undefined}
        dismissLabel="Dismiss allergy notice"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Dismiss allergy notice' }),
    ).toBeTruthy();
  });

  it('keeps the dismiss icon out of the accessible name', () => {
    render(<Banner tone="info" title="Hi" onDismiss={() => undefined} />);
    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });
});
