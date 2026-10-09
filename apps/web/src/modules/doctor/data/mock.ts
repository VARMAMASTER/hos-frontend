import { consultMethods } from './mock-consult';
import { queueMethods } from './mock-queue';
import type { MockState } from './mock-util';
import { OPEN_PATIENT_TOKEN } from './seed-queue';
import type { DoctorDataSource } from './source';

// The in-memory DoctorDataSource: invented sample data (seed-*.ts), held in this closure and nowhere
// else. It makes no network call, writes nothing to browser storage and logs nothing. Errors say
// what failed, never whose record it was. Each call to the factory starts fresh.
export function createMockDoctorSource(): DoctorDataSource {
  const state: MockState = {
    openToken: OPEN_PATIENT_TOKEN,
    consultNoteSigned: false,
  };
  return {
    ...queueMethods(state),
    ...consultMethods(state),
  };
}
