import { chartIsOpen, copy, type MockState } from './mock-util';
import { seedLetter, seedReferrals, seedTeluguCopy } from './seed-referrals';
import type { DoctorDataSource } from './source';

type ReferralMethods = Pick<
  DoctorDataSource,
  | 'getReferrals'
  | 'draftReferralLetter'
  | 'signReferral'
  | 'draftTeluguCopy'
  | 'approveTeluguCopy'
>;

export function referralsMethods(state: MockState): ReferralMethods {
  // The letters the doctor has signed. Held here and nowhere else: the mock sends nothing outside
  // the hospital.
  const signed = new Set<string>();
  const known = (letterId: string) => seedLetter(letterId) !== null;

  return {
    async getReferrals() {
      const overview = seedReferrals();
      if (chartIsOpen(state)) return copy(overview);
      // No chart open: there is no one to write about, but the list of what was sent still shows.
      return copy({ ...overview, patient: null, recipients: [] });
    },
    async draftReferralLetter(recipientId) {
      const letter = chartIsOpen(state) ? seedLetter(recipientId) : null;
      if (!letter) throw new Error('That recipient is not on the list.');
      return copy(letter);
    },
    async signReferral(letterId, _attachmentIds, ask) {
      if (!known(letterId)) throw new Error('That letter is not drafted.');
      if (ask.trim() === '') {
        throw new Error('The letter needs the question you are asking.');
      }
      signed.add(letterId);
    },
    async draftTeluguCopy(letterId) {
      if (!known(letterId)) throw new Error('That letter is not drafted.');
      return copy(seedTeluguCopy());
    },
    async approveTeluguCopy(letterId) {
      if (!known(letterId)) throw new Error('That letter is not drafted.');
    },
  };
}
