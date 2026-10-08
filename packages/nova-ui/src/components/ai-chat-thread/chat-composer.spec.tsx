import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ChatComposer } from './chat-composer';

afterEach(() => cleanup());

function field() {
  return screen.getByRole('textbox', {
    name: 'Ask HOS AI a question',
  }) as HTMLTextAreaElement;
}

describe('ChatComposer', () => {
  it('is a labelled text area with a placeholder and an Ask button', () => {
    render(<ChatComposer onSend={() => undefined} />);
    expect(field().tagName).toBe('TEXTAREA');
    expect(field().getAttribute('placeholder')).toBe('Ask anything…');
    expect(screen.getByRole('button', { name: 'Ask' })).toBeTruthy();
  });

  it('sends the trimmed question on Enter, clears, and keeps focus in the field', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);
    field().focus();
    fireEvent.change(field(), { target: { value: '  Her last HbA1c?  ' } });
    fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Her last HbA1c?');
    expect(field().value).toBe('');
    expect(document.activeElement).toBe(field());
  });

  it('keeps Shift+Enter for a new line', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);
    fireEvent.change(field(), { target: { value: 'Line one' } });
    fireEvent.keyDown(field(), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  // Telugu and Hindi are typed through an input method: Enter there picks a word, it does not send.
  it('does not send while an input method is composing', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);
    fireEvent.change(field(), { target: { value: 'షుగర్' } });
    fireEvent.keyDown(field(), { key: 'Enter', isComposing: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends nothing when the field is empty or blank', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);
    fireEvent.keyDown(field(), { key: 'Enter' });
    fireEvent.change(field(), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends from the button and returns focus to the field', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);
    fireEvent.change(field(), { target: { value: 'Bed occupancy?' } });
    const ask = screen.getByRole('button', { name: 'Ask' });
    ask.focus();
    fireEvent.click(ask);
    expect(onSend).toHaveBeenCalledWith('Bed occupancy?');
    expect(document.activeElement).toBe(field());
  });

  it('cannot send while HOS AI is answering, and offers Stop instead (Escape stops too)', () => {
    const onSend = vi.fn();
    const onStop = vi.fn();
    render(<ChatComposer onSend={onSend} busy onStop={onStop} />);
    expect(field().readOnly).toBe(true);
    expect(field().getAttribute('aria-disabled')).toBe('true');
    fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Ask' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(field(), { key: 'Escape' });
    expect(onStop).toHaveBeenCalledTimes(2);
  });

  it('shows the send button as unavailable while busy when it cannot stop', () => {
    render(<ChatComposer onSend={() => undefined} busy />);
    const askButton = screen.getByRole('button', { name: 'Ask' });
    expect(askButton.getAttribute('aria-disabled')).toBe('true');
    expect(askButton.getAttribute('aria-busy')).toBe('true');
    expect(askButton.querySelector('[data-spinner]')).not.toBeNull();
  });

  it('is controlled when given a value', () => {
    const onSend = vi.fn();
    function Controlled() {
      const [value, setValue] = useState('Draft');
      return (
        <>
          <ChatComposer
            value={value}
            onValueChange={setValue}
            onSend={onSend}
          />
          <output>{value}</output>
        </>
      );
    }
    const { container } = render(<Controlled />);
    expect(field().value).toBe('Draft');
    fireEvent.change(field(), { target: { value: 'Draft two' } });
    expect(container.querySelector('output')?.textContent).toBe('Draft two');
    fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Draft two');
    expect(field().value).toBe('');
  });

  it('takes translated labels and an attach slot', () => {
    render(
      <ChatComposer
        onSend={() => undefined}
        label="HOS AI ని అడగండి"
        placeholder="ఏదైనా అడగండి…"
        sendLabel="అడుగు"
        attach={<button type="button">Attach report</button>}
      />,
    );
    expect(
      screen.getByRole('textbox', { name: 'HOS AI ని అడగండి' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'అడుగు' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Attach report' })).toBeTruthy();
  });

  it('grows with its text up to a maximum height, then scrolls', () => {
    render(<ChatComposer onSend={() => undefined} maxHeight={120} />);
    const area = field();
    Object.defineProperty(area, 'scrollHeight', {
      configurable: true,
      get: () => (area.value.length > 20 ? 300 : 60),
    });
    fireEvent.change(area, { target: { value: 'short' } });
    expect(area.style.height).toBe('60px');
    expect(area.style.overflowY).toBe('hidden');
    fireEvent.change(area, {
      target: { value: 'a much longer question\n'.repeat(5) },
    });
    expect(area.style.height).toBe('120px');
    expect(area.style.overflowY).toBe('auto');
  });
});
