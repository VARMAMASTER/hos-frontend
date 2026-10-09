import { copy, type MockState } from './mock-util';
import { seedQueue } from './seed-queue';
import type { DoctorDataSource } from './source';

export function queueMethods(
  state: MockState,
): Pick<DoctorDataSource, 'getQueue' | 'startConsultation'> {
  const queue = seedQueue();
  return {
    async getQueue() {
      return copy(queue);
    },
    async startConsultation(token) {
      const entry = queue.entries.find((item) => item.token === token);
      if (!entry) throw new Error('That patient is not on your list.');
      if (entry.status === 'done') {
        throw new Error('That patient has already been seen.');
      }
      for (const other of queue.entries) {
        if (other.status === 'in-room' && other.token !== token) {
          other.status = 'done';
        }
      }
      entry.status = 'in-room';
      state.openToken = token;
      return copy(queue);
    },
  };
}
