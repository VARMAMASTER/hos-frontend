import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AiThinking } from './ai-thinking';
import { ChatAnswer } from './chat-answer';
import { ChatQuestion } from './chat-question';
import { FollowupChips } from './followup-chips';

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'matchMedia');
  Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});

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

function mockAnimate() {
  const animate = vi.fn(() => ({ cancel: vi.fn() }));
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    value: animate,
    configurable: true,
    writable: true,
  });
  return animate;
}

describe('AiThinking', () => {
  it('says "Thinking…" in words, with the AI mark, and its dots hidden from assistive technology', () => {
    const { container } = render(<AiThinking />);
    const row = container.firstElementChild as HTMLElement;
    expect(row.textContent).toContain('Thinking…');
    expect(row.textContent).toContain('✦');
    expect(row.className).toContain('text-ai-deep');
    const dots = row.querySelectorAll('[data-dot]');
    expect(dots).toHaveLength(3);
    for (const dot of dots) {
      expect(dot.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(dot.className).toContain('bg-ai');
    }
  });

  it('takes a translated label', () => {
    render(<AiThinking label="Checking live data" />);
    expect(screen.getByText('Checking live data')).toBeTruthy();
  });

  it('keeps its dots still under reduced motion', () => {
    const animate = mockAnimate();
    render(<AiThinking />);
    expect(animate).not.toHaveBeenCalled();
  });

  it('bobs its three dots in turn when motion is welcome', () => {
    allowMotion();
    const animate = mockAnimate();
    render(<AiThinking />);
    expect(animate).toHaveBeenCalledTimes(3);
    const delays = animate.mock.calls.map(
      (call) => (call as unknown[])[1] as KeyframeAnimationOptions,
    );
    expect(delays.map((options) => options.delay)).toEqual([0, 180, 360]);
    expect(delays.every((options) => options.iterations === Infinity)).toBe(
      true,
    );
    // The hop is the --nova-typing-hop token, not a pixel literal.
    const keyframes = (animate.mock.calls[0] as unknown[])[0] as Keyframe[];
    expect(keyframes[1]?.transform).toBe(
      'translateY(calc(var(--nova-typing-hop) * -1))',
    );
  });
});

describe('ChatQuestion', () => {
  it('is the person’s bubble, right-aligned in the brand tint, with a hidden speaker label', () => {
    const { container } = render(
      <ChatQuestion>When was her last HbA1c?</ChatQuestion>,
    );
    const bubble = container.firstElementChild as HTMLElement;
    expect(bubble.textContent).toBe('You said: When was her last HbA1c?');
    expect(screen.getByText('You said:').className).toContain('sr-only');
    expect(bubble.className).toContain('ml-auto');
    expect(bubble.className).toContain('bg-primary-soft');
    expect(bubble.className).toContain('text-primary-strong');
    // Tokens: the card corner, and 88% of the thread at most (as the answer).
    for (const cls of [
      'rounded-card',
      'max-w-(--nova-ai-bubble-max-w)',
      'px-s5',
      'py-s3',
      'text-control',
    ]) {
      expect(bubble.className.split(' ')).toContain(cls);
    }
  });

  it('takes a translated speaker label and the language of the question', () => {
    const { container } = render(
      <ChatQuestion speakerLabel="మీరు అడిగారు" lang="te">
        ఆమె షుగర్ ఎలా ఉంది?
      </ChatQuestion>,
    );
    expect(screen.getByText('మీరు అడిగారు:')).toBeTruthy();
    expect(container.querySelector('[lang="te"]')?.textContent).toBe(
      'ఆమె షుగర్ ఎలా ఉంది?',
    );
  });
});

describe('ChatAnswer', () => {
  it('is marked as AI by the spark and the words "HOS AI", with a hidden speaker label', () => {
    const { container } = render(<ChatAnswer text="HbA1c was **8.4%**." />);
    expect(container.textContent).toContain('✦');
    expect(screen.getByText('HOS AI')).toBeTruthy();
    expect(screen.getByText('HOS AI answered:').className).toContain('sr-only');
    expect(container.querySelector('strong')?.textContent).toBe('8.4%');
    expect(container.querySelector('.bg-ai-ghost')).not.toBeNull();
    // The answer's bubble shares the question's tokens.
    const answer = container.querySelector('.bg-ai-ghost') as HTMLElement;
    for (const cls of ['rounded-card', 'px-s5', 'py-s3', 'text-control']) {
      expect(answer.className.split(' ')).toContain(cls);
    }
    expect(
      container.querySelector('[class~="max-w-(--nova-ai-bubble-max-w)"]'),
    ).not.toBeNull();
  });

  it('renders rich children in place of text', () => {
    render(
      <ChatAnswer>
        <table aria-label="Vitals" />
      </ChatAnswer>,
    );
    expect(screen.getByRole('table', { name: 'Vitals' })).toBeTruthy();
  });

  it('puts the answer’s language on its content and an English gloss under it', () => {
    const { container } = render(
      <ChatAnswer
        text="రక్తపోటు సాధారణంగా ఉంది."
        lang="te"
        gloss="Blood pressure is normal."
      />,
    );
    expect(container.querySelector('[lang="te"]')?.textContent).toBe(
      'రక్తపోటు సాధారణంగా ఉంది.',
    );
    expect(container.querySelector('[lang="en"]')?.textContent).toBe(
      'Blood pressure is normal.',
    );
  });

  it('shows its source line and actions', () => {
    render(
      <ChatAnswer
        text="eGFR 44."
        source="From the lab report of 12 Sep"
        actions={<button type="button">Add to note</button>}
      />,
    );
    expect(screen.getByText('From the lab report of 12 Sep')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add to note' })).toBeTruthy();
  });

  it('offers follow-ups once the answer is done, and passes the chosen one on', () => {
    const onFollowup = vi.fn();
    render(
      <ChatAnswer
        text="eGFR 44."
        followups={['Show her timeline', 'Any drug interactions?']}
        onFollowup={onFollowup}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show her timeline' }));
    expect(onFollowup).toHaveBeenCalledWith('Show her timeline');
  });

  it('holds its follow-ups back while the answer is still streaming', () => {
    allowMotion();
    render(
      <ChatAnswer
        text="eGFR"
        status="streaming"
        followups={['Show her timeline']}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Show her timeline' })).toBe(
      null,
    );
  });

  it('streams a string and offers follow-ups when it completes (at once under reduced motion)', () => {
    const onComplete = vi.fn();
    render(
      <ChatAnswer
        stream="Her eGFR is **44**."
        followups={['Show her timeline']}
        onFollowup={() => undefined}
        onComplete={onComplete}
      />,
    );
    expect(onComplete).toHaveBeenCalledWith('Her eGFR is **44**.');
    expect(
      screen.getByRole('button', { name: 'Show her timeline' }),
    ).toBeTruthy();
  });

  it('says it failed, in words, and offers a real Retry button', () => {
    const onRetry = vi.fn();
    render(
      <ChatAnswer
        status="error"
        onRetry={onRetry}
        followups={['Show her timeline']}
      />,
    );
    expect(screen.getByText('HOS AI could not answer that.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Show her timeline' })).toBe(
      null,
    );
  });

  it('takes translated error and retry labels', () => {
    render(
      <ChatAnswer
        status="error"
        errorMessage="HOS AI జవాబు ఇవ్వలేకపోయింది."
        retryLabel="మళ్ళీ ప్రయత్నించండి"
        onRetry={() => undefined}
      />,
    );
    expect(screen.getByText('HOS AI జవాబు ఇవ్వలేకపోయింది.')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'మళ్ళీ ప్రయత్నించండి' }),
    ).toBeTruthy();
  });

  it('keeps a stopped answer’s partial text and says it was stopped', () => {
    render(<ChatAnswer text="Her eGFR is" status="stopped" />);
    expect(screen.getByText('Her eGFR is')).toBeTruthy();
    expect(screen.getByText('Stopped')).toBeTruthy();
  });
});

