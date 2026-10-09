import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { WorkerCard, WorkerGrid } from './worker-card';

afterEach(() => cleanup());

const card = () =>
  screen.getByRole('article', { name: 'AI worker: WhatsApp Assistant' });
const toggle = () => screen.getByRole('switch', { name: /WhatsApp Assistant/ });
const statusLine = () => within(card()).getByRole('status');

// Lets a confirmation promise settle.
const flush = () => act(() => Promise.resolve());

describe('WorkerCard', () => {
  it('is an article named for the AI worker, with the spark hidden and the name, role and stat shown', () => {
    render(
      <WorkerCard
        name="WhatsApp Assistant"
        role="Front desk · Te/En/Hi"
        stat="23 chats answered · 14 bookings today"
        hint="Full stats in the WhatsApp Assistant tab"
      />,
    );
    const article = card();
    expect(
      within(article).getByRole('heading', { level: 3 }).textContent,
    ).toContain('WhatsApp Assistant');
    const spark = article.querySelector('[data-spark]');
    expect(spark?.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(spark?.textContent).toBe('');
    expect(spark?.getAttribute('aria-hidden')).toBe('true');
    expect(article.textContent).toContain('Front desk · Te/En/Hi');
    expect(article.textContent).toContain(
      '23 chats answered · 14 bookings today',
    );
    expect(article.textContent).toContain('Full stats');
  });

  it('has an On switch whose accessible name includes the worker name, on by default, with a Live chip', () => {
    render(<WorkerCard name="WhatsApp Assistant" />);
    expect(toggle().getAttribute('aria-checked')).toBe('true');
    expect(toggle().textContent).toBe('');
    expect(card().textContent).toContain('On');
    expect(card().querySelector('[data-live]')?.textContent).toContain('Live');
  });

  it('says idle in a polite status line that names the worker', () => {
    render(<WorkerCard name="WhatsApp Assistant" />);
    expect(statusLine().textContent).toBe('WhatsApp Assistant: idle');
    expect(statusLine().querySelector('.motion-safe\\:animate-heartbeat')).toBe(
      null,
    );
  });

  it('pulses the status dot only while working, in words as well', () => {
    render(<WorkerCard name="WhatsApp Assistant" status="working" />);
    expect(statusLine().textContent).toBe('WhatsApp Assistant: working…');
    expect(
      statusLine().querySelector('.motion-safe\\:animate-heartbeat'),
    ).not.toBe(null);
  });

  it('shows an error state with its message, never by colour alone', () => {
    render(
      <WorkerCard
        name="WhatsApp Assistant"
        status="error"
        errorMessage="WhatsApp Business API is not answering"
      />,
    );
    expect(statusLine().textContent).toBe('WhatsApp Assistant: error');
    expect(statusLine().querySelector('[data-tone="crit"]')).not.toBe(null);
    expect(card().textContent).toContain(
      'WhatsApp Business API is not answering',
    );
  });

  it('turns off with no confirmation asked: paused, and the chip says Off', () => {
    const onEnabledChange = vi.fn();
    render(
      <WorkerCard
        name="WhatsApp Assistant"
        status="working"
        onEnabledChange={onEnabledChange}
      />,
    );
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    expect(onEnabledChange).toHaveBeenCalledWith(false);
    expect(statusLine().textContent).toBe('WhatsApp Assistant: paused');
    expect(card().querySelector('[data-live]')?.textContent).toContain('Off');
  });

  it('asks the confirmation callback before turning off, and stays on when it is refused', async () => {
    const confirmDisable = vi.fn(() => false);
    const onEnabledChange = vi.fn();
    render(
      <WorkerCard
        name="WhatsApp Assistant"
        confirmDisable={confirmDisable}
        onEnabledChange={onEnabledChange}
      />,
    );
    fireEvent.click(toggle());
    await flush();
    expect(confirmDisable).toHaveBeenCalledTimes(1);
    expect(toggle().getAttribute('aria-checked')).toBe('true');
    expect(onEnabledChange).not.toHaveBeenCalled();
  });

  it('turns off once an asynchronous confirmation resolves true', async () => {
    const confirmDisable = vi.fn(() => Promise.resolve(true));
    const onEnabledChange = vi.fn();
    render(
      <WorkerCard
        name="WhatsApp Assistant"
        confirmDisable={confirmDisable}
        onEnabledChange={onEnabledChange}
      />,
    );
    fireEvent.click(toggle());
    await flush();
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    expect(onEnabledChange).toHaveBeenCalledWith(false);
  });

  it('turns back on without asking', () => {
    const confirmDisable = vi.fn(() => true);
    render(
      <WorkerCard
        name="WhatsApp Assistant"
        defaultEnabled={false}
        confirmDisable={confirmDisable}
      />,
    );
    fireEvent.click(toggle());
    expect(confirmDisable).not.toHaveBeenCalled();
    expect(toggle().getAttribute('aria-checked')).toBe('true');
  });

  it('only reports when controlled: the parent decides', () => {
    const onEnabledChange = vi.fn();
    render(
      <WorkerCard
        name="WhatsApp Assistant"
        enabled
        onEnabledChange={onEnabledChange}
      />,
    );
    fireEvent.click(toggle());
    expect(onEnabledChange).toHaveBeenCalledWith(false);
    expect(toggle().getAttribute('aria-checked')).toBe('true');
  });

  it('shows the tier chip, and a RED tier locks the switch off', () => {
    const { rerender } = render(
      <WorkerCard
        name="WhatsApp Assistant"
        tier="green"
        tierDetail="productivity"
      />,
    );
    expect(card().textContent).toContain('Tier: green · productivity');
    rerender(<WorkerCard name="WhatsApp Assistant" tier="red" />);
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    expect(toggle().hasAttribute('disabled')).toBe(true);
  });

  it('takes every fixed word as a prop, and a lang for its content', () => {
    render(
      <WorkerCard
        name="WhatsApp Assistant"
        stat="23 చాట్‌లు"
        contentLang="te"
        labels={{
          aiWorker: 'एआई कर्मी',
          switchLabel: 'चालू',
          live: 'लाइव',
          status: { idle: 'निष्क्रिय' },
        }}
      />,
    );
    expect(
      screen.getByRole('article', { name: 'एआई कर्मी: WhatsApp Assistant' }),
    ).toBeTruthy();
    expect(screen.getByRole('switch', { name: /चालू/ })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(
      'WhatsApp Assistant: निष्क्रिय',
    );
    expect(
      screen.getByText('23 చాట్‌లు').closest('[lang]')?.getAttribute('lang'),
    ).toBe('te');
  });
});

describe('WorkerGrid', () => {
  it('lays the cards out as a named list, one item per card', () => {
    render(
      <WorkerGrid aria-label="AI workers">
        <WorkerCard name="WhatsApp Assistant" />
        <WorkerCard name="AI Scribe" />
      </WorkerGrid>,
    );
    const list = screen.getByRole('list', { name: 'AI workers' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    // As many columns as fit, each at least the card's token width.
    expect(list.className.split(' ')).toContain(
      'grid-cols-[repeat(auto-fill,minmax(var(--nova-worker-card-min-w),1fr))]',
    );
  });

  it('draws each card on the card tokens: the card corner and padding, the rail top edge', () => {
    render(<WorkerCard name="WhatsApp Assistant" />);
    const classes = card().className.split(' ');
    for (const cls of [
      'rounded-card',
      'border-t-rail',
      'px-card',
      'pt-card',
      'gap-s4',
    ]) {
      expect(classes).toContain(cls);
    }
  });
});
