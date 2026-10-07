import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { useState } from 'react';
import { ChatAnswer } from '../ai-chat-thread/chat-answer';
import { ChatQuestion } from '../ai-chat-thread/chat-question';
import { AiCopilotDock } from './ai-copilot-dock';
import { useCopilotShortcut } from './use-copilot-shortcut';

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'matchMedia');
  Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  vi.restoreAllMocks();
});

const SUGGESTIONS = [
  'Any STAT orders?',
  'Bed occupancy right now?',
  'Pending follow-ups?',
];

function trigger() {
  return screen.getByRole('button', { name: 'Ask HOS AI' });
}

function panel() {
  return screen.getByRole('dialog', { name: 'Ask HOS' });
}

function composer() {
  return screen.getByRole('textbox', { name: 'Ask HOS AI a question' });
}

function allowMotion() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe('AiCopilotDock trigger', () => {
  it('is one button, named in words, that says what it controls and its shortcut', () => {
    render(<AiCopilotDock onAsk={() => undefined} />);
    const button = trigger();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    const controls = button.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls ?? '')).not.toBeNull();
    expect(button.getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K');
    // The orb carries the AI mark; the pill says it in words.
    expect(button.textContent).toContain('✦');
    expect(button.textContent).toContain('Ctrl K');
  });

  it('retracts its pill label after the first use, keeping the name', () => {
    render(<AiCopilotDock onAsk={() => undefined} />);
    const pill = screen.getByText('Ask HOS AI');
    expect(pill.closest('.sr-only')).toBeNull();
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByText('Ask HOS AI').closest('.sr-only')).not.toBeNull();
    expect(trigger()).toBeTruthy();
  });

  it('starts retracted when compact', () => {
    render(<AiCopilotDock onAsk={() => undefined} compact />);
    expect(screen.getByText('Ask HOS AI').closest('.sr-only')).not.toBeNull();
  });

  it('breathes and orbits only when motion is welcome', () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }));
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      value: animate,
      configurable: true,
      writable: true,
    });
    render(<AiCopilotDock onAsk={() => undefined} />);
    expect(animate).not.toHaveBeenCalled();
    cleanup();
    allowMotion();
    render(<AiCopilotDock onAsk={() => undefined} />);
    expect(animate).toHaveBeenCalledTimes(2);
    // The breathing takes the standard motion curve, never a stock easing.
    const timings = animate.mock.calls.map(
      (call) => (call as unknown[])[1] as KeyframeAnimationOptions,
    );
    expect(timings.map((timing) => timing.easing)).toContain(
      'cubic-bezier(0.2, 0, 0, 1)',
    );
    expect(timings.map((timing) => timing.easing)).not.toContain('ease-in-out');
  });

  it('sizes the orb, its halo and ring and its press from the copilot tokens', () => {
    const { container } = render(<AiCopilotDock onAsk={() => undefined} />);
    const orb = container.querySelector('[data-orb]') as HTMLElement;
    const classes = orb.className.split(' ');
    expect(classes).toContain('size-(--nova-copilot-orb)');
    expect(classes).toContain('max-md:size-s10');
    expect(classes).toContain(
      'motion-safe:group-active:scale-(--nova-copilot-press-scale)',
    );
    const parts = Array.from(orb.children).map((child) => child.className);
    expect(
      parts.some((cls) => cls.includes('-inset-(--nova-copilot-orb-halo)')),
    ).toBe(true);
    expect(
      parts.some((cls) => cls.includes('-inset-(--nova-copilot-orb-ring)')),
    ).toBe(true);
  });
});

