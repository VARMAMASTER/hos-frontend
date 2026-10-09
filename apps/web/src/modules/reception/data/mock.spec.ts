import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReceptionSource } from './mock';
import type { ReceptionDataSource } from './source';

// The mock is the reference implementation of ReceptionDataSource: the tabs are built and tested
// against it, and the real API must behave the same way.

let source: ReceptionDataSource;
const consoleSpies: ReturnType<typeof vi.spyOn>[] = [];

beforeEach(() => {
  source = createMockReceptionSource();
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

describe('mock reception source: queue', () => {
  it('starts with the prototype board: T-12 in consultation and six waiting', async () => {
    const queue = await source.getQueue();
    expect(queue.kpis.map((kpi) => [kpi.label, kpi.value])).toEqual([
      ["Today's appointments", '64'],
      ['Walk-ins', '18'],
      ['No-shows recovered', '5'],
      ['Waiting now', '9'],
    ]);
    const now = queue.tokens.find((token) => token.state === 'in-consultation');
    expect(now?.token).toBe('T-12');
    expect(now?.patientName).toBe('Venkatesh Naidu');
    const waiting = queue.tokens.filter((token) => token.state === 'waiting');
    expect(waiting.map((token) => token.token)).toEqual([
      'T-13',
      'T-14',
      'T-15',
      'T-16',
      'T-17',
      'T-18',
    ]);
  });

  it('calls the next token: the one in consultation is seen, the first waiting is called', async () => {
    const queue = await source.callNext();
    const state = (token: string) =>
      queue.tokens.find((entry) => entry.token === token)?.state;
    expect(state('T-12')).toBe('done');
    expect(state('T-13')).toBe('called');
    expect(
      queue.tokens.filter((token) => token.state === 'waiting'),
    ).toHaveLength(5);
  });

  it('returns copies, so a caller cannot change the source by editing a result', async () => {
    const first = await source.getQueue();
    first.tokens[0].patientName = 'Changed';
    const second = await source.getQueue();
    expect(second.tokens[0].patientName).not.toBe('Changed');
  });

  it('keeps each instance separate', async () => {
    await source.callNext();
    const other = createMockReceptionSource();
    const queue = await other.getQueue();
    expect(queue.tokens.find((token) => token.token === 'T-12')?.state).toBe(
      'in-consultation',
    );
  });
});

describe('mock reception source: appointments', () => {
  it('has eleven free slots on Mon 20 Jul across three doctors', async () => {
    const overview = await source.getAppointments();
    expect(overview.slotsDate).toBe('Mon 20 Jul 2026');
    expect(overview.doctors.map((doctor) => doctor.name)).toEqual([
      'Dr. K. Ramesh',
      'Dr. P. Anil Kumar',
      'Dr. Sunitha Rao',
    ]);
    expect(
      overview.slots.filter((slot) => slot.status === 'free'),
    ).toHaveLength(11);
    expect(overview.noShowRisks[0]).toMatchObject({
      patientName: 'M. Sailoo',
      riskPercent: 78,
    });
  });

  it('books a free slot, issues the next token and takes the slot', async () => {
    const before = await source.getAppointments();
    const slot = before.slots.find(
      (entry) => entry.status === 'free' && entry.doctorId === 'dr-ramesh',
    );
    expect(slot).toBeDefined();
    const booked = await source.bookAppointment({
      patientName: 'Ramesh',
      phone: '+91 90031 55402',
      doctorId: 'dr-ramesh',
      slotId: slot?.id ?? '',
      channel: 'Walk-in',
      payment: 'upi',
    });
    expect(booked.token).toBe('T-27');
    expect(booked.doctorName).toBe('Dr. K. Ramesh');
    const after = await source.getAppointments();
    expect(after.slots.find((entry) => entry.id === slot?.id)?.status).toBe(
      'taken',
    );
    expect(after.slots.filter((entry) => entry.status === 'free')).toHaveLength(
      10,
    );
  });

  it('refuses a slot that is already taken, without echoing the patient', async () => {
    const overview = await source.getAppointments();
    const taken = overview.slots.find((slot) => slot.status === 'taken');
    await expect(
      source.bookAppointment({
        patientName: 'Ramesh',
        phone: '+91 90031 55402',
        doctorId: taken?.doctorId ?? '',
        slotId: taken?.id ?? '',
        channel: 'Phone',
        payment: 'counter',
      }),
    ).rejects.toThrow(/no longer free/);
    await expect(
      source.bookAppointment({
        patientName: 'Ramesh',
        phone: '+91 90031 55402',
        doctorId: taken?.doctorId ?? '',
        slotId: taken?.id ?? '',
        channel: 'Phone',
        payment: 'counter',
      }),
    ).rejects.not.toThrow(/Ramesh/);
  });

  it('books the discharge follow-up only when a person approves it', async () => {
    const overview = await source.getAppointments();
    expect(overview.followUp?.patientName).toBe('B. Srinu');
    const booked = await source.approveFollowUp(overview.followUp?.id ?? '');
    expect(booked).toMatchObject({
      patientName: 'B. Srinu',
      doctorName: 'Dr. P. Anil Kumar',
      slotLabel: 'Mon 27 Jul 2026 · 10:30 AM',
    });
    const after = await source.getAppointments();
    expect(after.followUp).toBeNull();
  });
});

describe('mock reception source: day schedule', () => {
  it('books a free slot and moves a booking to another free slot', async () => {
    const schedule = await source.getSchedule();
    expect(schedule.date).toBe('18 Jul 2026');
    const free = schedule.entries.find((entry) => entry.kind === 'free');
    expect(free).toMatchObject({ doctorId: 'dr-sunitha', time: '10:00' });
    const booked = await source.bookScheduleSlot({
      entryId: free?.id ?? '',
      patientName: 'Ramesh',
      reason: 'New consult · joint pain',
    });
    const entry = booked.entries.find((item) => item.id === free?.id);
    expect(entry).toMatchObject({
      kind: 'booked',
      patientName: 'Ramesh',
      token: 'T-27',
    });

    const fresh = createMockReceptionSource();
    const day = await fresh.getSchedule();
    const anitha = day.entries.find(
      (item) => item.kind === 'booked' && item.patientName === 'D. Anitha',
    );
    const open = day.entries.find((item) => item.kind === 'free');
    const moved = await fresh.rescheduleEntry(anitha?.id ?? '', open?.id ?? '');
    const target = moved.entries.find((item) => item.id === open?.id);
    expect(target).toMatchObject({ kind: 'booked', patientName: 'D. Anitha' });
    expect(moved.entries.find((item) => item.id === anitha?.id)?.kind).toBe(
      'free',
    );
  });
});

describe('mock reception source: registration', () => {
  it('finds an existing record by phone, and says a new number gets a new MRN', async () => {
    await expect(source.lookupPhone('+91 98765 43210')).resolves.toMatchObject({
      kind: 'existing',
      name: 'Venkatesh Naidu',
      abha: '91-1234-5678-9012',
    });
    await expect(source.lookupPhone('90000 11111')).resolves.toMatchObject({
      kind: 'new',
    });
  });

  it('never fetches an ABHA profile without consent', async () => {
    await expect(
      source.fetchAbhaProfile('91-7412-8890-3345', false),
    ).rejects.toThrow(/consent/i);
    await expect(
      source.fetchAbhaProfile('91-7412-8890-3345', true),
    ).resolves.toMatchObject({ name: 'N. Suvarna Kumari', ageSex: '34 / F' });
  });

  it('registers a patient with the next token and keeps no ABHA number without consent', async () => {
    const registered = await source.registerPatient({
      phone: '+91 90000 11111',
      name: 'Ramesh',
      ageSex: '44 / M',
      department: 'General Medicine',
      abhaNumber: '91-0000-0000-0000',
      abhaConsent: false,
    });
    expect(registered).toMatchObject({
      name: 'Ramesh',
      token: 'T-27',
      abhaLinked: false,
    });
    const overview = await source.getRegistration();
    expect(overview.recent[0].name).toBe('Ramesh');
    expect(overview.recent).toHaveLength(6);
  });
});

describe('mock reception source: admission', () => {
  it('will not admit until all four consents are captured', async () => {
    const overview = await source.getAdmission();
    const request = overview.request;
    expect(request?.patient.name).toBe('D. Prakash');
    const instruction = {
      requestId: request?.id ?? '',
      payer: 'star' as const,
      wardId: request?.bed.wards[0].id ?? '',
      bedId: request?.bed.beds[0].id ?? '',
      consentIds: request?.consents.slice(0, 3).map((c) => c.id) ?? [],
    };
    await expect(source.admit(instruction)).rejects.toThrow(/consent/i);
    const result = await source.admit({
      ...instruction,
      consentIds: request?.consents.map((c) => c.id) ?? [],
    });
    expect(result.records).toHaveLength(6);
    expect(result.freeBeds).toBe('11');
  });
});

describe('mock reception source: referrals', () => {
  it('accepts a pending referral', async () => {
    const overview = await source.getReferrals();
    const pending = overview.referrals.filter((r) => r.status === 'pending');
    expect(pending.map((r) => r.patientName)).toEqual([
      'B. Srinu',
      'Padma Sree',
    ]);
    const accepted = await source.acceptReferral(pending[0].id);
    expect(accepted.status).toBe('accepted');
  });
});

describe('mock reception source: WhatsApp and AI calling', () => {
  it('sends an approved reply into the conversation and clears the draft', async () => {
    const overview = await source.getWhatsApp();
    const irfan = overview.conversations.find(
      (c) => c.patientName === 'Mohd. Irfan',
    );
    expect(irfan?.draft).not.toBeNull();
    const sent = await source.sendWhatsAppReply(
      irfan?.id ?? '',
      'Edited reply',
    );
    expect(sent).toMatchObject({ direction: 'out', text: 'Edited reply' });
    const after = await source.getWhatsApp();
    const thread = after.conversations.find((c) => c.id === irfan?.id);
    expect(thread?.draft).toBeNull();
    expect(thread?.messages.at(-1)?.text).toBe('Edited reply');
  });

  it('confirms a do-not-call request and counts it', async () => {
    const overview = await source.getAiCalling();
    expect(overview.consent.doNotCallCount).toBe(7);
    const count = await source.confirmDoNotCall(
      overview.consent.request?.id ?? '',
    );
    expect(count).toBe(8);
    const after = await source.getAiCalling();
    expect(after.consent.request?.confirmed).toBe(true);
  });

  it('carries the recorded calls in all three languages', async () => {
    const overview = await source.getAiCalling();
    const recall = overview.calls[0];
    expect(recall.title).toBe('Outbound · K. Yadamma, 63F');
    const firstTurn = recall.steps.find((step) => step.kind === 'turn');
    expect(firstTurn?.kind === 'turn' && firstTurn.text.en).toMatch(
      /AI assistant — not a person/,
    );
  });
});