describe('FollowupChips', () => {
  it('is a named group of real buttons in the AI chip treatment', () => {
    const onSelect = vi.fn();
    render(
      <FollowupChips
        questions={['Today’s revenue?', 'Bed occupancy right now?']}
        onSelect={onSelect}
      />,
    );
    const group = screen.getByRole('group', { name: 'Suggested questions' });
    const buttons = group.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.className).toContain('bg-ai-soft');
      expect(button.className).toContain('text-ai-deep');
      // A 24px target at least (WCAG 2.5.8).
      expect(button.className).toContain('min-h-(--nova-touch-sm)');
      // The chip tokens, as Chip has them.
      for (const cls of [
        'rounded-chip',
        'px-chip',
        'py-chip',
        'text-caption',
      ]) {
        expect(button.className.split(' ')).toContain(cls);
      }
    }
    fireEvent.click(screen.getByRole('button', { name: 'Today’s revenue?' }));
    expect(onSelect).toHaveBeenCalledWith('Today’s revenue?');
  });

  it('takes a translated group label and can be disabled while HOS AI answers', () => {
    const onSelect = vi.fn();
    render(
      <FollowupChips
        questions={['Today’s revenue?']}
        onSelect={onSelect}
        label="సూచించిన ప్రశ్నలు"
        disabled
      />,
    );
    const button = screen.getByRole('button', { name: 'Today’s revenue?' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(
      screen.getByRole('group', { name: 'సూచించిన ప్రశ్నలు' }),
    ).toBeTruthy();
  });

  it('renders nothing when there is nothing to suggest', () => {
    const { container } = render(
      <FollowupChips questions={[]} onSelect={() => undefined} />,
    );
    expect(container.firstElementChild).toBeNull();
  });
});
