import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  CallSystemEvent,
  CallTranscriptConsole,
  CallTurn,
  CallWriteBack,
  formatCallTime,
  type CallTranscriptConsoleProps,
} from './call-transcript-console';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  return Array.from(node.childNodes)
    .map((child) =>
      child instanceof Element
        ? ` ${assistiveText(child)} `
        : assistiveText(child),
    )
    .join('');
}

const spoken = (node: Node) => assistiveText(node).replace(/\s+/g, ' ').trim();

const TITLE = 'Outbound · K. Yadamma, 63F';
const LANGUAGES = [
  { code: 'te', label: 'తెలుగు · Telugu' },
  { code: 'hi', label: 'हिन्दी · Hindi' },
  { code: 'en', label: 'English' },
];

function Console(props: Partial<CallTranscriptConsoleProps>) {
  return (
    <CallTranscriptConsole
      title={TITLE}
      subtitle="Follow-up recall · +91 98493 21574 · Telugu"
      languages={LANGUAGES}
      language="te"
      {...props}
    >
      {props.children ?? (
        <>
          <CallSystemEvent>
            The agent identifies itself as an AI in the first sentence.
          </CallSystemEvent>
          <CallTurn
            ai
            speaker="AI agent"
            contentLang="te"
            gloss="Am I speaking with Yadamma garu?"
            time="0:06"
          >
            యాదమ్మ గారు మాట్లాడుతున్నారా?
          </CallTurn>
          <CallTurn
            speaker="K. Yadamma · patient"
            contentLang="te"
            gloss="Yes, this is her."
            time="0:12"
          >
            అవును, నేనే మాట్లాడుతున్నాను.
          </CallTurn>
        </>
      )}
    </CallTranscriptConsole>
  );
}

const announcer = () =>
  document.querySelector('[data-slot="timer-announcer"]') as HTMLElement;

describe('CallTranscriptConsole: the frame', () => {
  it('is a group named by who is on the call, in the prototype’s .call-frame', () => {
    render(<Console />);
    const frame = screen.getByRole('group', { name: TITLE });
    for (const cls of [
      'border',
      'border-border-strong',
      'rounded-overlay',
      'overflow-hidden',
      'bg-surface-2',
    ]) {
      expect(frame.className.split(' ')).toContain(cls);
    }
  });

  it('has the chrome header: who, the subtitle, the language chips and the timer', () => {
    const { container } = render(<Console elapsed={92} state="live" />);
    const header = container.querySelector('[data-slot="call-header"]');
    expect(header?.getAttribute('data-surface')).toBe('chrome');
    const who = screen.getByText(TITLE);
    expect(who.className).toContain('text-input');
    expect(who.className).toContain('font-bold');
    expect(
      screen.getByText('Follow-up recall · +91 98493 21574 · Telugu').className,
    ).toContain('text-meta');
    const chips = container.querySelectorAll(
      '[data-slot="languages"] [data-tone]',
    );
    expect(chips).toHaveLength(3);
    expect(spoken(chips[0])).toBe('తెలుగు · Telugu , selected');
    // The language name is in its own language; the chip's ", selected" stays English.
    expect(chips[0].querySelector('[lang]')?.getAttribute('lang')).toBe('te');
    expect(chips[1].getAttribute('data-selected')).toBeNull();
    const timer = screen.getByRole('timer');
    expect(spoken(timer)).toBe('Call time 01:32');
    expect(timer.className).toContain('font-mono');
    expect(timer.className).toContain('text-body-sm');
  });

  it('formats the call time as mm:ss', () => {
    expect(formatCallTime(0)).toBe('00:00');
    expect(formatCallTime(132)).toBe('02:12');
    expect(formatCallTime(3725)).toBe('62:05');
  });

  it('keeps the transcript in a log named for the call, which scrolls and takes focus', () => {
    render(<Console />);
    const log = screen.getByRole('log', { name: `Call transcript ${TITLE}` });
    expect(log.tabIndex).toBe(0);
    for (const cls of [
      'min-h-(--nova-transcript-min-h)',
      'max-h-(--nova-transcript-max-h)',
      'overflow-y-auto',
    ]) {
      expect(log.className.split(' ')).toContain(cls);
    }
  });

  it('renders an optional footer after the transcript', () => {
    const { container } = render(<Console footer={<p>records</p>} />);
    const footer = container.querySelector('[data-slot="call-footer"]');
    expect(footer?.textContent).toBe('records');
    expect(footer?.className).toContain('border-t');
  });
});

