import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockDoctorSource } from './mock';
import type { DoctorDataSource } from './source';

// The mock is the reference implementation of DoctorDataSource: the tabs are built and tested
// against it, and the real API must behave the same way.

let source: DoctorDataSource;
const consoleSpies: ReturnType<typeof vi.spyOn>[] = [];

beforeEach(() => {
  source = createMockDoctorSource();
  // Health data never reaches a log: the mock writes nothing to the console, ever.
  for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
    consoleSpies.push(
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );
  }
});

afterEach(() => {
  for (const spy of consoleSpies) {
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  }
  consoleSpies.length = 0;
});

describe('mock doctor source: queue', () => {
  it('starts with the prototype session: seven patients, Lakshmi Devi in the room', async () => {
    const queue = await source.getQueue();
    expect(queue.session.doctorName).toBe('Dr. K. Ramesh');
    expect(queue.session.runningBehindMinutes).toBe(12);
    expect(queue.entries.map((entry) => entry.token)).toEqual([
      'T-12',
      'T-10',
      'T-14',
      'T-15',
      'T-17',
      'T-21',
      'T-24',
    ]);
    const inRoom = queue.entries.filter((entry) => entry.status === 'in-room');
    expect(inRoom.map((entry) => entry.name)).toEqual(['Lakshmi Devi']);
    expect(queue.listed).toEqual({ next: 7, total: 26 });
    expect(queue.kpis.map((kpi) => [kpi.label, kpi.value])).toEqual([
      ['Consults done today', '14 / 26'],
      ['Avg wait time', '14 min'],
      ['Avg consult length', '8 min'],
      ['Running behind by', '12 min'],
    ]);
  });

  it('carries the two charts the prototype draws', async () => {
    const queue = await source.getQueue();
    expect(queue.hourly.map((hour) => [hour.hour, hour.consults])).toEqual([
      ['9–10 AM', 3],
      ['10–11 AM', 4],
      ['11–12 PM', 3],
      ['12–1 PM', 4],
    ]);
    expect(queue.hourly[3].partial).toBe(true);
    expect(queue.weekWait.map((day) => day.day)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
  });

  it('opens a consultation: the chosen patient is in the room, the one seen is done', async () => {
    const queue = await source.startConsultation('T-14');
    const status = (token: string) =>
      queue.entries.find((entry) => entry.token === token)?.status;
    expect(status('T-14')).toBe('in-room');
    expect(status('T-12')).toBe('done');
    expect(
      queue.entries.filter((entry) => entry.status === 'in-room'),
    ).toHaveLength(1);
  });

  it('refuses a token that is not on the list, and a patient already seen', async () => {
    await expect(source.startConsultation('T-99')).rejects.toThrow(
      'That patient is not on your list.',
    );
    await expect(source.startConsultation('T-10')).rejects.toThrow(
      'That patient has already been seen.',
    );
  });

  it('returns copies, so a caller cannot change the source by editing a result', async () => {
    const first = await source.getQueue();
    first.entries[0].name = 'Changed';
    const second = await source.getQueue();
    expect(second.entries[0].name).toBe('Lakshmi Devi');
  });

  it('keeps each instance separate', async () => {
    await source.startConsultation('T-14');
    const other = createMockDoctorSource();
    const queue = await other.getQueue();
    expect(queue.entries.find((entry) => entry.token === 'T-12')?.status).toBe(
      'in-room',
    );
  });
});
