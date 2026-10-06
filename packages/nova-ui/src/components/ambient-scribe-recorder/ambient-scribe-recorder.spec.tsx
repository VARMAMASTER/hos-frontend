import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  AmbientScribeRecorder,
  type AmbientScribeRecorderProps,
} from './ambient-scribe-recorder';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const NAME = 'AI Scribe';

function recorder() {
  return screen.getByRole('group', { name: NAME });
}

// The one status region of the recorder: its words are the recording state.
function status() {
  const regions = recorder().querySelectorAll('[role="status"]');
  expect(regions).toHaveLength(1);
  return regions[0] as HTMLElement;
}

function button(name: string | RegExp) {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}

function liveInterim() {
  const region = recorder().querySelector('[data-slot="interim-live"]');
  expect(region).not.toBeNull();
  return region as HTMLElement;
}

function Recorder(props: Partial<AmbientScribeRecorderProps>) {
  return <AmbientScribeRecorder language="Telugu + English" {...props} />;
}

describe('AmbientScribeRecorder: idle', () => {
  it('is a group named "AI Scribe", marked with the spark and the words, never colour alone', () => {
    render(<Recorder />);
    const badge = recorder().querySelector('[data-badge]');
    expect(badge?.textContent).toContain('✦');
    expect(badge?.textContent).toContain('AI Scribe');
  });

  it('offers a real "Start recording" button, the consent text and the privacy line', () => {
    render(
      <Recorder
        consent={<p>The patient has agreed to this consult being recorded.</p>}
      />,
    );
    expect(button('Start recording')).toBeTruthy();
    expect(screen.getByText(/has agreed to this consult/)).toBeTruthy();
    expect(
      screen.getByText('Audio is processed for the draft and not stored'),
    ).toBeTruthy();
    expect(status().textContent).toBe('Not recording');
  });

  it('asks the caller to start and moves to "requesting" (uncontrolled)', () => {
    const onStart = vi.fn();
    const onStatusChange = vi.fn();
    render(<Recorder onStart={onStart} onStatusChange={onStatusChange} />);
    fireEvent.click(button('Start recording'));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith('requesting');
    expect(status().textContent).toBe('Waiting for microphone permission…');
    expect(recorder().dataset['status']).toBe('requesting');
  });

  it('only reports in controlled mode: the caller decides the status', () => {
    const onStatusChange = vi.fn();
    render(<Recorder status="idle" onStatusChange={onStatusChange} />);
    fireEvent.click(button('Start recording'));
    expect(onStatusChange).toHaveBeenCalledWith('requesting');
    expect(recorder().dataset['status']).toBe('idle');
  });
});

