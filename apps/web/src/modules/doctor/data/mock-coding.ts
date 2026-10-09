import { chartIsOpen, copy, type MockState } from './mock-util';
import { seedCoding } from './seed-coding';
import type { DoctorDataSource } from './source';

type CodingMethods = Pick<
  DoctorDataSource,
  'getCoding' | 'approveCodes' | 'addManualCode'
>;

// An ICD-10 code: a letter, two digits, and up to four more after a dot (E11.65, I10, N18.30).
const ICD10 = /^[A-Z]\d{2}(\.\d{1,4})?$/;

export function codingMethods(state: MockState): CodingMethods {
  const coding = seedCoding();
  // The codes the doctor approved: held here and nowhere else. A claim is never filed by the mock.
  const approved = new Set<string>();

  return {
    async getCoding() {
      return chartIsOpen(state) ? copy(coding) : null;
    },
    async approveCodes(codes) {
      if (codes.length === 0) {
        throw new Error('Confirm at least one code first.');
      }
      const known = new Set(coding.codes.map((item) => item.code));
      if (codes.some((code) => !known.has(code))) {
        throw new Error('One of those codes is not on the list.');
      }
      for (const code of codes) approved.add(code);
    },
    async addManualCode({ code, term }) {
      const normal = code.trim().toUpperCase();
      if (!ICD10.test(normal)) {
        throw new Error('Enter an ICD-10 code like E11.65.');
      }
      if (term.trim() === '') throw new Error('Enter the term for the code.');
      if (coding.codes.some((item) => item.code === normal)) {
        throw new Error('That code is already on the list.');
      }
      const added = {
        code: normal,
        term: term.trim(),
        origin: 'Added by you',
        confidence: 'yours' as const,
      };
      coding.codes.push(added);
      return copy(added);
    },
  };
}
