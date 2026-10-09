import type { QueueOverview } from './types';

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
}
