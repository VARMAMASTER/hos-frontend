import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { AiStreamText } from './ai-stream-text';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'matchMedia');
});

// jsdom has no matchMedia, which Nova reads as "no motion". This answers "motion is welcome".
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

// An async stream whose chunks arrive only when the test releases them.
function gatedStream(chunks: string[], failAt?: number) {
  const gates = chunks.map(() => {
    let open = () => undefined as void;
    const promise = new Promise<void>((resolve) => {
      open = resolve;
    });
    return { promise, open };
  });
  const returned = vi.fn();
  let index = 0;
  const iterable: AsyncIterable<string> = {
    [Symbol.asyncIterator]: () => ({
      async next() {
        if (index >= chunks.length) return { done: true, value: undefined };
        await gates[index]?.promise;
        if (index === failAt) throw new Error('network down');
        return { done: false, value: chunks[index++] ?? '' };
      },
      async return() {
        returned();
        return { done: true, value: undefined };
      },
    }),
  };
  return {
    iterable,
    returned,
    release: async (i: number) => {
      await act(async () => {
        gates[i]?.open();
        await Promise.resolve();
      });
    },
  };
}

const ANSWER = 'Lakshmi Devi is on **Metformin 1000mg BD**. Her eGFR is 44.';

describe('AiStreamText under reduced motion', () => {
  it('renders a string stream whole, at once, with no caret, and reports completion', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <AiStreamText stream={ANSWER} onComplete={onComplete} />,
    );
    expect(container.textContent).toContain('Her eGFR is 44.');
    expect(container.querySelector('strong')?.textContent).toBe(
      'Metformin 1000mg BD',
    );
    expect(container.querySelector('[data-caret]')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(ANSWER);
  });

  // Reduced motion removes the animation, not the text: a long answer must not stay invisible until
  // it ends. Chunks show as they arrive, with no caret and no typewriter pacing; assistive technology
  // still hears one "writing" status instead of the partial text, then the whole answer once.
  it('shows an async stream as it arrives, without a caret, and keeps the partial text from assistive technology', async () => {
    const stream = gatedStream(['Ramesh ', 'is stable.']);
    const { container } = render(<AiStreamText stream={stream.iterable} />);
    expect(screen.getByText('HOS AI is writing…')).toBeTruthy();
    await stream.release(0);
    await act(async () => undefined);
    expect(container.textContent).toContain('Ramesh');
    expect(container.querySelector('[data-caret]')).toBeNull();
    expect(
      container.querySelector('[aria-hidden="true"]')?.textContent,
    ).toContain('Ramesh');
    await stream.release(1);
    await act(async () => undefined);
    expect(container.textContent).toBe('Ramesh is stable.');
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.queryByText('HOS AI is writing…')).toBeNull();
  });
});

describe('AiStreamText with motion', () => {
  it('reveals a string a few words at a time behind a caret, hidden from assistive technology until done', () => {
    allowMotion();
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { container } = render(
      <AiStreamText
        stream={ANSWER}
        revealIntervalMs={50}
        onComplete={onComplete}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const live = container.querySelector('[aria-hidden="true"]');
    expect(live).not.toBeNull();
    expect(live?.textContent?.length).toBeGreaterThan(0);
    expect(live?.textContent).not.toContain('44.');
    expect(container.querySelector('[data-caret]')).not.toBeNull();
    // What a screen reader gets meanwhile: one short status, not the text character by character.
    expect(screen.getByText('HOS AI is writing…').className).toContain(
      'sr-only',
    );
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50 * 40);
    });
    expect(container.querySelector('[data-caret]')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(container.textContent).toContain('Her eGFR is 44.');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows an async stream as its chunks arrive', async () => {
    allowMotion();
    const stream = gatedStream(['Ramesh ', 'is stable.']);
    const onComplete = vi.fn();
    const { container } = render(
      <AiStreamText stream={stream.iterable} onComplete={onComplete} />,
    );
    await stream.release(0);
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      'Ramesh ▍',
    );
    await stream.release(1);
    await act(async () => undefined);
    expect(container.textContent).toBe('Ramesh is stable.');
    expect(onComplete).toHaveBeenCalledWith('Ramesh is stable.');
  });

  it('stops where it is when stopped: no caret, the partial text kept, the stream closed', async () => {
    allowMotion();
    const stream = gatedStream(['Ramesh ', 'is stable.']);
    const onComplete = vi.fn();
    const { container, rerender } = render(
      <AiStreamText stream={stream.iterable} onComplete={onComplete} />,
    );
    await stream.release(0);
    rerender(
      <AiStreamText stream={stream.iterable} onComplete={onComplete} stopped />,
    );
    await act(async () => undefined);
    expect(stream.returned).toHaveBeenCalled();
    expect(container.textContent).toBe('Ramesh');
    expect(container.querySelector('[data-caret]')).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('stops a string stream partway', () => {
    allowMotion();
    vi.useFakeTimers();
    const { container, rerender } = render(
      <AiStreamText stream={ANSWER} revealIntervalMs={50} />,
    );
    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender(<AiStreamText stream={ANSWER} revealIntervalMs={50} stopped />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(container.textContent).toContain('Lakshmi');
    expect(container.textContent).not.toContain('44.');
    expect(container.querySelector('[data-caret]')).toBeNull();
  });

  it('reports a failed stream and keeps what arrived', async () => {
    allowMotion();
    const stream = gatedStream(['Ramesh ', 'is stable.'], 1);
    const onError = vi.fn();
    const { container } = render(
      <AiStreamText stream={stream.iterable} onError={onError} />,
    );
    await stream.release(0);
    await stream.release(1);
    await act(async () => undefined);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('Ramesh');
  });

  it('follows text the caller sets progressively, final once streaming is false', () => {
    allowMotion();
    const { container, rerender } = render(
      <AiStreamText text="Ramesh" streaming />,
    );
    expect(container.querySelector('[data-caret]')).not.toBeNull();
    rerender(<AiStreamText text="Ramesh is stable." streaming />);
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      'Ramesh is stable.▍',
    );
    rerender(<AiStreamText text="Ramesh is stable." streaming={false} />);
    expect(container.querySelector('[data-caret]')).toBeNull();
    expect(container.textContent).toBe('Ramesh is stable.');
  });
});

describe('AiStreamText labels and language', () => {
  it('takes a translated writing label and a lang for the content', () => {
    allowMotion();
    const { container } = render(
      <AiStreamText
        text="రక్తపోటు సాధారణంగా ఉంది"
        lang="te"
        writingLabel="HOS AI రాస్తోంది…"
      />,
    );
    expect(container.querySelector('[lang="te"]')?.textContent).toBe(
      'రక్తపోటు సాధారణంగా ఉంది',
    );
    cleanup();
    render(
      <AiStreamText text="x" streaming writingLabel="HOS AI రాస్తోంది…" />,
    );
    expect(screen.getByText('HOS AI రాస్తోంది…')).toBeTruthy();
  });
});
