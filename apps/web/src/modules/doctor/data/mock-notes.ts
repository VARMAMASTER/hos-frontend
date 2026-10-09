import { copy, type MockState } from './mock-util';
import { seedNoteDrafts, seedNoteRows, seedNotesOverview } from './seed-notes';
import type { DoctorDataSource } from './source';

type NotesMethods = Pick<
  DoctorDataSource,
  'getNotes' | 'openNote' | 'fileNote' | 'rejectNote'
>;

export function notesMethods(state: MockState): NotesMethods {
  const rows = seedNoteRows();
  const drafts = seedNoteDrafts();

  // Lakshmi Devi's note is the one the Consultation tab signs: once signed there, it is filed here.
  const stateOf = (id: string) => {
    const row = rows.find((item) => item.id === id);
    if (!row) throw new Error('That note is not on your list.');
    return row.id === 'lakshmi' && state.consultNoteSigned
      ? 'filed'
      : row.state;
  };

  return {
    async getNotes() {
      return copy({
        ...seedNotesOverview(),
        rows: rows.map((row) => ({ ...row, state: stateOf(row.id) })),
      });
    },
    async openNote(noteId) {
      if (stateOf(noteId) !== 'ready' || !drafts[noteId]) {
        throw new Error('That note is not ready to open.');
      }
      return copy(drafts[noteId]);
    },
    async fileNote(noteId, note) {
      if (stateOf(noteId) !== 'ready') {
        throw new Error('That note is not ready to file.');
      }
      if (note.plan.trim() === '') {
        throw new Error('The note cannot be filed until it has a plan.');
      }
      const row = rows.find((item) => item.id === noteId);
      if (row) row.state = 'filed';
    },
    async rejectNote(noteId, reason) {
      if (stateOf(noteId) !== 'ready') {
        throw new Error('That note is not ready to reject.');
      }
      if (reason.trim() === '') {
        throw new Error('Say why you are rejecting this draft.');
      }
      const row = rows.find((item) => item.id === noteId);
      if (row) row.state = 'rejected';
    },
  };
}
