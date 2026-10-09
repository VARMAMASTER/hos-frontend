import { chartIsOpen, copy, matchReply, type MockState } from './mock-util';
import { HISTORY_BANK, HISTORY_FALLBACK, seedHistory } from './seed-history';
import type { DoctorDataSource } from './source';

export function historyMethods(
  state: MockState,
): Pick<DoctorDataSource, 'getHistory' | 'askHistory'> {
  return {
    async getHistory() {
      return chartIsOpen(state) ? copy(seedHistory()) : null;
    },
    // The sample memory picks a canned answer from the question's words. It stores nothing: not the
    // question, not the answer.
    async askHistory(question) {
      return matchReply(question, HISTORY_BANK, HISTORY_FALLBACK);
    },
  };
}
