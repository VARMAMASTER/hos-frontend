/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockReceptionSource } from '../../data/mock';
import { pending, renderTab, stubSource } from '../../testing/render';
import { WhatsappWidget } from './whatsapp-view';

afterEach(() => cleanup());

const IRFAN_DRAFT = 'AI reschedule suggestion';

function thread(name: string) {
  return screen.getByRole('log', {
    name: `WhatsApp conversation with ${name}`,
  });
}

describe('WhatsappWidget', () => {
  it('shows the AI banner, the week’s figures and the first conversation', async () => {
    renderTab(<WhatsappWidget />);
    const banner = await screen.findByText(
      /AI answered 23 chats today · 3 missed calls recovered/,
    );
    expect(banner.textContent).toContain('✦');

    const stats = screen.getByRole('list', { name: 'Bookings via WhatsApp' });
    expect(within(stats).getAllByRole('listitem')).toHaveLength(5);
    expect(within(stats).getByText('Chats handled')).toBeTruthy();
    expect(within(stats).getByText('142')).toBeTruthy();

    const log = thread('Mohd. Irfan');
    expect(within(log).getByText(/Stuck in traffic near Miyapur/)).toBeTruthy();
    expect(within(log).getByText(/Patient said/)).toBeTruthy();
    // The assistant's own message carries its mark and a word.
    expect(within(log).getByText(/Reminder: your appointment/)).toBeTruthy();
    expect(within(log).getAllByText(/AI assistant/).length).toBeGreaterThan(0);
  });

  it('shows a Telugu conversation with its English gloss and the answered quick replies', async () => {
    renderTab(<WhatsappWidget />);
    fireEvent.click(await screen.findByRole('radio', { name: /Padma Sree/ }));
    const log = thread('Padma Sree');
    expect(
      within(log).getByText(/Namaste! How can I help you today\?/),
    ).toBeTruthy();
    const picked = within(log).getByRole('group', { name: 'Pick a slot' });
    const chosen = within(picked).getByRole('button', {
      name: '11:30 AM — available',
    });
    expect(chosen.getAttribute('aria-pressed')).toBe('true');
    expect(chosen.getAttribute('aria-disabled')).toBe('true');
    expect(screen.queryByRole('group', { name: IRFAN_DRAFT })).toBeNull();
  });

  it('keeps the AI reply a draft, marked ✦ and in words, until a person approves it', async () => {
    const source = stubSource();
    const send = vi.spyOn(source, 'sendWhatsAppReply');
    renderTab(<WhatsappWidget />, source);
    const draft = await screen.findByRole('group', { name: IRFAN_DRAFT });
    expect(within(draft).getByText('AI draft')).toBeTruthy();
    expect(within(draft).getAllByText('✦').length).toBeGreaterThan(0);
    expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(
      within(draft).getByText(
        /moved your appointment with Dr\. K\. Ramesh to 12:30 PM/,
      ),
    ).toBeTruthy();
    expect(send).not.toHaveBeenCalled();

    fireEvent.click(
      within(draft).getByRole('button', { name: /^Approve & send/ }),
    );
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith(
        'wa-irfan',
        expect.stringContaining('12:30 PM'),
      ),
    );
    expect(await screen.findByText('Reply approved & sent')).toBeTruthy();
    expect(within(draft).getByText(/^Approved & sent · /)).toBeTruthy();
    // The sent reply is now in the conversation.
    await waitFor(() =>
      expect(
        within(thread('Mohd. Irfan')).getAllByText(/moved your appointment/),
      ).toHaveLength(1),
    );
  });

  it('sends the edited reply, not the draft, when a person edits it first', async () => {
    const source = stubSource();
    const send = vi.spyOn(source, 'sendWhatsAppReply');
    renderTab(<WhatsappWidget />, source);
    const draft = await screen.findByRole('group', { name: IRFAN_DRAFT });
    fireEvent.click(within(draft).getByRole('button', { name: /^Edit/ }));
    const dialog = screen.getByRole('dialog', { name: 'Edit draft reply' });
    fireEvent.change(within(dialog).getByLabelText('Message to send'), {
      target: { value: 'Please come at 12:30 PM.' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Save & send' }),
    );
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith('wa-irfan', 'Please come at 12:30 PM.'),
    );
  });

  it('puts the draft back to pending and says so when the send fails', async () => {
    renderTab(
      <WhatsappWidget />,
      stubSource({
        sendWhatsAppReply: () =>
          Promise.reject(new Error('There is no draft to send.')),
      }),
    );
    const draft = await screen.findByRole('group', { name: IRFAN_DRAFT });
    fireEvent.click(
      within(draft).getByRole('button', { name: /^Approve & send/ }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'There is no draft to send.',
    );
    await waitFor(() =>
      expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy(),
    );
  });

  it('recovers a missed call as a new conversation with a draft, not a sent message', async () => {
    const source = stubSource();
    const send = vi.spyOn(source, 'sendWhatsAppReply');
    renderTab(<WhatsappWidget />, source);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Recover missed calls' }),
    );
    const draft = await screen.findByRole('group', {
      name: 'AI-drafted missed-call reply',
    });
    expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(send).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: /\+91 99887 4431/ })).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Recover missed calls' }),
    );
    expect(
      await screen.findByText('No missed calls left to recover'),
    ).toBeTruthy();
  });

  it('shows the loading, error and empty states', async () => {
    renderTab(<WhatsappWidget />, stubSource({ getWhatsApp: pending }));
    expect(
      screen.getByRole('heading', { name: 'WhatsApp Assistant' }),
    ).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    cleanup();

    renderTab(
      <WhatsappWidget />,
      stubSource({ getWhatsApp: () => Promise.reject(new Error('down')) }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Could not load the WhatsApp assistant.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    cleanup();

    renderTab(
      <WhatsappWidget />,
      stubSource({
        getWhatsApp: async () => ({
          ...(await createMockReceptionSource().getWhatsApp()),
          conversations: [],
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'No conversations yet' }),
    ).toBeTruthy();
  });

  it('names the conversation picker and reaches it from the keyboard', async () => {
    renderTab(<WhatsappWidget />);
    const picker = await screen.findByRole('radiogroup', {
      name: 'Conversations',
    });
    const radios = within(picker).getAllByRole('radio');
    expect(radios).toHaveLength(2);
    radios[0].focus();
    expect(document.activeElement).toBe(radios[0]);
  });
});
