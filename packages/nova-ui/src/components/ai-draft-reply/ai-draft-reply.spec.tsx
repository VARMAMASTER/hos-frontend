import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AiDraftReply, type AiDraftReplyProps } from './ai-draft-reply';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  return Array.from(node.childNodes).map(assistiveText).join('');
}

const MESSAGE =
  'Namaste Mohd. Irfan — we have moved your appointment with Dr. K. Ramesh to 12:30 PM today.';

function Reply(props: Partial<AiDraftReplyProps>) {
  return (
    <AiDraftReply
      channel="whatsapp"
      recipient="Mohd. Irfan · +91 98480 2231•"
      defaultMessage={MESSAGE}
      approverName="Swapna"
      onSend={() => undefined}
      {...props}
    />
  );
}

const block = () => screen.getByRole('group', { name: 'AI-drafted reply' });
const button = (name: string | RegExp) => screen.getByRole('button', { name });

describe('AiDraftReply: the draft', () => {
  it('is an AI draft block, awaiting approval, that says what it is', () => {
    render(<Reply />);
    const group = block();
    expect(group.classList.contains('nova-ai-block')).toBe(true);
    expect(screen.getByText('AI draft')).toBeTruthy();
    expect(screen.getByText('Draft — awaiting approval')).toBeTruthy();
  });

  it('shows the channel as a chip with a word, the recipient and the message', () => {
    const { container } = render(<Reply contentLang="en" />);
    const chip = container.querySelector(
      '[data-slot="channel"]',
    ) as HTMLElement;
    expect(assistiveText(chip).trim()).toBe('WhatsApp');
    expect(chip.querySelector('svg')).not.toBeNull();
    expect(
      assistiveText(container.querySelector('[data-slot="recipient"]') as Node),
    ).toBe('To Mohd. Irfan · +91 98480 2231•');
    const message = container.querySelector('[data-slot="message"]');
    expect(message?.textContent).toBe(MESSAGE);
    expect(message?.getAttribute('lang')).toBe('en');
  });

  it.each([
    ['sms', 'SMS'],
    ['email', 'Email'],
  ] as const)('names the %s channel', (channel, word) => {
    const { container } = render(<Reply channel={channel} />);
    expect(
      assistiveText(
        container.querySelector('[data-slot="channel"]') as Node,
      ).trim(),
    ).toBe(word);
  });

  it('shows the consent or cost line', () => {
    render(<Reply consent="Patient consented to WhatsApp reminders" />);
    expect(
      screen.getByText('Patient consented to WhatsApp reminders'),
    ).toBeTruthy();
  });
});

