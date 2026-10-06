import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  VoiceEntryCapture,
  type VoiceEntryCaptureProps,
  type VoiceParsed,
} from './voice-entry-capture';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const TITLE = 'Voice entry — GM-03';

function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  return Array.from(node.childNodes).map(assistiveText).join('');
}

function block() {
  return screen.getByRole('group', { name: TITLE });
}

function statusText() {
  const region = block().querySelector('[role="status"]');
  return assistiveText(region as Node)
    .replace(/\s+/g, ' ')
    .trim();
}

function field(name: RegExp | string) {
  return screen.getByRole('textbox', { name }) as HTMLInputElement;
}

function describedText(input: HTMLElement) {
  return (input.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' | ');
}

const SAID =
  '“GM-03 Irfan, temperature nooru point four, pulse ninety-six, BP one twenty-two by seventy-eight, respiratory rate nineteen, SpO₂ ninety-eight room air, sugar nooru four.”';

const PARSED: VoiceParsed = {
  temp: { value: '100.4', confidence: 'low', heard: 'nooru point four' },
  pulse: { value: '96' },
  sys: { value: '122' },
  dia: { value: '78' },
  rr: { value: '19' },
  spo2: { value: '98' },
  grbs: { value: '104' },
};

function Capture(props: Partial<VoiceEntryCaptureProps>) {
  return (
    <VoiceEntryCapture
      title={TITLE}
      approverName="Mary Grace"
      transcript={SAID}
      lastValues={{ temp: '100.6', pulse: '98', pain: '2' }}
      {...props}
    />
  );
}

describe('VoiceEntryCapture: listening', () => {
  it('is an AI draft block that says it is listening, with "What you said" in the speaker\'s language', () => {
    render(<Capture status="listening" transcriptLang="te" />);
    expect(block().classList.contains('nova-ai-block')).toBe(true);
    expect(statusText()).toBe('Listening…');
    expect(screen.getByRole('heading', { name: 'What you said' })).toBeTruthy();
    const said = block().querySelector('[data-slot="transcript"]');
    expect(said?.getAttribute('lang')).toBe('te');
    expect(said?.textContent).toContain('nooru point four');
  });

  it('shows no chart fields until the words are parsed, and the caret only while listening', () => {
    render(<Capture status="listening" />);
    expect(
      screen.queryByRole('heading', { name: 'What HOS will chart' }),
    ).toBeNull();
    expect(within(block()).queryAllByRole('textbox')).toHaveLength(0);
    expect(block().querySelector('[data-slot="caret"]')).not.toBeNull();
  });
});

describe('VoiceEntryCapture: parsed', () => {
  it('pre-fills what was said as editable fields, with the unit in each name', () => {
    render(<Capture status="parsed" parsed={PARSED} />);
    expect(
      screen.getByRole('heading', { name: 'What HOS will chart' }),
    ).toBeTruthy();
    expect(field(/^Temp/).value).toBe('100.4');
    expect(field(/^Temp/).readOnly).toBe(false);
    expect(field(/^Pulse/).value).toBe('96');
    expect(field(/^SpO₂/).value).toBe('98');
    // The unit is beside the input for the eye and in the name for a screen reader.
    expect(field('Temp (°F)')).toBeTruthy();
    const unit = block().querySelector(
      '[data-field="temp"] [data-slot="unit"]',
    );
    expect(unit?.textContent).toBe('°F');
  });

  it('leaves a field that was not spoken empty, never guessed from the last value', () => {
    render(<Capture status="parsed" parsed={PARSED} />);
    const pain = field(/^Pain/);
    expect(pain.value).toBe('');
    expect(describedText(pain)).toContain('last 2');
  });

  it('marks a low-confidence value with the AI source line marking, tied to the field', () => {
    render(<Capture status="parsed" parsed={PARSED} />);
    const temp = field(/^Temp/);
    expect(describedText(temp)).toContain('Low confidence — read it yourself');
    expect(describedText(temp)).toContain('nooru point four');
    expect(describedText(field(/^Pulse/))).not.toContain('Low confidence');
  });

  it('flags an out-of-range value with an icon and words, not colour alone', () => {
    render(<Capture status="parsed" parsed={PARSED} />);
    const temp = field(/^Temp/);
    expect(describedText(temp)).toMatch(/Above the usual range/);
    const flag = block().querySelector(
      '[data-field="temp"] [data-slot="range"]',
    );
    expect(flag?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(describedText(field(/^Pulse/))).not.toMatch(/usual range/);
    fireEvent.change(field(/^Pulse/), { target: { value: '42' } });
    expect(describedText(field(/^Pulse/))).toMatch(/Below the usual range/);
  });

  it('counts the values in the approve button, and Approve comes before "Say it again"', () => {
    render(<Capture status="parsed" parsed={PARSED} />);
    const names = within(block())
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names).toEqual(['Approve & chart 7 vitals', 'Say it again']);
    expect(document.activeElement).toBe(document.body);
  });

  it('cannot be approved with no value at all, and says why', () => {
    render(<Capture status="parsed" parsed={{}} />);
    expect(statusText()).toBe('Blocked');
    expect(screen.queryByRole('button', { name: /^Approve/ })).toBeNull();
    expect(screen.getByText(/Nothing to chart yet/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Say it again' })).toBeTruthy();
  });

  it('announces what was heard once, when it is parsed', () => {
    const { rerender } = render(<Capture status="listening" />);
    const live = block().querySelector('[data-slot="heard-live"]');
    expect(live?.getAttribute('aria-live')).toBe('polite');
    expect(live?.textContent).toBe('');
    rerender(<Capture status="parsed" parsed={PARSED} />);
    expect(
      block().querySelector('[data-slot="heard-live"]')?.textContent,
    ).toContain('nooru point four');
  });

  it('fills the fields when the parse arrives after listening', () => {
    const { rerender } = render(<Capture defaultStatus="listening" />);
    rerender(
      <Capture defaultStatus="listening" status="parsed" parsed={PARSED} />,
    );
    expect(field(/^Temp/).value).toBe('100.4');
  });

  it('lets the nurse correct a value, and reports it', () => {
    const onValuesChange = vi.fn();
    render(
      <Capture
        status="parsed"
        parsed={PARSED}
        onValuesChange={onValuesChange}
      />,
    );
    fireEvent.change(field(/^Temp/), { target: { value: '100.2' } });
    expect(field(/^Temp/).value).toBe('100.2');
    expect(onValuesChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ temp: '100.2', pulse: '96' }),
    );
  });
});