describe('CallTranscriptConsole: turns and events', () => {
  it('draws the AI’s turns on the left, marked with ✦ and its speaker label in text', () => {
    const { container } = render(<Console />);
    const [ai, caller] = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-chat-bubble][data-tone="ai"], [data-chat-bubble][data-tone="default"]',
      ),
    );
    expect(ai.dataset.direction).toBe('in');
    expect(ai.querySelector('[data-slot="speaker"]')?.textContent).toBe(
      '✦ AI agent',
    );
    expect(spoken(ai)).toBe(
      'AI agent : యాదమ్మ గారు మాట్లాడుతున్నారా? Am I speaking with Yadamma garu? 0:06',
    );
    expect(caller.dataset.direction).toBe('out');
    expect(caller.className).toContain('bg-primary-soft');
    expect(
      caller.querySelector('[data-slot="content"]')?.getAttribute('lang'),
    ).toBe('te');
    expect(
      caller.querySelector('[data-slot="gloss"]')?.getAttribute('lang'),
    ).toBe('en');
  });

  it('marks an escalation with an icon and a word, never colour alone', () => {
    render(
      <Console>
        <CallSystemEvent critical>
          Transferred to Swapna · 3.1 s after the symptom was mentioned
        </CallSystemEvent>
      </Console>,
    );
    const event = screen
      .getByText(/Transferred to Swapna/)
      .closest('[data-chat-bubble]') as HTMLElement;
    expect(event.dataset.critical).toBe('true');
    expect(spoken(event)).toBe(
      'Escalation: Transferred to Swapna · 3.1 s after the symptom was mentioned',
    );
  });
});

describe('CallTranscriptConsole: states', () => {
  it('starts idle with a Play button and nothing live', () => {
    const onPlay = vi.fn();
    const onStateChange = vi.fn();
    render(<Console onPlay={onPlay} onStateChange={onStateChange} />);
    expect(screen.queryByText('Live')).toBeNull();
    const play = screen.getByRole('button', { name: 'Play call' });
    play.focus();
    fireEvent.click(play);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith('replaying');
    // The control that replaces it takes the focus.
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Pause replay' }),
    );
  });

  it('shows Live with a live dot and the timer while the line is open, and no replay controls', () => {
    const { container } = render(<Console state="live" elapsed={12} />);
    const live = container.querySelector(
      '[data-slot="call-state"] [role="status"]',
    );
    expect(live?.textContent).toBe('Live');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows who is speaking while a turn is being transcribed', () => {
    const { container } = render(
      <Console state="typing" typingLabel="K. Yadamma is speaking" />,
    );
    const typing = container.querySelector(
      '[data-chat-bubble][data-typing="true"]',
    ) as HTMLElement;
    expect(typing.dataset.direction).toBe('in');
    expect(spoken(typing)).toBe('K. Yadamma is speaking');
    expect(typing.closest('[role="log"]')).not.toBeNull();
    expect(
      container.querySelector('[data-slot="call-state"] [role="status"]')
        ?.textContent,
    ).toBe('Live');
  });

  it('shows the typing dots during a replay too, with the replay controls', () => {
    const { container } = render(
      <Console state="replaying" typing typingLabel="AI agent is speaking" />,
    );
    expect(
      container.querySelector('[data-chat-bubble][data-typing="true"]'),
    ).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Pause replay' })).toBeTruthy();
  });

  it('pauses and resumes a replay', () => {
    const onPausedChange = vi.fn();
    render(<Console state="replaying" onPausedChange={onPausedChange} />);
    expect(screen.getByText('Replaying')).toBeTruthy();
    const pause = screen.getByRole('button', { name: 'Pause replay' });
    pause.focus();
    fireEvent.click(pause);
    expect(onPausedChange).toHaveBeenCalledWith(true);
    const resume = screen.getByRole('button', { name: 'Resume replay' });
    expect(document.activeElement).toBe(resume);
    expect(screen.getByText('Paused')).toBeTruthy();
    fireEvent.click(resume);
    expect(onPausedChange).toHaveBeenLastCalledWith(false);
  });

  it('offers a replay once the call has ended', () => {
    const onReplay = vi.fn();
    render(<Console state="ended" elapsed={132} onReplay={onReplay} />);
    expect(screen.getByText('Call ended')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Replay call' }));
    expect(onReplay).toHaveBeenCalledTimes(1);
  });

  it('takes its words as props', () => {
    render(
      <Console
        labels={{ play: 'కాల్ ప్లే చేయండి', transcript: 'ట్రాన్స్‌క్రిప్ట్' }}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'కాల్ ప్లే చేయండి' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('log', { name: `ట్రాన్స్‌క్రిప్ట్ ${TITLE}` }),
    ).toBeTruthy();
  });
});