describe('AiDraftReply: nothing is sent until a person approves', () => {
  it('sends nothing on its own, and only calls onSend with the text on Approve & send', () => {
    const onSend = vi.fn();
    const onApprove = vi.fn();
    render(<Reply onSend={onSend} onApprove={onApprove} />);
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.click(button('Approve & send AI-drafted reply'));
    expect(onSend).toHaveBeenCalledWith(MESSAGE);
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('Approved & sent · Swapna · just now'),
    ).toBeTruthy();
  });

  it('offers no Undo once sent, since a message cannot be unsent, unless the caller can', () => {
    const { unmount } = render(<Reply />);
    fireEvent.click(button(/Approve & send/));
    expect(screen.queryByRole('button', { name: /Undo/ })).toBeNull();
    unmount();
    render(<Reply undoable />);
    fireEvent.click(button(/Approve & send/));
    expect(button(/Undo/)).toBeTruthy();
  });

  it('rejects with a reason and never sends', () => {
    const onSend = vi.fn();
    const onReject = vi.fn();
    render(<Reply onSend={onSend} onReject={onReject} />);
    fireEvent.click(button(/^Reject/));
    fireEvent.change(
      screen.getByRole('textbox', { name: /Why are you rejecting/ }),
      { target: { value: 'Slot is no longer open' } },
    );
    fireEvent.click(button(/Reject draft/));
    expect(onReject).toHaveBeenCalledWith('Slot is no longer open');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('can be controlled', () => {
    const onStatusChange = vi.fn();
    render(<Reply status="pending" onStatusChange={onStatusChange} />);
    fireEvent.click(button(/Approve & send/));
    expect(onStatusChange).toHaveBeenCalledWith('approved');
    expect(screen.getByText('Draft — awaiting approval')).toBeTruthy();
  });
});

describe('AiDraftReply: editing', () => {
  it('opens the edit dialog on the message, focused in the text and not on a button', () => {
    const onSend = vi.fn();
    render(<Reply onSend={onSend} />);
    fireEvent.click(button('Edit AI-drafted reply'));
    const dialog = screen.getByRole('dialog', { name: 'Edit draft reply' });
    const field = screen.getByRole('textbox', {
      name: 'Message to send',
    }) as HTMLTextAreaElement;
    expect(field.value).toBe(MESSAGE);
    expect(document.activeElement).toBe(field);
    expect(dialog.textContent).toContain(
      'Delivered via WhatsApp once you approve.',
    );
    expect(onSend).not.toHaveBeenCalled();
  });

  it('Save & send sends the edited text, closes and records the approval', () => {
    const onSend = vi.fn();
    const onMessageChange = vi.fn();
    render(<Reply onSend={onSend} onMessageChange={onMessageChange} />);
    fireEvent.click(button(/^Edit/));
    fireEvent.change(screen.getByRole('textbox', { name: 'Message to send' }), {
      target: { value: 'Namaste — your slot is now 12:30 PM, Room 3.' },
    });
    fireEvent.click(button('Save & send'));
    expect(onSend).toHaveBeenCalledWith(
      'Namaste — your slot is now 12:30 PM, Room 3.',
    );
    expect(onMessageChange).toHaveBeenCalledWith(
      'Namaste — your slot is now 12:30 PM, Room 3.',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.getByText('Approved & sent · Swapna · just now'),
    ).toBeTruthy();
    expect(document.querySelector('[data-slot="message"]')?.textContent).toBe(
      'Namaste — your slot is now 12:30 PM, Room 3.',
    );
    // Focus lands on the record, not on <body>.
    expect(document.activeElement).not.toBe(document.body);
    expect(block().contains(document.activeElement)).toBe(true);
  });

  it('will not send an empty message', () => {
    const onSend = vi.fn();
    render(<Reply onSend={onSend} />);
    fireEvent.click(button(/^Edit/));
    const field = screen.getByRole('textbox', { name: 'Message to send' });
    fireEvent.change(field, { target: { value: '   ' } });
    fireEvent.click(button('Save & send'));
    expect(onSend).not.toHaveBeenCalled();
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(
      screen.getByText('Write the message before sending it.'),
    ).toBeTruthy();
    expect(document.activeElement).toBe(field);
  });

  it('Cancel sends nothing, keeps the draft and returns to Edit', () => {
    const onSend = vi.fn();
    render(<Reply onSend={onSend} />);
    const edit = button(/^Edit/);
    edit.focus();
    fireEvent.click(edit);
    fireEvent.change(screen.getByRole('textbox', { name: 'Message to send' }), {
      target: { value: 'changed' },
    });
    fireEvent.click(button('Cancel'));
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('[data-slot="message"]')?.textContent).toBe(
      MESSAGE,
    );
    expect(document.activeElement).toBe(button(/^Edit/));
  });

  it('takes its words as props', () => {
    render(
      <Reply
        title="సమాధానం"
        labels={{
          approve: 'ఆమోదించి పంపండి',
          channels: { whatsapp: 'వాట్సాప్', sms: 'SMS', email: 'ఇమెయిల్' },
          to: 'కు',
        }}
      />,
    );
    expect(button('ఆమోదించి పంపండి సమాధానం')).toBeTruthy();
    expect(screen.getByText('వాట్సాప్')).toBeTruthy();
  });
});

describe('AiDraftReply: health data', () => {
  it('never logs or stores the message', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<Reply defaultMessage="Ramesh, your biopsy result is ready." />);
    fireEvent.click(button(/^Edit/));
    fireEvent.change(screen.getByRole('textbox', { name: 'Message to send' }), {
      target: { value: 'Ramesh, please call the ward.' },
    });
    fireEvent.click(button('Save & send'));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
