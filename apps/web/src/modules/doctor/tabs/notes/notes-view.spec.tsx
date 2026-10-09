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
import { NotesWidget } from './notes-view';

afterEach(() => cleanup());

async function queue() {
  return screen.findByRole('table', { name: 'Notes awaiting your signature' });
}

function row(name: string) {
  return within(screen.getByRole('table', { name: /awaiting your signature/ }))
    .getByText(name)
    .closest('tr') as HTMLElement;
}

async function openNaidu() {
  await queue();
  fireEvent.click(
    within(row('Venkatesh Naidu')).getByRole('button', {
      name: /Open the note/,
    }),
  );
  return screen.findByRole('group', {
    name: /Progress note — Venkatesh Naidu/,
  });
}

describe('NotesWidget', () => {
  it('shows the honest figures: minutes per note, and the published number beside them', async () => {
    renderTab(<NotesWidget />);
    await queue();
    expect(
      screen.getByRole('heading', { name: 'Notes drafted today' }),
    ).toBeTruthy();
    expect(
      screen.getByText(/14 of your 14 completed consultations have a draft/),
    ).toBeTruthy();
    expect(screen.getByText('2 min 10 s')).toBeTruthy();
    expect(screen.getByText('16.0 min')).toBeTruthy();
    expect(screen.getByText(/JAMA, 1 Apr 2026/)).toBeTruthy();
    expect(screen.getByText(/Tier: green · transcribe & format/)).toBeTruthy();
    // No bare percentage: the product prints minutes per note.
    expect(document.body.textContent).not.toMatch(/\b\d+% faster\b/);
  });

  it('lists the four notes awaiting a signature, each marked as an AI draft', async () => {
    renderTab(<NotesWidget />);
    const table = await queue();
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(screen.getByText('4 awaiting')).toBeTruthy();
    expect(
      within(row('Venkatesh Naidu')).getByText('S · O · A ready'),
    ).toBeTruthy();
    const blocked = within(row('Lakshmi Devi')).getByText(
      'S · O · A ready · P empty',
    );
    expect(blocked.querySelector('[data-slot="icon"]')).not.toBeNull();
    expect(
      within(row('Lakshmi Devi')).getByText(
        /Cannot be signed — no plan has been spoken yet/,
      ),
    ).toBeTruthy();
    expect(
      within(row('Lakshmi Devi')).queryByRole('button', {
        name: /Open the note/,
      }),
    ).toBeNull();
  });

  it('explains why a blocked note is blocked, and points to Case Discussion', async () => {
    renderTab(<NotesWidget />);
    await queue();
    fireEvent.click(
      within(row('Lakshmi Devi')).getByRole('button', {
        name: /Why is it blocked/,
      }),
    );
    expect(screen.getByText(/Her plan is still open/)).toBeTruthy();
  });

  it('opens a note as a draft with the plan transcribed verbatim, and files it only on approval', async () => {
    const source = stubSource();
    const file = vi.spyOn(source, 'fileNote');
    renderTab(<NotesWidget />, source);
    const note = await openNaidu();
    expect(within(note).getByText('AI draft')).toBeTruthy();
    expect(within(note).getByText('Draft — awaiting approval')).toBeTruthy();
    // S and O are verbatim from the encounter; P is the doctor's own words, transcribed.
    expect(within(note).getAllByText('transcribed verbatim')).toHaveLength(3);
    expect(file).not.toHaveBeenCalled();

    fireEvent.click(
      within(note).getByRole('button', { name: /Approve & file the note/ }),
    );
    await waitFor(() => expect(file).toHaveBeenCalledTimes(1));
    expect(file.mock.calls[0][0]).toBe('naidu');
    // The plan filed is the doctor's own transcribed words, in Telugu.
    expect(file.mock.calls[0][1].plan).toMatch(/అదే మందు కొనసాగించండి/);
    await waitFor(() =>
      expect(within(note).getByText(/Filed · Dr\. K\. Ramesh/)).toBeTruthy(),
    );
    // The row moves out of the queue.
    await waitFor(() => expect(screen.getByText('3 awaiting')).toBeTruthy());
    expect(within(row('Venkatesh Naidu')).getByText('Filed')).toBeTruthy();
  });

  it('rejects a draft only with a reason, and records it', async () => {
    const source = stubSource();
    const reject = vi.spyOn(source, 'rejectNote');
    renderTab(<NotesWidget />, source);
    const note = await openNaidu();
    fireEvent.click(within(note).getByRole('button', { name: /Reject/ }));
    fireEvent.click(within(note).getByRole('button', { name: /Reject draft/ }));
    expect(reject).not.toHaveBeenCalled();
    fireEvent.change(within(note).getByLabelText(/Why are you rejecting/), {
      target: { value: 'Wrong patient' },
    });
    fireEvent.click(within(note).getByRole('button', { name: /Reject draft/ }));
    await waitFor(() =>
      expect(reject).toHaveBeenCalledWith('naidu', 'Wrong patient'),
    );
    await waitFor(() =>
      expect(within(note).getByText('Rejected')).toBeTruthy(),
    );
  });

  it('lets the doctor edit a section before signing, and files the edit', async () => {
    const source = stubSource();
    const file = vi.spyOn(source, 'fileNote');
    renderTab(<NotesWidget />, source);
    const note = await openNaidu();
    fireEvent.change(within(note).getByLabelText('P — Plan'), {
      target: { value: 'Continue the same medicine. Review in two months.' },
    });
    fireEvent.click(
      within(note).getByRole('button', { name: /Approve & file the note/ }),
    );
    await waitFor(() => expect(file).toHaveBeenCalled());
    expect(file.mock.calls[0][1].plan).toBe(
      'Continue the same medicine. Review in two months.',
    );
  });

  it('keeps the note a draft and says why when the source refuses to file it', async () => {
    renderTab(
      <NotesWidget />,
      stubSource({
        fileNote: async () => {
          throw new Error('That note is not ready to file.');
        },
      }),
    );
    const note = await openNaidu();
    fireEvent.click(
      within(note).getByRole('button', { name: /Approve & file the note/ }),
    );
    expect(
      await screen.findByText('That note is not ready to file.'),
    ).toBeTruthy();
    expect(within(note).getByText('Draft — awaiting approval')).toBeTruthy();
  });

  it('shows the loading state with the header in place', () => {
    renderTab(<NotesWidget />, stubSource({ getNotes: pending }));
    expect(
      screen.getByRole('heading', { name: 'Progress Notes' }),
    ).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows the error state with fixed words, and loads again on Try again', async () => {
    const real = createMockDoctorSource();
    const getNotes = vi
      .fn()
      .mockRejectedValueOnce(new Error('Venkatesh Naidu note store down'))
      .mockImplementation(() => real.getNotes());
    renderTab(<NotesWidget />, stubSource({ getNotes }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load your progress notes.');
    expect(alert.textContent).not.toContain('note store');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await queue()).toBeTruthy();
  });

  it('shows the empty state when no note is waiting', async () => {
    const notes = await createMockDoctorSource().getNotes();
    renderTab(
      <NotesWidget />,
      stubSource({ getNotes: async () => ({ ...notes, rows: [] }) }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'Nothing is waiting for your signature',
      }),
    ).toBeTruthy();
  });

  it('is reachable from the keyboard, and the table and its buttons are named', async () => {
    renderTab(<NotesWidget />);
    const table = await queue();
    const open = within(row('K. Sarojini')).getByRole('button', {
      name: /Open the note/,
    });
    expect(open.getAttribute('aria-label')).toMatch(/K\. Sarojini/);
    open.focus();
    expect(document.activeElement).toBe(open);
    for (const header of within(table).getAllByRole('columnheader')) {
      expect(header.textContent).not.toBe('');
    }
  });
});
