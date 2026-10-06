import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChatBubble } from './chat-bubble';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// What a screen reader reads: the text, minus anything hidden from assistive technology.
function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  return Array.from(node.childNodes).map(assistiveText).join('');
}

const spoken = (node: Node) => assistiveText(node).replace(/\s+/g, ' ').trim();

function bubble(container: HTMLElement): HTMLElement {
  const found = container.querySelector<HTMLElement>('[data-chat-bubble]');
  if (!found) throw new Error('no bubble rendered');
  return found;
}

function motionPreference(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: reduce && query.includes('reduce'),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

describe('ChatBubble: direction and palette', () => {
  it('sits on the left, in the incoming fill, by default', () => {
    const { container } = render(<ChatBubble>Namaste</ChatBubble>);
    const el = bubble(container);
    expect(el.dataset.direction).toBe('in');
    expect(el.dataset.palette).toBe('nova');
    expect(el.className).toContain('self-start');
    expect(el.className).toContain('bg-surface');
  });

  it('sits on the right in the outgoing fill', () => {
    const { container } = render(
      <ChatBubble direction="out">Yes, this is her.</ChatBubble>,
    );
    const el = bubble(container);
    expect(el.className).toContain('self-end');
    expect(el.className).toContain('bg-primary-soft');
  });

  it('takes the WhatsApp fills, inks and a wider bubble cap from the WhatsApp tokens', () => {
    const { container, rerender } = render(
      <ChatBubble palette="whatsapp">Namaste</ChatBubble>,
    );
    expect(bubble(container).className).toContain('bg-wa-in');
    expect(bubble(container).className).toContain('text-wa-ink');
    rerender(
      <ChatBubble palette="whatsapp" direction="out">
        Namaste
      </ChatBubble>,
    );
    expect(bubble(container).className).toContain('bg-wa-out');
  });

  it('is the prototype .wa-msg: 12.5px, 8px by 10px, a small shadow', () => {
    const { container } = render(<ChatBubble>Namaste</ChatBubble>);
    const classes = bubble(container).className.split(' ');
    for (const cls of ['text-[12.5px]', 'py-2', 'px-2.5', 'shadow-sm']) {
      expect(classes).toContain(cls);
    }
  });
});

describe('ChatBubble: speaker, gloss, time and delivery', () => {
  it('shows the speaker label as text', () => {
    const { container } = render(
      <ChatBubble speaker="K. Yadamma · patient">Yes.</ChatBubble>,
    );
    expect(spoken(bubble(container))).toBe('K. Yadamma · patient: Yes.');
  });

  it('marks AI with the ✦ and a word, never colour alone', () => {
    const { container, rerender } = render(
      <ChatBubble tone="ai" speaker="AI agent">
        Namaste.
      </ChatBubble>,
    );
    const label = container.querySelector('[data-slot="speaker"]');
    expect(label?.textContent).toBe('✦ AI agent');
    // The spark is decoration: the word carries the meaning.
    expect(spoken(label as Node)).toBe('AI agent');
    rerender(<ChatBubble tone="ai">Namaste.</ChatBubble>);
    expect(container.querySelector('[data-slot="speaker"]')?.textContent).toBe(
      '✦ AI',
    );
    rerender(
      <ChatBubble tone="ai" aiLabel="AI assistant">
        Namaste.
      </ChatBubble>,
    );
    expect(container.querySelector('[data-slot="speaker"]')?.textContent).toBe(
      '✦ AI assistant',
    );
  });

  it('sets the language on the content and English on the gloss', () => {
    const { container } = render(
      <ChatBubble contentLang="te" gloss="Yes, this is her.">
        అవును, నేనే మాట్లాడుతున్నాను.
      </ChatBubble>,
    );
    const content = container.querySelector('[data-slot="content"]');
    const gloss = container.querySelector('[data-slot="gloss"]');
    expect(content?.getAttribute('lang')).toBe('te');
    expect(gloss?.getAttribute('lang')).toBe('en');
    expect(gloss?.textContent).toBe('Yes, this is her.');
  });

  it('takes the gloss language as a prop', () => {
    const { container } = render(
      <ChatBubble contentLang="te" gloss="हाँ" glossLang="hi">
        అవును
      </ChatBubble>,
    );
    expect(
      container.querySelector('[data-slot="gloss"]')?.getAttribute('lang'),
    ).toBe('hi');
  });

  it('italicises the call gloss and keeps the WhatsApp gloss upright, as the prototype does', () => {
    const { container, rerender } = render(
      <ChatBubble gloss="Yes.">అవును</ChatBubble>,
    );
    expect(container.querySelector('[data-slot="gloss"]')?.className).toContain(
      'italic',
    );
    rerender(
      <ChatBubble palette="whatsapp" gloss="Yes.">
        అవును
      </ChatBubble>,
    );
    expect(
      container.querySelector('[data-slot="gloss"]')?.className,
    ).not.toContain('italic');
  });

  it('stamps the time as a <time> and puts the delivery slot after it', () => {
    const { container } = render(
      <ChatBubble
        time="09:24 AM"
        dateTime="2026-07-18T09:24"
        delivery={<span data-testid="ticks">✓✓</span>}
      >
        Namaste
      </ChatBubble>,
    );
    const time = container.querySelector('time');
    expect(time?.textContent).toBe('09:24 AM');
    expect(time?.getAttribute('datetime')).toBe('2026-07-18T09:24');
    const meta = container.querySelector('[data-slot="meta"]');
    expect(meta?.lastElementChild?.getAttribute('data-testid')).toBe('ticks');
    expect(meta?.className).toContain('text-[9.5px]');
  });

  it('puts the actions (quick replies) after the content', () => {
    const { container } = render(
      <ChatBubble actions={<button type="button">10:00 AM</button>}>
        Pick a slot
      </ChatBubble>,
    );
    const actions = container.querySelector('[data-slot="actions"]');
    expect(actions?.previousElementSibling?.getAttribute('data-slot')).toBe(
      'content',
    );
    expect(screen.getByRole('button', { name: '10:00 AM' })).toBeTruthy();
  });
});

describe('ChatBubble: who said it, for a screen reader', () => {
  it('starts with a hidden sender prefix, and then the visible speaker is not read twice', () => {
    const { container } = render(
      <ChatBubble senderLabel="Patient said" speaker="Padma Sree">
        Dr. Sunitha Rao, tomorrow please.
      </ChatBubble>,
    );
    const prefix = container.querySelector('[data-slot="sender"]');
    expect(prefix?.className).toContain('sr-only');
    expect(spoken(bubble(container))).toBe(
      'Patient said: Dr. Sunitha Rao, tomorrow please.',
    );
  });
});

describe('ChatBubble: system events', () => {
  it('is a centred pill, not a bubble, with the dashed edge of .call-sys', () => {
    const { container } = render(
      <ChatBubble tone="system">
        The agent identifies itself as an AI in the first sentence.
      </ChatBubble>,
    );
    const el = bubble(container);
    expect(el.dataset.tone).toBe('system');
    for (const cls of [
      'self-center',
      'text-center',
      'rounded-full',
      'border-dashed',
      'border-border-strong',
      'text-ink-2',
      'text-[11.5px]',
    ]) {
      expect(el.className.split(' ')).toContain(cls);
    }
  });

  it('marks a critical event (an escalation) with an icon and a word, never colour alone', () => {
    const { container } = render(
      <ChatBubble tone="system" critical>
        Transferred to Swapna · 3.1 s after the symptom was mentioned
      </ChatBubble>,
    );
    const el = bubble(container);
    expect(el.dataset.critical).toBe('true');
    expect(el.className).toContain('bg-crit-soft');
    expect(el.className).toContain('text-crit-deep');
    expect(el.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(spoken(el)).toBe(
      'Escalation: Transferred to Swapna · 3.1 s after the symptom was mentioned',
    );
  });

  it('takes the critical word as a prop', () => {
    const { container } = render(
      <ChatBubble tone="system" critical criticalLabel="अत्यावश्यक">
        Transferred
      </ChatBubble>,
    );
    expect(spoken(bubble(container))).toBe('अत्यावश्यक: Transferred');
  });
});

describe('ChatBubble: typing', () => {
  it('shows three dots hidden from assistive technology and says who is typing in words', () => {
    motionPreference(true);
    const { container } = render(
      <ChatBubble typing typingLabel="Patient is typing" />,
    );
    const el = bubble(container);
    expect(el.dataset.typing).toBe('true');
    const dots = el.querySelector('[data-slot="dots"]');
    expect(dots?.getAttribute('aria-hidden')).toBe('true');
    expect(dots?.children).toHaveLength(3);
    expect(spoken(el)).toBe('Patient is typing');
  });

  it('says "Typing…" by default', () => {
    motionPreference(true);
    const { container } = render(<ChatBubble typing />);
    expect(spoken(bubble(container))).toBe('Typing…');
  });

  it('bounces the dots only when motion is welcome', () => {
    const animate = vi.fn();
    Element.prototype.animate = animate as unknown as Element['animate'];
    motionPreference(true);
    const { unmount } = render(<ChatBubble typing />);
    expect(animate).not.toHaveBeenCalled();
    unmount();
    motionPreference(false);
    render(<ChatBubble typing />);
    expect(animate).toHaveBeenCalledTimes(3);
    delete (Element.prototype as { animate?: unknown }).animate;
  });
});

describe('ChatBubble: health data', () => {
  it('never logs or stores what was said', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(
      <ChatBubble speaker="Ramesh" gloss="Ramesh has chest pain" time="0:14">
        Ramesh has chest pain
      </ChatBubble>,
    );
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
