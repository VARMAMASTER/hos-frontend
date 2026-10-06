import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { AiChatThread } from './ai-chat-thread';
import { ChatAnswer } from './chat-answer';
import { ChatQuestion } from './chat-question';

afterEach(() => cleanup());

function log() {
  return screen.getByRole('log');
}

// jsdom lays nothing out: give the log a scroll box (500px of content in a 200px window) and record
// where it is scrolled to.
function scrollBox(element: HTMLElement, at = 300) {
  let top = at;
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: () => 500,
  });
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    get: () => 200,
  });
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = value;
    },
  });
  return {
    get top() {
      return top;
    },
    scrollTo(value: number) {
      top = value;
      fireEvent.scroll(element);
    },
  };
}

describe('AiChatThread', () => {
  it('is a polite log with an accessible name', () => {
    render(
      <AiChatThread>
        <ChatQuestion>Her last HbA1c?</ChatQuestion>
      </AiChatThread>,
    );
    expect(log().getAttribute('aria-live')).toBe('polite');
    expect(log().getAttribute('aria-label')).toBe('Conversation with HOS AI');
    // A scrolling region is reachable from the keyboard.
    expect(log().tabIndex).toBe(0);
  });

  it('takes a translated name', () => {
    render(<AiChatThread label="HOS AI తో సంభాషణ" />);
    expect(screen.getByRole('log', { name: 'HOS AI తో సంభాషణ' })).toBeTruthy();
  });

  it('is busy while HOS AI answers, so the log holds its announcements', () => {
    const { rerender } = render(<AiChatThread busy />);
    expect(log().getAttribute('aria-busy')).toBe('true');
    rerender(<AiChatThread />);
    expect(log().getAttribute('aria-busy')).toBeNull();
  });

  it('shows a hint and suggestion chips while it is empty', () => {
    const onSuggestion = vi.fn();
    render(
      <AiChatThread
        suggestions={['Today’s revenue?', 'Pending follow-ups?']}
        onSuggestion={onSuggestion}
      />,
    );
    expect(
      screen.getByText('Try one of these, or type your own question:'),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Pending follow-ups?' }),
    );
    expect(onSuggestion).toHaveBeenCalledWith('Pending follow-ups?');
  });

  it('drops the hint and the suggestions once the conversation starts', () => {
    render(
      <AiChatThread suggestions={['Today’s revenue?']} emptyHint="Ask away">
        <ChatQuestion>Today’s revenue?</ChatQuestion>
      </AiChatThread>,
    );
    expect(screen.queryByText('Ask away')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Today’s revenue?' })).toBe(
      null,
    );
  });

  it('follows new messages while the reader is at the bottom', async () => {
    const { rerender } = render(
      <AiChatThread>
        <ChatQuestion>One</ChatQuestion>
      </AiChatThread>,
    );
    const box = scrollBox(log(), 300);
    box.scrollTo(300);
    rerender(
      <AiChatThread>
        <ChatQuestion>One</ChatQuestion>
        <ChatAnswer text="Two" />
      </AiChatThread>,
    );
    await act(async () => undefined);
    expect(box.top).toBe(500);
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).toBe(null);
  });

  it('stays put when the reader has scrolled up, and offers a jump to the latest', async () => {
    const { rerender } = render(
      <AiChatThread>
        <ChatQuestion>One</ChatQuestion>
      </AiChatThread>,
    );
    const box = scrollBox(log(), 300);
    box.scrollTo(40);
    rerender(
      <AiChatThread>
        <ChatQuestion>One</ChatQuestion>
        <ChatAnswer text="Two" />
      </AiChatThread>,
    );
    await act(async () => undefined);
    expect(box.top).toBe(40);
    const jump = screen.getByRole('button', { name: 'Jump to latest' });
    // The jump button is not part of the conversation the log announces.
    expect(log().contains(jump)).toBe(false);
    fireEvent.click(jump);
    expect(box.top).toBe(500);
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).toBe(null);
    expect(document.activeElement).toBe(log());
  });

  it('stops the answer on Escape while HOS AI is answering', () => {
    const onStop = vi.fn();
    const { rerender } = render(
      <AiChatThread busy onStop={onStop}>
        <ChatQuestion>One</ChatQuestion>
      </AiChatThread>,
    );
    fireEvent.keyDown(log(), { key: 'Escape' });
    expect(onStop).toHaveBeenCalledTimes(1);
    rerender(
      <AiChatThread onStop={onStop}>
        <ChatQuestion>One</ChatQuestion>
      </AiChatThread>,
    );
    fireEvent.keyDown(log(), { key: 'Escape' });
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