describe('VoiceEntryCapture: approve and say it again', () => {
  it('approves the filled values only, and shows who approved and when', () => {
    const onApprove = vi.fn();
    render(
      <Capture
        defaultStatus="parsed"
        parsed={PARSED}
        onApprove={onApprove}
        formatTime={() => '10:47'}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Approve & chart 7/ }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    const approval = onApprove.mock.calls[0]?.[0];
    expect(approval.approver).toBe('Mary Grace');
    expect(approval.at).toBeInstanceOf(Date);
    expect(approval.values).toEqual({
      temp: '100.4',
      pulse: '96',
      sys: '122',
      dia: '78',
      rr: '19',
      spo2: '98',
      grbs: '104',
    });
    expect(statusText()).toBe('Charted · Mary Grace · 10:47');
    expect(block().dataset['status']).toBe('approved');
    expect(field(/^Temp/).readOnly).toBe(true);
  });

  it('"Say it again" clears the values and listens again', () => {
    const onSayAgain = vi.fn();
    const onStatusChange = vi.fn();
    render(
      <Capture
        defaultStatus="parsed"
        parsed={PARSED}
        onSayAgain={onSayAgain}
        onStatusChange={onStatusChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Say it again' }));
    expect(onSayAgain).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith('listening');
    expect(statusText()).toBe('Listening…');
  });

  it('shows a stored approval with its time', () => {
    render(
      <Capture
        status="approved"
        parsed={PARSED}
        approvedBy="Mary Grace"
        approvedAt="10:47 AM"
      />,
    );
    expect(statusText()).toBe('Charted · Mary Grace · 10:47 AM');
  });

  it('never logs or stores what was said', () => {
    const logs = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method),
    );
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(
      <Capture
        defaultStatus="parsed"
        transcript="Ramesh, pulse ninety-six"
        parsed={{ pulse: { value: '96' } }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Approve/ }));
    for (const log of logs) expect(log).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe('VoiceEntryCapture: labels', () => {
  it('takes every fixed word as a prop', () => {
    render(
      <Capture
        status="parsed"
        parsed={{ pulse: { value: '96' } }}
        labels={{
          said: 'మీరు చెప్పినది',
          willChart: 'HOS నమోదు చేసేది',
          sayAgain: 'మళ్ళీ చెప్పండి',
          approve: (count) => `ఆమోదించి ${count} నమోదు చేయి`,
        }}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'మీరు చెప్పినది' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'HOS నమోదు చేసేది' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'మళ్ళీ చెప్పండి' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /^ఆమోదించి 1 నమోదు చేయి/ }),
    ).toBeTruthy();
  });
});
