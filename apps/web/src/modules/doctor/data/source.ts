import type {
  CheckBlock,
  ConsultationOverview,
  ConsultDraft,
  NoteText,
  QueueOverview,
  ReferenceCheck,
  RxLine,
} from './types';

// Everything the Doctor module reads and writes. The tabs depend on this interface only (through
// useDoctor), never on mock.ts, so the real API client implements it later and no tab changes.
//
// The AI rule holds here too: a method that files, sends, orders or prescribes something an AI
// drafted is only ever called from a person's approval (an ApprovalBar), and the source never acts
// on its own. No method returns a dose, a drug choice or a diagnosis: those are the doctor's.
export interface DoctorDataSource {
  // My queue.
  getQueue(): Promise<QueueOverview>;
  // Opens a patient's consultation: they are in the room, and the patient who was in the room is
  // marked seen.
  startConsultation(token: string): Promise<QueueOverview>;

  // Consultation. null when the patient in the room has no chart prepared.
  getConsultation(): Promise<ConsultationOverview | null>;
  // The reference and consistency check, on request: values beside published ranges and her own
  // history, and contradictions between records. Facts and questions; never an instruction.
  runReferenceCheck(): Promise<ReferenceCheck>;
  // The doctor accepted a block: it goes on today's note.
  attachCheckBlock(blockId: CheckBlock['id']): Promise<void>;
  // The doctor dismissed a block, with a reason: dismissals are logged with their name.
  dismissCheckBlock(blockId: CheckBlock['id'], reason: string): Promise<void>;
  // The scribe's draft after the consultation: S, O and A, and a carry-forward of the existing
  // prescription. Never a plan.
  draftConsultNote(): Promise<ConsultDraft>;
  // The doctor signed the note. Rejects while the plan is empty: it is theirs to dictate.
  signNote(note: NoteText): Promise<void>;
  // Re-checks the edited durations against the allergy file and the labels.
  checkPrescription(lines: Pick<RxLine, 'id' | 'duration'>[]): Promise<string>;
  // The doctor approved the prescription: it goes to the patient's WhatsApp.
  approvePrescription(lines: Pick<RxLine, 'id' | 'duration'>[]): Promise<void>;
}