describe('AmbientScribeRecorder: permission denied', () => {
  it('explains the block, shows the "how to enable" slot and lets the person try again', () => {
    const onStart = vi.fn();
    render(
      <Recorder
        status="denied"
        onStart={onStart}
        deniedHelp={<a href="#mic-help">How to enable the microphone</a>}
      />,
    );
    expect(status().textContent).toBe('Microphone blocked');
    expect(
      screen.getByText(/The microphone is blocked for this page/),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'How to enable the microphone' }),
    ).toBeTruthy();
    fireEvent.click(button('Try again'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe('AmbientScribeRecorder: recording', () => {
  it('says "Recording" in words, with the elapsed time beside it but outside the status region', () => {
    render(<Recorder status="recording" elapsedSeconds={161} />);
    expect(status().textContent).toBe('Recording');
    const timer = screen.getByRole('timer');
    expect(timer.textContent).toContain('02:41');
    expect(status().contains(timer)).toBe(false);
  });

  it('formats an hour-long recording as h:mm:ss', () => {
    render(<Recorder status="recording" elapsedSeconds={3725} />);
    expect(screen.getByRole('timer').textContent).toContain('1:02:05');
  });

  it('offers Pause and "Stop & draft" as named buttons, and no Start', () => {
    render(<Recorder status="recording" />);
    expect(button('Pause')).toBeTruthy();
    expect(button('Stop & draft')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Start recording' }),
    ).toBeNull();
  });

  it('puts Pause before Stop, and never focuses Stop on its own', () => {
    render(<Recorder status="recording" />);
    const names = within(recorder())
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names.indexOf('Pause')).toBeLessThan(names.indexOf('Stop & draft'));
    expect(document.activeElement).toBe(document.body);
  });

  it('moves the focus to Pause, not Stop, when the recording starts after Start was pressed', () => {
    const { rerender } = render(<Recorder status="idle" />);
    button('Start recording').focus();
    fireEvent.click(button('Start recording'));
    rerender(<Recorder status="requesting" />);
    rerender(<Recorder status="recording" />);
    expect(document.activeElement).toBe(button('Pause'));
  });

  it('Pause becomes Resume on the same button, which keeps the focus', () => {
    const onPause = vi.fn();
    const onResume = vi.fn();
    render(
      <Recorder
        defaultStatus="recording"
        onPause={onPause}
        onResume={onResume}
      />,
    );
    const toggle = button('Pause');
    toggle.focus();
    fireEvent.click(toggle);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(status().textContent).toBe('Paused');
    expect(button('Resume')).toBe(toggle);
    expect(document.activeElement).toBe(toggle);
    fireEvent.click(toggle);
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(status().textContent).toBe('Recording');
  });

  it('"Stop & draft" asks the caller to stop and reads "Recorded · 02:41"', () => {
    const onStop = vi.fn();
    render(
      <Recorder
        defaultStatus="recording"
        elapsedSeconds={161}
        onStop={onStop}
      />,
    );
    fireEvent.click(button('Stop & draft'));
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(status().textContent).toBe('Recorded');
    const indicator = recorder().querySelector('[data-slot="indicator"]');
    expect(indicator?.textContent?.replace(/\s+/g, ' ')).toContain(
      'Recorded · 02:41',
    );
    expect(screen.queryByRole('button', { name: 'Stop & draft' })).toBeNull();
  });

  it('keeps the recording indicator and the privacy line visible while recording and paused', () => {
    const { rerender } = render(<Recorder status="recording" />);
    expect(recorder().querySelector('[data-slot="indicator"]')).not.toBeNull();
    expect(screen.getByText(/not stored/)).toBeTruthy();
    rerender(<Recorder status="paused" />);
    expect(recorder().querySelector('[data-slot="indicator"]')).not.toBeNull();
    expect(screen.getByText(/not stored/)).toBeTruthy();
  });
});

describe('AmbientScribeRecorder: waveform', () => {
  function bars() {
    return Array.from(
      recorder().querySelectorAll<HTMLElement>('[data-slot="bar"]'),
    );
  }

  it('draws the latest levels as bars, hidden from assistive technology', () => {
    render(
      <Recorder status="recording" levels={[0.1, 0.2, 0.3, 0.4, 0.5, 0.8]} />,
    );
    expect(bars()).toHaveLength(5);
    expect(bars().map((bar) => bar.dataset['level'])).toEqual([
      '0.2',
      '0.3',
      '0.4',
      '0.5',
      '0.8',
    ]);
    const wave = recorder().querySelector('[data-slot="waveform"]');
    expect(wave?.getAttribute('aria-hidden')).toBe('true');
  });

  it('clamps levels into 0..1 and pads a short history with silence', () => {
    render(
      <Recorder
        status="recording"
        levels={[1.7, -2, Number.NaN]}
        barCount={4}
      />,
    );
    expect(bars().map((bar) => bar.dataset['level'])).toEqual([
      '0',
      '1',
      '0',
      '0',
    ]);
  });

  it('smooths only when motion is allowed: the transition is motion-safe, the data is the same', () => {
    render(<Recorder status="recording" levels={[0.5]} barCount={1} />);
    const [bar] = bars();
    expect(bar?.style.transform).toContain('scaleY');
    for (const cls of bar?.className.split(/\s+/) ?? []) {
      if (/transition|duration|ease/.test(cls)) {
        expect(cls.startsWith('motion-safe:')).toBe(true);
      }
    }
  });

  it('flattens the bars while paused', () => {
    render(<Recorder status="paused" levels={[0.9, 0.9]} barCount={2} />);
    expect(bars().map((bar) => bar.dataset['level'])).toEqual(['0', '0']);
  });
});

describe('AmbientScribeRecorder: interim transcript', () => {
  it('shows the interim words in their own language', () => {
    render(
      <Recorder
        status="recording"
        interim="కాళ్ళలో తిమ్మిరి"
        interimLang="te"
      />,
    );
    const line = recorder().querySelector('[data-slot="interim"]');
    expect(line?.getAttribute('lang')).toBe('te');
    expect(line?.textContent).toContain('కాళ్ళలో తిమ్మిరి');
  });

  it('announces politely, in sentences, never per character', () => {
    const { rerender } = render(<Recorder status="recording" interim="T" />);
    const live = liveInterim();
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('');
    rerender(<Recorder status="recording" interim="Tingling in" />);
    expect(liveInterim().textContent).toBe('');
    rerender(<Recorder status="recording" interim="Tingling in both feet." />);
    expect(liveInterim().textContent).toBe('Tingling in both feet.');
    rerender(
      <Recorder status="recording" interim="Tingling in both feet. Worse" />,
    );
    expect(liveInterim().textContent).toBe('Tingling in both feet.');
    rerender(
      <Recorder
        status="recording"
        interim="Tingling in both feet. Worse at night."
      />,
    );
    expect(liveInterim().textContent).toBe('Worse at night.');
  });

  it('announces a fragment once the next one replaces it', () => {
    const { rerender } = render(
      <Recorder status="recording" interim="BP 148 over 92" />,
    );
    expect(liveInterim().textContent).toBe('');
    rerender(<Recorder status="recording" interim="pulse 82" />);
    expect(liveInterim().textContent).toBe('BP 148 over 92');
  });

  it('announces what is left when the recording stops', () => {
    const { rerender } = render(
      <Recorder status="recording" interim="no chest pain" />,
    );
    rerender(<Recorder status="stopped" interim="no chest pain" />);
    expect(liveInterim().textContent).toBe('no chest pain');
  });

  it('shows the caret only while recording, only when motion is allowed, and hides it from assistive technology', () => {
    const { rerender } = render(
      <Recorder status="recording" interim="worse at night" />,
    );
    const caret = recorder().querySelector<HTMLElement>('[data-slot="caret"]');
    expect(caret?.getAttribute('aria-hidden')).toBe('true');
    expect(caret?.className).toContain('hidden');
    expect(caret?.className).toContain('motion-safe:inline');
    rerender(<Recorder status="paused" interim="worse at night" />);
    expect(recorder().querySelector('[data-slot="caret"]')).toBeNull();
  });
});

describe('AmbientScribeRecorder: language', () => {
  it('shows the languages in use as a chip', () => {
    render(<Recorder />);
    expect(screen.getByText('Telugu + English')).toBeTruthy();
  });

  it('becomes a language menu with onLanguageChange', () => {
    const onLanguageChange = vi.fn();
    render(
      <Recorder
        language="te-en"
        languageOptions={[
          { value: 'te-en', label: 'Telugu + English' },
          { value: 'hi-en', label: 'Hindi + English' },
        ]}
        onLanguageChange={onLanguageChange}
      />,
    );
    const trigger = button(/Language: Telugu \+ English/);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Hindi/ }));
    expect(onLanguageChange).toHaveBeenCalledWith('hi-en');
  });
});