describe('CallTranscriptConsole: the timer is not announced every second', () => {
  it('says the call time politely every 30 seconds while live, and not at first', () => {
    const { rerender } = render(<Console state="live" elapsed={95} />);
    expect(announcer().getAttribute('role')).toBe('status');
    expect(announcer().textContent).toBe('');
    rerender(<Console state="live" elapsed={96} />);
    rerender(<Console state="live" elapsed={119} />);
    expect(announcer().textContent).toBe('');
    rerender(<Console state="live" elapsed={120} />);
    expect(announcer().textContent).toBe('Call time 2 minutes');
    rerender(<Console state="live" elapsed={121} />);
    expect(announcer().textContent).toBe('Call time 2 minutes');
    rerender(<Console state="live" elapsed={150} />);
    expect(announcer().textContent).toBe('Call time 2 minutes 30 seconds');
  });

  it('stays quiet while replaying', () => {
    const { rerender } = render(<Console state="replaying" elapsed={0} />);
    rerender(<Console state="replaying" elapsed={60} />);
    expect(announcer().textContent).toBe('');
  });
});

describe('CallWriteBack', () => {
  it('lists what the call wrote back while the line was open', () => {
    render(
      <CallWriteBack
        records={[
          {
            id: 'appt',
            title: 'Appointment created',
            detail: 'Mon 20 Jul 2026, 09:30 AM · Dr. K. Ramesh · Room 3',
          },
          { id: 'token', title: 'Token T-27 issued' },
        ]}
      />,
    );
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Written back while the line was open',
      }),
    ).toBeTruthy();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(spoken(items[0])).toBe(
      'Appointment created Mon 20 Jul 2026, 09:30 AM · Dr. K. Ramesh · Room 3',
    );
    expect(items[0].querySelector('[aria-hidden="true"]')?.textContent).toBe(
      '✓',
    );
  });

  it('says nothing has been written yet, in the caller’s words', () => {
    render(<CallWriteBack records={[]} empty="Nothing yet. Play the call." />);
    expect(screen.getByText('Nothing yet. Play the call.')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });
});

describe('CallTranscriptConsole: health data', () => {
  it('never logs or stores what was said', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { rerender } = render(
      <Console state="live" elapsed={0}>
        <CallTurn speaker="Caller · son">Ramesh has chest pain</CallTurn>
      </Console>,
    );
    rerender(
      <Console state="live" elapsed={30}>
        <CallTurn speaker="Caller · son">Ramesh has chest pain</CallTurn>
        <CallSystemEvent critical>Transferred Ramesh to Swapna</CallSystemEvent>
      </Console>,
    );
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
