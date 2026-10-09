/// <reference lib="dom" />
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockReceptionSource } from '../../data/mock';
import { pending, renderTab, stubSource } from '../../testing/render';
import { AicallingWidget } from './aicalling-view';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const YADAMMA = 'Outbound · K. Yadamma, 63F';
const FOLLOW_UP = 'AI-drafted confirmation after the call';

function console_() {
  return screen.getByRole('group', { name: YADAMMA });
}

// Lets the turns arrive one at a time, as the line would speak them (each one is a render of its
// own, so each gets its own act).
async function advanceTurns(turns = 14) {
  for (let turn = 0; turn < turns; turn += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
  }
}

// Plays the call to its end.
async function playToEnd() {
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button', { name: 'Play call' }));
  await advanceTurns();
  vi.useRealTimers();
}

describe('AicallingWidget', () => {
  it('shows the banner, the figures and the call console', async () => {
    renderTab(<AicallingWidget />);
    const banner = await screen.findByText(
      /The voice agent took 41 calls today/,
    );
    expect(banner.querySelector('[data-ai-mark]')).not.toBeNull();
    const figures = screen.getByRole('region', { name: 'AI calling figures' });
    expect(within(figures).getByText('Handled without a human')).toBeTruthy();
    expect(within(figures).getByText('₹185')).toBeTruthy();
    const frame = console_();
    expect(
      within(frame).getByRole('button', { name: 'Play call' }),
    ).toBeTruthy();
    expect(
      within(frame).getByText(
        /identifies itself as an AI in the first sentence/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText('GREEN tier · booking & reminders only'),
    ).toBeTruthy();
  });

  it('writes nothing back and drafts no follow-up before the call is played', async () => {
    renderTab(<AicallingWidget />);
    await screen.findByRole('group', { name: YADAMMA });
    expect(screen.getByText(/Nothing yet\. Play the call/)).toBeTruthy();
    expect(screen.queryByRole('group', { name: FOLLOW_UP })).toBeNull();
  });

  it('plays the call turn by turn, then lists what it wrote back', async () => {
    renderTab(<AicallingWidget />);
    await screen.findByRole('group', { name: YADAMMA });
    await playToEnd();
    const log = within(console_()).getByRole('log');
    expect(
      within(log).getByText(/ఇది శ్రీ వేంకటేశ్వర హాస్పిటల్ నుండి/),
    ).toBeTruthy();
    expect(
      within(log).getByText(/I am the hospital’s AI assistant — not a person/),
    ).toBeTruthy();
    expect(within(log).getByText(/Call ended · 2:12/)).toBeTruthy();
    const wrote = screen.getByRole('heading', {
      name: 'Written back while the line was open',
    });
    expect(wrote).toBeTruthy();
    expect(screen.getByText('Appointment created')).toBeTruthy();
    expect(screen.getByText('Token T-29 issued')).toBeTruthy();
    expect(
      within(console_()).getByRole('button', { name: 'Replay call' }),
    ).toBeTruthy();
  });

  it('shows the transcript in the language chosen', async () => {
    renderTab(<AicallingWidget />);
    await screen.findByRole('group', { name: YADAMMA });
    const picker = screen.getByRole('radiogroup', { name: 'Call language' });
    fireEvent.click(within(picker).getByRole('radio', { name: /Hindi/ }));
    await playToEnd();
    expect(
      within(within(console_()).getByRole('log')).getByText(
        /यह श्री वेंकटेश्वर हॉस्पिटल से एक स्वचालित कॉल है/,
      ),
    ).toBeTruthy();
  });

  it('keeps the AI follow-up a draft until a person approves it', async () => {
    const source = stubSource();
    const send = vi.spyOn(source, 'sendCallFollowUp');
    renderTab(<AicallingWidget />, source);
    await screen.findByRole('group', { name: YADAMMA });
    await playToEnd();
    const draft = screen.getByRole('group', { name: FOLLOW_UP });
    expect(within(draft).getByText('AI draft')).toBeTruthy();
    expect(draft.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(send).not.toHaveBeenCalled();

    fireEvent.click(
      within(draft).getByRole('button', { name: /^Approve & send/ }),
    );
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith(
        'call-yadamma',
        expect.stringContaining('your appointment is booked'),
      ),
    );
    expect(await screen.findByText('Follow-up approved & sent')).toBeTruthy();
    expect(within(draft).getByText(/^Approved & sent · /)).toBeTruthy();
  });

  it('replays the 10:39 escalation, which ends in a hand-over to a person', async () => {
    renderTab(<AicallingWidget />);
    const replay = await screen.findByRole('button', {
      name: 'Replay the 10:39 escalation',
    });
    vi.useFakeTimers();
    fireEvent.click(replay);
    const frame = screen.getByRole('group', {
      name: 'Inbound · +91 90104 8••••',
    });
    await advanceTurns();
    vi.useRealTimers();
    expect(within(frame).getByText(/Transferred to Swapna/)).toBeTruthy();
    expect(
      within(frame).getByText(
        /The agent asked no follow-up question, gave no advice/,
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('group', { name: FOLLOW_UP })).toBeNull();
  });

  it('starts the recall calls only when a person approves the list', async () => {
    const source = stubSource();
    const approve = vi.spyOn(source, 'approveRecallList');
    renderTab(<AicallingWidget />, source);
    const draft = await screen.findByRole('group', {
      name: 'Recall list ready to dial — 12 patients',
    });
    expect(within(draft).getByText('AI draft')).toBeTruthy();
    expect(draft.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(within(draft).getByText('Draft — awaiting approval')).toBeTruthy();
    expect(approve).not.toHaveBeenCalled();
    fireEvent.click(
      within(draft).getByRole('button', { name: /^Approve & start calling/ }),
    );
    await waitFor(() => expect(approve).toHaveBeenCalledWith('recall-12'));
    expect(
      await screen.findByText('Recall approved — the agent starts dialling'),
    ).toBeTruthy();
    expect(within(draft).getByText(/^Started · /)).toBeTruthy();
  });

  it('lists the campaigns and switches one off', async () => {
    const source = stubSource();
    const set = vi.spyOn(source, 'setCampaignRunning');
    renderTab(<AicallingWidget />, source);
    const table = await screen.findByRole('table', {
      name: 'Outbound campaigns',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(7);
    const recall = within(table).getByRole('switch', {
      name: 'Follow-up recall running',
    });
    expect(recall.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(recall);
    await waitFor(() => expect(set).toHaveBeenCalledWith('recall', false));
    await waitFor(() =>
      expect(recall.getAttribute('aria-checked')).toBe('false'),
    );
    expect(
      screen.getByText(
        /The recall campaign is the arithmetic an owner asks about/,
      ),
    ).toBeTruthy();
  });

  it('queues a call from the list, and never offers one to a number on do-not-call', async () => {
    const source = stubSource();
    const queue = vi.spyOn(source, 'queueCall');
    renderTab(<AicallingWidget />, source);
    const list = await screen.findByRole('list', {
      name: 'Next in the call queue',
    });
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    fireEvent.click(
      within(list).getByRole('button', { name: 'Call M. Sailoo now' }),
    );
    await waitFor(() => expect(queue).toHaveBeenCalledWith('q-sailoo'));
    expect(await screen.findByText('Queued — M. Sailoo')).toBeTruthy();
    const blocked = within(list).getByRole('button', {
      name: 'Blocked — P. Kondal Reddy is on do-not-call',
    }) as HTMLButtonElement;
    expect(blocked.disabled).toBe(true);
    expect(within(list).getByText('Do not call')).toBeTruthy();
  });

  it('keeps the limits as words and marks', async () => {
    renderTab(<AicallingWidget />);
    const limits = await screen.findByRole('list', {
      name: 'Where this agent stops',
    });
    expect(within(limits).getAllByRole('listitem')).toHaveLength(6);
    expect(within(limits).getAllByRole('img', { name: 'Never' })).toHaveLength(
      3,
    );
    expect(
      within(limits).getAllByRole('img', { name: 'Hands over' }),
    ).toHaveLength(2);
    expect(within(limits).getAllByRole('img', { name: 'Always' })).toHaveLength(
      1,
    );
  });

  it('asks a person to confirm a do-not-call request', async () => {
    const source = stubSource();
    const confirm = vi.spyOn(source, 'confirmDoNotCall');
    renderTab(<AicallingWidget />, source);
    const consent = await screen.findByRole('region', {
      name: 'Consent, DND and the calling window',
    });
    expect(within(consent).getByText('09:00 AM – 08:00 PM')).toBeTruthy();
    expect(within(consent).getByText('Needs your confirmation')).toBeTruthy();
    expect(within(consent).getByText('7')).toBeTruthy();
    fireEvent.click(
      within(consent).getByRole('button', {
        name: 'Confirm — never contact again',
      }),
    );
    await waitFor(() => expect(confirm).toHaveBeenCalledWith('dnc-kondal'));
    expect(await within(consent).findByText('8')).toBeTruthy();
    expect(
      within(consent).getByText('Confirmed — never contact again'),
    ).toBeTruthy();

    fireEvent.click(within(consent).getByRole('button', { name: 'Why me?' }));
    expect(
      screen.getByRole('dialog', { name: 'Why this needs a human' }),
    ).toBeTruthy();
  });

  it('lists the call log with the failures too', async () => {
    renderTab(<AicallingWidget />);
    const table = await screen.findByRole('table', {
      name: 'Call log — the failures too',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(11);
    expect(within(table).getAllByText('→ Escalated to Swapna')).toHaveLength(3);
    expect(within(table).getByText('Wrong number — flagged')).toBeTruthy();
  });

  it('shows the loading, error and empty states', async () => {
    renderTab(<AicallingWidget />, stubSource({ getAiCalling: pending }));
    expect(screen.getByRole('heading', { name: 'AI Calling' })).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    cleanup();

    renderTab(
      <AicallingWidget />,
      stubSource({ getAiCalling: () => Promise.reject(new Error('down')) }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Could not load AI calling.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    cleanup();

    renderTab(
      <AicallingWidget />,
      stubSource({
        getAiCalling: async () => ({
          ...(await createMockReceptionSource().getAiCalling()),
          calls: [],
        }),
      }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'No recorded calls to replay',
      }),
    ).toBeTruthy();
  });

  it('names every control and reaches the player from the keyboard', async () => {
    renderTab(<AicallingWidget />);
    const play = await screen.findByRole('button', { name: 'Play call' });
    play.focus();
    expect(document.activeElement).toBe(play);
    expect(
      screen.getByRole('radiogroup', { name: 'Call to replay' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('radiogroup', { name: 'Call language' }),
    ).toBeTruthy();
    expect(screen.getAllByRole('switch')).toHaveLength(6);
    for (const toggle of screen.getAllByRole('switch')) {
      expect(toggle.getAttribute('id')).toBeTruthy();
    }
  });
});
