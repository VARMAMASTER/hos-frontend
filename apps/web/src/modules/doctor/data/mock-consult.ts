import { chartIsOpen, copy, type MockState } from './mock-util';
import {
  PRESCRIPTION_RECHECK,
  seedConsultation,
  seedConsultDraft,
  seedReferenceCheck,
} from './seed-consult';
import type { DoctorDataSource } from './source';
import type { RxLine } from './types';

type ConsultMethods = Pick<
  DoctorDataSource,
  | 'getConsultation'
  | 'runReferenceCheck'
  | 'attachCheckBlock'
  | 'dismissCheckBlock'
  | 'draftConsultNote'
  | 'signNote'
  | 'checkPrescription'
  | 'approvePrescription'
>;

function requireDurations(lines: Pick<RxLine, 'id' | 'duration'>[]) {
  if (lines.some((line) => line.duration.trim() === '')) {
    throw new Error('Enter a duration for every line.');
  }
}

export function consultMethods(state: MockState): ConsultMethods {
  // What the doctor has done with the check's blocks and the prescription. Held here, and nowhere
  // else: the mock sends nothing anywhere.
  const attached = new Set<string>();
  const dismissed = new Map<string, string>();
  const knownBlocks = new Set(seedReferenceCheck().blocks.map((b) => b.id));

  return {
    async getConsultation() {
      return chartIsOpen(state) ? copy(seedConsultation()) : null;
    },
    async runReferenceCheck() {
      return copy(seedReferenceCheck());
    },
    async attachCheckBlock(blockId) {
      if (!knownBlocks.has(blockId)) {
        throw new Error('That block is not part of this check.');
      }
      attached.add(blockId);
    },
    async dismissCheckBlock(blockId, reason) {
      if (!knownBlocks.has(blockId)) {
        throw new Error('That block is not part of this check.');
      }
      if (reason.trim() === '') {
        throw new Error('Say why you are dismissing this block.');
      }
      dismissed.set(blockId, reason.trim());
    },
    async draftConsultNote() {
      return copy(seedConsultDraft());
    },
    async signNote(note) {
      if (note.plan.trim() === '') {
        throw new Error(
          'The note cannot be signed until you have dictated the plan.',
        );
      }
      state.consultNoteSigned = true;
    },
    async checkPrescription(lines) {
      requireDurations(lines);
      return PRESCRIPTION_RECHECK;
    },
    async approvePrescription(lines) {
      requireDurations(lines);
    },
  };
}
