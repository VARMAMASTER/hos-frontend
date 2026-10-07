import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import {
  PhoneFrame,
  WaBilingualMessage,
  WaMessage,
  WaQuickReplyButtons,
  WaTypingIndicator,
  WhatsAppThread,
} from './whatsapp-thread';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  // Elements are joined with a space: a screen reader pauses between a bubble's blocks.
  return Array.from(node.childNodes)
    .map((child) =>
      child instanceof Element
        ? ` ${assistiveText(child)} `
        : assistiveText(child),
    )
    .join('');
}

const spoken = (node: Node) => assistiveText(node).replace(/\s+/g, ' ').trim();

const SLOTS = [
  { value: '10:00', label: '10:00 AM — available' },
  { value: '11:30', label: '11:30 AM — available' },
  { value: '16:00', label: '04:00 PM — available' },
];

describe('PhoneFrame', () => {
  it('is a group named by whoever the chat is with, with WhatsApp’s header and wall', () => {
    const { container } = render(
      <PhoneFrame name="Padma Sree" subtitle="+91 98480 1123•">
        <p>body</p>
      </PhoneFrame>,
    );
    const frame = screen.getByRole('group', { name: 'Padma Sree' });
    for (const cls of [
      'max-w-xs',
      'rounded-hero',
      'overflow-hidden',
      'border-border-strong',
      'shadow-md',
    ]) {
      expect(frame.className.split(' ')).toContain(cls);
    }
    const header = container.querySelector('[data-slot="phone-header"]');
    expect(header?.className).toContain('bg-wa-header');
    expect(header?.className).toContain('text-wa-header-ink');
    expect(header?.className).toContain('text-control');
    expect(screen.getByText('+91 98480 1123•')).toBeTruthy();
    const body = container.querySelector('[data-slot="phone-body"]');
    expect(body?.className).toContain('nova-wa-wall');
    expect(body?.textContent).toBe('body');
  });

  it('shows an avatar with the initials, named for a screen reader', () => {
    render(<PhoneFrame name="Lakshmi Devi">x</PhoneFrame>);
    expect(screen.getByRole('img', { name: 'Lakshmi Devi' }).textContent).toBe(
      'LD',
    );
  });

  it('takes a status tag and a badge slot (the after-hours notice) at the top of the body', () => {
    const { container } = render(
      <PhoneFrame
        name="Sri Venkateshwara Hospital"
        status="AI Assistant"
        badge="Front desk closed · 11:47 PM · AI handling solo"
      >
        <p>first</p>
      </PhoneFrame>,
    );
    const status = container.querySelector('[data-slot="phone-status"]');
    expect(status?.textContent).toBe('AI Assistant');
    expect(status?.className).toContain('font-mono');
    const body = container.querySelector('[data-slot="phone-body"]');
    expect(body?.firstElementChild?.textContent).toBe(
      'Front desk closed · 11:47 PM · AI handling solo',
    );
  });

  it('rings focus in the WhatsApp accent, which holds 3:1 on the wall and both bubbles', () => {
    render(<PhoneFrame name="Padma Sree">x</PhoneFrame>);
    expect(screen.getByRole('group').className).toContain(
      '[--nova-focus-ring:var(--nova-wa-accent)]',
    );
  });
});