describe('AmbientScribeRecorder: processing and done', () => {
  it('lists the drafting steps with their state in words', () => {
    render(
      <Recorder
        status="processing"
        elapsedSeconds={161}
        steps={[
          { label: 'Transcribing 02:41 of Telugu + English', state: 'done' },
          { label: 'Extracting symptoms and vitals', state: 'active' },
          { label: 'Drafting the SOAP note', state: 'pending' },
        ]}
      />,
    );
    const list = screen.getByRole('list', { name: 'Drafting progress' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Done: Transcribing 02:41 of Telugu + English',
      'In progress: Extracting symptoms and vitals',
      'Waiting: Drafting the SOAP note',
    ]);
    expect(status().textContent).toBe('Drafting the note');
  });

  it('takes a progress component in place of the local steps', () => {
    render(<Recorder status="processing" progress={<p>Custom progress</p>} />);
    expect(screen.getByText('Custom progress')).toBeTruthy();
  });

  it('shows the draft slot when done', () => {
    render(<Recorder status="done" draft={<p>The SOAP draft</p>} />);
    expect(status().textContent).toBe('Draft ready');
    expect(screen.getByText('The SOAP draft')).toBeTruthy();
  });
});

describe('AmbientScribeRecorder: labels', () => {
  it('takes every fixed word as a prop', () => {
    render(
      <Recorder
        status="recording"
        labels={{
          name: 'AI లేఖకుడు',
          pause: 'ఆపు',
          stop: 'ఆపి డ్రాఫ్ట్ చేయి',
          privacy: 'ఆడియో నిల్వ చేయబడదు',
          status: { recording: 'రికార్డ్ అవుతోంది' },
        }}
      />,
    );
    const group = screen.getByRole('group', { name: 'AI లేఖకుడు' });
    expect(within(group).getByRole('button', { name: 'ఆపు' })).toBeTruthy();
    expect(
      within(group).getByRole('button', { name: 'ఆపి డ్రాఫ్ట్ చేయి' }),
    ).toBeTruthy();
    expect(within(group).getByText('ఆడియో నిల్వ చేయబడదు')).toBeTruthy();
    expect(within(group).getByRole('status').textContent).toBe(
      'రికార్డ్ అవుతోంది',
    );
  });
});

describe('AmbientScribeRecorder: safety', () => {
  it('never touches the microphone or the network, and never logs or stores the transcript', () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const logs = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method),
    );
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    const { rerender } = render(<Recorder />);
    fireEvent.click(button('Start recording'));
    act(() => {
      rerender(
        <Recorder
          status="recording"
          interim="Ramesh says the tingling started two weeks ago."
          levels={[0.4, 0.6]}
        />,
      );
    });
    fireEvent.click(button('Pause'));
    fireEvent.click(button('Stop & draft'));

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    for (const log of logs) expect(log).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