describe('AiCopilotDock panel', () => {
  it('opens a labelled, non-modal dialog and moves focus to the composer', () => {
    render(<AiCopilotDock onAsk={() => undefined} />);
    fireEvent.click(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(panel().id).toBe(trigger().getAttribute('aria-controls'));
    expect(panel().getAttribute('aria-modal')).toBeNull();
    expect(document.activeElement).toBe(composer());
    // Marked as AI in words and by the spark.
    expect(panel().textContent).toContain('✦');
  });

  it('takes its size, place and corner from tokens', () => {
    render(<AiCopilotDock onAsk={() => undefined} defaultOpen />);
    const classes = panel().className.split(' ');
    for (const cls of [
      'rounded-overlay',
      'w-(--nova-copilot-panel-w)',
      'bottom-(--nova-copilot-panel-bottom)',
      'max-h-(--nova-copilot-panel-max-h)',
      'max-md:max-h-(--nova-copilot-sheet-max-h)',
    ]) {
      expect(classes).toContain(cls);
    }
    expect(
      screen.getByRole('button', { name: 'Close' }).className.split(' '),
    ).toContain('size-touch-sm');
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(<AiCopilotDock onAsk={() => undefined} />);
    fireEvent.click(trigger());
    fireEvent.keyDown(composer(), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger());
  });

  it('closes from its close button and returns focus to the trigger', () => {
    render(<AiCopilotDock onAsk={() => undefined} />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('never traps focus: Tab is left to the browser', () => {
    render(<AiCopilotDock onAsk={() => undefined} />);
    fireEvent.click(trigger());
    const ask = screen.getByRole('button', { name: 'Ask' });
    const tab = createEvent.keyDown(ask, { key: 'Tab' });
    fireEvent(ask, tab);
    expect(tab.defaultPrevented).toBe(false);
  });

  it('stops the answer on Escape while HOS AI is answering, instead of closing', () => {
    const onStop = vi.fn();
    render(
      <AiCopilotDock onAsk={() => undefined} busy onStop={onStop} defaultOpen>
        <ChatQuestion>Bed occupancy right now?</ChatQuestion>
      </AiCopilotDock>,
    );
    fireEvent.keyDown(composer(), { key: 'Escape' });
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(panel()).toBeTruthy();
  });

  it('is controlled when given open', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <AiCopilotDock
        onAsk={() => undefined}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(
      <AiCopilotDock
        onAsk={() => undefined}
        open
        onOpenChange={onOpenChange}
      />,
    );
    expect(panel()).toBeTruthy();
    composer().focus();
    rerender(
      <AiCopilotDock
        onAsk={() => undefined}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    // Closed from outside while focus was inside: focus still goes back to the trigger.
    expect(document.activeElement).toBe(trigger());
  });

  it('offers the page’s suggestions until a conversation starts, and asks through onAsk', () => {
    const onAsk = vi.fn();
    function Page() {
      const [asked, setAsked] = useState<string[]>([]);
      return (
        <AiCopilotDock
          defaultOpen
          suggestions={SUGGESTIONS}
          onAsk={(question) => {
            onAsk(question);
            setAsked((list) => [...list, question]);
          }}
        >
          {asked.map((question) => (
            <ChatQuestion key={question}>{question}</ChatQuestion>
          ))}
        </AiCopilotDock>
      );
    }
    render(<Page />);
    expect(
      screen.getByText('Try one of these, or type your own question:'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Any STAT orders?' }));
    expect(onAsk).toHaveBeenCalledWith('Any STAT orders?');
    expect(document.activeElement).toBe(composer());
    expect(
      screen.queryByRole('button', { name: 'Bed occupancy right now?' }),
    ).toBeNull();
    fireEvent.change(composer(), { target: { value: 'Pending follow-ups?' } });
    fireEvent.keyDown(composer(), { key: 'Enter' });
    expect(onAsk).toHaveBeenLastCalledWith('Pending follow-ups?');
  });

  it('shows the conversation the caller renders, and fetches nothing itself', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    render(
      <AiCopilotDock defaultOpen onAsk={() => undefined}>
        <ChatQuestion>Today’s revenue?</ChatQuestion>
        <ChatAnswer text="Today's revenue is **₹3,84,600**." />
      </AiCopilotDock>,
    );
    expect(screen.getByRole('log').textContent).toContain('₹3,84,600');
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('takes translated words', () => {
    render(
      <AiCopilotDock
        onAsk={() => undefined}
        triggerLabel="HOS AI ని అడగండి"
        title="HOS ని అడగండి"
        closeLabel="మూసివేయి"
        defaultOpen
      />,
    );
    expect(
      screen.getByRole('button', { name: 'HOS AI ని అడగండి' }),
    ).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'HOS ని అడగండి' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'మూసివేయి' })).toBeTruthy();
  });
});

describe('AiCopilotDock placement', () => {
  it('sits in the bottom-right corner by default, the panel above the orb', () => {
    render(<AiCopilotDock onAsk={() => undefined} defaultOpen />);
    expect(panel().dataset['placement']).toBe('bottom-right');
  });

  it('docks under the trigger in the app bar with placement="top", inside the viewport', () => {
    render(<AiCopilotDock onAsk={() => undefined} placement="top" />);
    // In the app bar the trigger is the pill alone: no corner orb.
    expect(trigger().dataset['placement']).toBe('top');
    vi.spyOn(trigger(), 'getBoundingClientRect').mockReturnValue({
      top: 12,
      bottom: 48,
      left: 900,
      right: window.innerWidth - 4,
      width: 120,
      height: 36,
      x: 900,
      y: 12,
      toJSON: () => ({}),
    });
    fireEvent.click(trigger());
    expect(panel().dataset['placement']).toBe('top');
    expect(panel().style.getPropertyValue('--copilot-top')).toBe('56px');
    // Never closer than 8px to the window's edge.
    expect(panel().style.getPropertyValue('--copilot-right')).toBe('8px');
  });
});

describe('useCopilotShortcut', () => {
  function Harness({ onTrigger }: { onTrigger: () => void }) {
    useCopilotShortcut(onTrigger);
    return (
      <>
        <input aria-label="Search patients" />
        <textarea aria-label="Notes" />
        <div contentEditable aria-label="Editor" role="textbox" />
        <button type="button">Elsewhere</button>
      </>
    );
  }

  it('fires on Ctrl+K and Cmd+K, and keeps the browser from taking the key', () => {
    const onTrigger = vi.fn();
    render(<Harness onTrigger={onTrigger} />);
    const button = screen.getByRole('button', { name: 'Elsewhere' });
    const ctrl = createEvent.keyDown(button, { key: 'k', ctrlKey: true });
    fireEvent(button, ctrl);
    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(ctrl.defaultPrevented).toBe(true);
    fireEvent.keyDown(document.body, { key: 'K', metaKey: true });
    expect(onTrigger).toHaveBeenCalledTimes(2);
  });

  it('does not fire while typing in an input, a text area or an editor, or on a plain K', () => {
    const onTrigger = vi.fn();
    render(<Harness onTrigger={onTrigger} />);
    fireEvent.keyDown(
      screen.getByRole('textbox', { name: 'Search patients' }),
      {
        key: 'k',
        ctrlKey: true,
      },
    );
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Notes' }), {
      key: 'k',
      ctrlKey: true,
    });
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Editor' }), {
      key: 'k',
      ctrlKey: true,
    });
    fireEvent.keyDown(document.body, { key: 'k' });
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true, altKey: true });
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('opens the dock, or brings focus back to it when it is already open', () => {
    render(<AiCopilotDock onAsk={() => undefined} />);
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(panel()).toBeTruthy();
    expect(document.activeElement).toBe(composer());
    trigger().focus();
    fireEvent.keyDown(trigger(), { key: 'k', ctrlKey: true });
    expect(panel()).toBeTruthy();
    expect(document.activeElement).toBe(composer());
  });
});