describe('WaMessage', () => {
  it('is a WhatsApp bubble that says who sent it, out of sight', () => {
    const { container, rerender } = render(
      <WaMessage time="09:24 AM">Namaste</WaMessage>,
    );
    const bubble = container.querySelector('[data-chat-bubble]') as HTMLElement;
    expect(bubble.dataset.palette).toBe('whatsapp');
    expect(spoken(bubble)).toBe('Patient said: Namaste 09:24 AM');
    rerender(
      <WaMessage direction="out" time="09:25 AM">
        Confirmed
      </WaMessage>,
    );
    expect(spoken(container.querySelector('[data-chat-bubble]') as Node)).toBe(
      'You sent: Confirmed 09:25 AM',
    );
  });

  it('marks the AI’s messages with the ✦ and a word, and says so', () => {
    const { container } = render(
      <WaMessage direction="out" tone="ai">
        Confirmed ✅
      </WaMessage>,
    );
    const bubble = container.querySelector('[data-chat-bubble]') as HTMLElement;
    expect(container.querySelector('[data-slot="speaker"]')?.textContent).toBe(
      '✦ AI assistant',
    );
    expect(spoken(bubble)).toBe('AI assistant sent: Confirmed ✅');
  });

  it('takes its words as props', () => {
    const { container } = render(
      <WaMessage
        labels={{ patientSaid: 'రోగి చెప్పారు' }}
        status="delivered"
        time="09:24"
      >
        x
      </WaMessage>,
    );
    expect(
      spoken(container.querySelector('[data-chat-bubble]') as Node),
    ).toContain('రోగి చెప్పారు: x');
  });

  it.each([
    ['pending', 'Sending', ''],
    ['sent', 'Sent', '✓'],
    ['delivered', 'Delivered', '✓✓'],
  ] as const)(
    'shows %s with a mark and the word for a screen reader',
    (status, word, ticks) => {
      const { container } = render(
        <WaMessage direction="out" status={status} time="09:24 AM">
          Hello
        </WaMessage>,
      );
      const delivery = container.querySelector(
        '[data-slot="delivery"]',
      ) as HTMLElement;
      expect(delivery.dataset.status).toBe(status);
      expect(spoken(delivery)).toBe(word);
      expect(delivery.querySelector('[aria-hidden="true"]')).not.toBeNull();
      if (ticks) {
        expect(
          delivery.querySelector('[aria-hidden="true"]')?.textContent,
        ).toBe(ticks);
      }
    },
  );

  it('shows read as ticks and a visible word, never colour alone', () => {
    const { container } = render(
      <WaMessage direction="out" status="read" time="09:24 AM">
        Hello
      </WaMessage>,
    );
    const delivery = container.querySelector(
      '[data-slot="delivery"]',
    ) as HTMLElement;
    expect(delivery.textContent).toBe('✓✓Read');
    expect(spoken(delivery)).toBe('Read');
    expect(delivery.className).toContain('text-wa-accent');
  });

  it('shows a failed message as "Not sent" under the bubble, with a Retry button', () => {
    const onRetry = vi.fn();
    const { container } = render(
      <WaMessage direction="out" status="failed" onRetry={onRetry}>
        Your token is T-27
      </WaMessage>,
    );
    const note = container.querySelector('[data-slot="failed"]') as HTMLElement;
    expect(note.className).toContain('text-crit-deep');
    expect(spoken(note)).toContain('Not sent');
    const retry = screen.getByRole('button', { name: 'Retry' });
    const described = document.getElementById(
      retry.getAttribute('aria-describedby') ?? '',
    );
    expect(described?.textContent).toBe('Your token is T-27');
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows no Retry without a handler', () => {
    render(
      <WaMessage direction="out" status="failed">
        x
      </WaMessage>,
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(screen.getByText('Not sent')).toBeTruthy();
  });
});

describe('WaBilingualMessage', () => {
  it('carries the native text in its language and the English gloss under it', () => {
    const { container } = render(
      <WaBilingualMessage
        direction="out"
        lang="te"
        gloss="Your new lab report is published."
      >
        మీ కొత్త ల్యాబ్ రిపోర్ట్ ప్రచురించబడింది.
      </WaBilingualMessage>,
    );
    expect(
      container.querySelector('[data-slot="content"]')?.getAttribute('lang'),
    ).toBe('te');
    const gloss = container.querySelector('[data-slot="gloss"]');
    expect(gloss?.getAttribute('lang')).toBe('en');
    expect(gloss?.textContent).toBe('Your new lab report is published.');
  });
});

describe('WaTypingIndicator', () => {
  it('is a typing bubble that says who is typing', () => {
    const { container } = render(
      <WaTypingIndicator direction="in" label="Padma Sree is typing" />,
    );
    const bubble = container.querySelector('[data-chat-bubble]') as HTMLElement;
    expect(bubble.dataset.typing).toBe('true');
    expect(bubble.dataset.palette).toBe('whatsapp');
    expect(spoken(bubble)).toBe('Padma Sree is typing');
  });
});

describe('WaQuickReplyButtons', () => {
  it('is a labelled group of reply buttons', () => {
    render(<WaQuickReplyButtons label="Pick a slot" options={SLOTS} />);
    const group = screen.getByRole('group', { name: 'Pick a slot' });
    expect(group.querySelectorAll('button')).toHaveLength(3);
    const first = screen.getByRole('button', { name: '10:00 AM — available' });
    expect(first.getAttribute('aria-pressed')).toBeNull();
    expect(first.className).toContain('text-wa-accent');
  });

  it('locks once one is picked, showing the chosen one pressed', () => {
    const onValueChange = vi.fn();
    render(
      <WaQuickReplyButtons options={SLOTS} onValueChange={onValueChange} />,
    );
    const chosen = screen.getByRole('button', { name: /11:30 AM/ });
    chosen.focus();
    fireEvent.click(chosen);
    expect(onValueChange).toHaveBeenCalledWith('11:30');
    expect(chosen.getAttribute('aria-pressed')).toBe('true');
    expect(chosen.getAttribute('aria-disabled')).toBe('true');
    for (const other of [/10:00 AM/, /04:00 PM/]) {
      const button = screen.getByRole('button', { name: other });
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(button);
    }
    expect(onValueChange).toHaveBeenCalledTimes(1);
    // The chosen one keeps its tick and keeps the focus.
    expect(chosen.querySelector('[aria-hidden="true"]')?.textContent).toBe('✓');
    expect(document.activeElement).toBe(chosen);
  });

  it('can be controlled', () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>(null);
      return (
        <>
          <WaQuickReplyButtons
            options={SLOTS}
            value={value}
            onValueChange={setValue}
          />
          <output>{value ?? 'none'}</output>
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: /04:00 PM/ }));
    expect(screen.getByText('16:00')).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: /04:00 PM/ })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('shows a stored choice already locked', () => {
    render(<WaQuickReplyButtons options={SLOTS} value="10:00" />);
    expect(
      screen
        .getByRole('button', { name: /10:00 AM/ })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });
});

