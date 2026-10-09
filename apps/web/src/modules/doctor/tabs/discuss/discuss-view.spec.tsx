/// <reference lib="dom" />
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockDoctorSource } from '../../data/mock';
import { pending, renderTab, stubSource } from '../../testing/render';
import { DiscussWidget } from './discuss-view';

afterEach(() => cleanup());

async function convene() {
  fireEvent.click(
    await screen.findByRole('button', { name: /Convene the three lenses/ }),
  );
  return screen.findByRole('group', {
    name: /Lens 1 · Drug safety and what the labels say/,
  });
}

function lens(name: RegExp) {
  return screen.getByRole('group', { name }) as HTMLElement;
}

function ask(question: string) {
  fireEvent.change(screen.getByLabelText('Ask the panel'), {
    target: { value: question },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
}

describe('DiscussWidget: what her record contains', () => {
  it('lists the nine facts with the value now first, who produced it and when', async () => {
    renderTab(<DiscussWidget />);
    const table = await screen.findByRole('table', {
      name: 'What her record contains',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(10);
    expect(
      screen.getByRole('heading', {
        name: /Lakshmi Devi, 58F — what her record actually contains/,
      }),
    ).toBeTruthy();
    expect(screen.getByText('9 facts · 4 sources · 2 hospitals')).toBeTruthy();
    expect(within(table).getByText('eGFR 44')).toBeTruthy();
    expect(within(table).getAllByText('via ABHA')).toHaveLength(2);
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(headers).toEqual([
      'Value now',
      'What it was before',
      'Who produced it',
      'When',
    ]);
  });
});

describe('DiscussWidget: the three lenses', () => {
  it('waits to be asked, and says what a lens may do and not do', async () => {
    renderTab(<DiscussWidget />);
    await screen.findByRole('button', { name: /Convene the three lenses/ });
    expect(
      screen.getByText(/Each lens may do exactly three things/),
    ).toBeTruthy();
    expect(
      screen.getByText('Tier: amber · reference & consistency'),
    ).toBeTruthy();
    expect(screen.queryByRole('group', { name: /Lens 1/ })).toBeNull();
  });

  it('convenes three lenses that reasoned alone, each an AI draft with its tier in words', async () => {
    renderTab(<DiscussWidget />);
    await convene();
    for (const [name, tier] of [
      [/Lens 1 · Drug safety/, 'Tier: amber'],
      [/Lens 2 · Cost and access/, 'Tier: green'],
      [/Lens 3 · What is missing/, 'Tier: amber'],
    ] as const) {
      const box = lens(name);
      expect(within(box).getByText('AI draft')).toBeTruthy();
      expect(within(box).getByText(tier)).toBeTruthy();
      expect(within(box).getByText('reasoned alone')).toBeTruthy();
      expect(
        within(box).getByText('What this lens wants to ask you'),
      ).toBeTruthy();
      expect(
        within(box).getAllByRole('listitem').length,
      ).toBeGreaterThanOrEqual(3);
    }
    expect(
      within(lens(/Lens 1/)).getByText(
        /Is there a renal result you have seen that never made it into this record/,
      ),
    ).toBeTruthy();
  });

  it('says the lenses disagree, and that no lens recommended an action', async () => {
    renderTab(<DiscussWidget />);
    await convene();
    expect(
      screen.getByRole('heading', {
        name: 'The three lenses do not agree, and we are not going to hide that',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Drug safety says the constraint is already on the record',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "What's-missing says the opposite, from the same record",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /No lens recommended an action, and there is no fourth lens/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: 'The decision is yours. HOS is not going to make it.',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Five questions the panel would like answered/),
    ).toBeTruthy();
  });

  it('shows the metformin label in a dialog, quoted and not computed', async () => {
    renderTab(<DiscussWidget />);
    await convene();
    fireEvent.click(
      within(lens(/Lens 1/)).getByRole('button', {
        name: /Show the metformin label in full/,
      }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: /Metformin — the label, in full/,
    });
    expect(within(dialog).getByText(/eGFR 30–44/)).toBeTruthy();
    expect(
      within(dialog).getByText(/does not compute a new dose/),
    ).toBeTruthy();
  });

  it('re-runs a check as a read-out, with nothing to approve', async () => {
    const source = stubSource();
    const run = vi.spyOn(source, 'runLensAction');
    renderTab(<DiscussWidget />, source);
    await convene();
    fireEvent.click(
      within(lens(/Lens 1/)).getByRole('button', {
        name: /Re-run the interaction check/,
      }),
    );
    await waitFor(() => expect(run).toHaveBeenCalledWith('safety', 'recheck'));
    expect(
      await screen.findByText(
        'Interaction check re-run against all three lines',
      ),
    ).toBeTruthy();
  });

  it('drafts a lab chase as a draft that goes only when the doctor approves it', async () => {
    const source = stubSource();
    const approve = vi.spyOn(source, 'approveLensDraft');
    renderTab(<DiscussWidget />, source);
    await convene();
    fireEvent.click(
      within(lens(/Lens 3/)).getByRole('button', {
        name: /Chase the open lipid order/,
      }),
    );
    const draft = await screen.findByRole('group', {
      name: /Draft: chase the lab on the 21 Jun lipid order/,
    });
    expect(within(draft).getByText('AI draft')).toBeTruthy();
    expect(approve).not.toHaveBeenCalled();
    fireEvent.click(
      within(draft).getByRole('button', { name: /Approve & send to the lab/ }),
    );
    await waitFor(() => expect(approve).toHaveBeenCalledWith('gaps', 'chase'));
    await waitFor(() =>
      expect(within(draft).getByText(/Sent · Dr\. K\. Ramesh/)).toBeTruthy(),
    );
  });
});

describe('DiscussWidget: the note for her chart', () => {
  it('adds a record that the review happened only when the doctor approves it', async () => {
    const source = stubSource();
    const approve = vi.spyOn(source, 'approveReviewNote');
    renderTab(<DiscussWidget />, source);
    await convene();
    const note = screen.getByRole('group', {
      name: /Note for her chart — that this review happened/,
    });
    expect(within(note).getByText('AI draft')).toBeTruthy();
    expect(
      within(note).getByText(/No change to therapy recorded at this review/),
    ).toBeTruthy();
    expect(approve).not.toHaveBeenCalled();
    fireEvent.click(
      within(note).getByRole('button', { name: /Approve & add to her chart/ }),
    );
    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        within(note).getByText(/Added to her chart · Dr\. K\. Ramesh/),
      ).toBeTruthy(),
    );
  });
});

describe('DiscussWidget: ask the panel', () => {
  it('answers with evidence and says it is evidence only', async () => {
    renderTab(<DiscussWidget />);
    await screen.findByRole('button', { name: /Convene the three lenses/ });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Why do you call the eGFR unconfirmed?',
      }),
    );
    expect(
      await screen.findByText(/Because of three dates and nothing else/),
    ).toBeTruthy();
    expect(await screen.findByText('Tier: amber · evidence only')).toBeTruthy();
  });

  it('refuses to say what to do, shows the blocked RED tier, and hands over the facts instead', async () => {
    renderTab(<DiscussWidget />);
    await screen.findByRole('button', { name: /Convene the three lenses/ });
    ask('What should I do about the Metformin?');
    expect(
      await screen.findByText(/I am not going to answer that/),
    ).toBeTruthy();
    const red = await screen.findByText('Tier: red · not answered');
    expect(red.closest('[aria-disabled="true"]')).not.toBeNull();
    expect(
      screen.getByText(
        /The decision is yours, and the record will show it as yours/,
      ),
    ).toBeTruthy();
  });

  it('says what it can answer when it is asked something else', async () => {
    renderTab(<DiscussWidget />);
    await screen.findByRole('button', { name: /Convene the three lenses/ });
    ask('Tell me a joke');
    expect(await screen.findByText(/The three lenses stay open/)).toBeTruthy();
  });
});

describe('DiscussWidget: states and access', () => {
  it('shows the loading state with the header in place', () => {
    renderTab(<DiscussWidget />, stubSource({ getDiscussion: pending }));
    expect(
      screen.getByRole('heading', { name: 'Case Discussion' }),
    ).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockDoctorSource();
    const getDiscussion = vi
      .fn()
      .mockRejectedValueOnce(new Error('Lakshmi Devi discussion store down'))
      .mockImplementation(() => real.getDiscussion());
    renderTab(<DiscussWidget />, stubSource({ getDiscussion }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load the case discussion.');
    expect(alert.textContent).not.toContain('discussion store');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('button', { name: /Convene the three lenses/ }),
    ).toBeTruthy();
  });

  it('says so when no chart is open', async () => {
    renderTab(
      <DiscussWidget />,
      stubSource({ getDiscussion: async () => null }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'No case is open for discussion',
      }),
    ).toBeTruthy();
  });

  it('is reachable from the keyboard, and the lenses and the composer are named', async () => {
    renderTab(<DiscussWidget />);
    const button = await screen.findByRole('button', {
      name: /Convene the three lenses/,
    });
    button.focus();
    expect(document.activeElement).toBe(button);
    await convene();
    expect(
      within(lens(/Lens 2/)).getByRole('heading', {
        name: /Lens 2 · Cost and access/,
      }),
    ).toBeTruthy();
    expect(screen.getByLabelText('Ask the panel')).toBeTruthy();
    expect(
      screen.getByRole('log', { name: 'Conversation with the panel' }),
    ).toBeTruthy();
  });
});