describe('WhatsAppThread', () => {
  function Thread({ more = [] as string[], outgoing = false }) {
    return (
      <WhatsAppThread name="Padma Sree">
        <WaMessage time="09:24 AM">Dr. Sunitha Rao, tomorrow please</WaMessage>
        {more.map((text) => (
          <WaMessage key={text} direction={outgoing ? 'out' : 'in'}>
            {text}
          </WaMessage>
        ))}
      </WhatsAppThread>
    );
  }

  const announcer = () =>
    document.querySelector('[data-slot="announcer"]') as HTMLElement;

  it('is a log named for the conversation, inside the phone', () => {
    render(<Thread />);
    const log = screen.getByRole('log', {
      name: 'WhatsApp conversation with Padma Sree',
    });
    expect(log.getAttribute('aria-live')).toBe('off');
    expect(log.closest('[role="group"]')).not.toBeNull();
    expect(log.className).toContain('nova-wa-wall');
  });

  it('takes the log’s name as a prop', () => {
    render(
      <WhatsAppThread name="Padma Sree" label="Booking chat">
        x
      </WhatsAppThread>,
    );
    expect(screen.getByRole('log', { name: 'Booking chat' })).toBeTruthy();
  });

  it('announces a new incoming message politely, but not the ones already there', () => {
    const { rerender } = render(<Thread />);
    expect(announcer().getAttribute('role')).toBe('status');
    expect(announcer().textContent).toBe('');
    rerender(<Thread more={['11:30 is fine']} />);
    expect(announcer().textContent).toBe('Patient said: 11:30 is fine');
  });

  it('does not announce what this side sent, unless asked to', () => {
    const { rerender } = render(<Thread />);
    rerender(<Thread outgoing more={['Confirmed']} />);
    expect(announcer().textContent).toBe('');
    cleanup();
    function All({ more }: { more: string[] }) {
      return (
        <WhatsAppThread name="Padma Sree" announce="all">
          {more.map((text) => (
            <WaMessage key={text} direction="out">
              {text}
            </WaMessage>
          ))}
        </WhatsAppThread>
      );
    }
    const second = render(<All more={[]} />);
    second.rerender(<All more={['Confirmed']} />);
    expect(announcer().textContent).toBe('You sent: Confirmed');
  });

  it('announces a message that failed to send', () => {
    function Failing({ status }: { status: 'sent' | 'failed' }) {
      return (
        <WhatsAppThread name="Padma Sree">
          <WaMessage direction="out" status={status}>
            Your token is T-27
          </WaMessage>
        </WhatsAppThread>
      );
    }
    const { rerender } = render(<Failing status="sent" />);
    rerender(<Failing status="failed" />);
    expect(announcer().textContent).toBe('Not sent: Your token is T-27');
  });

  it('never logs or stores what was said', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { rerender } = render(<Thread />);
    rerender(<Thread more={['Ramesh has chest pain']} />);
    fireEvent.click(screen.getByRole('log'));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
