/// <reference lib="dom" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockPatientRecordSource } from './mock';
import type { PatientRecordDataSource } from './source';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function fresh(): PatientRecordDataSource {
  return createMockPatientRecordSource();
}

describe('mock patient record source: snapshot', () => {
  it('describes the invented patient, with her allergies in words', async () => {
    const snapshot = await fresh().getSnapshot();
    expect(snapshot.patient.name).toBe('Lakshmi Devi');
    expect(snapshot.patient.age).toBe(58);
    expect(snapshot.patient.abha).toBe('91-4327-8810-4455');
    expect(snapshot.patient.allergies.map((a) => a.substance)).toEqual([
      'Penicillin',
      'Sulfa drugs',
    ]);
    expect(snapshot.patient.clinician).toBe('Dr. K. Ramesh');
  });

  it('holds the problems, medications, vitals and the three things needing attention', async () => {
    const snapshot = await fresh().getSnapshot();
    expect(snapshot.problems.map((p) => p.name)).toEqual([
      'Type 2 diabetes',
      'Hypertension',
      'Diabetic neuropathy',
      'CKD stage 3a',
    ]);
    expect(snapshot.medications.map((m) => m.name)).toEqual([
      'Metformin',
      'Telmisartan',
      'Pregabalin',
    ]);
    expect(snapshot.vitals.readings.length).toBeGreaterThan(0);
    expect(snapshot.attention).toHaveLength(3);
    // A finding cites the records it rests on.
    for (const item of snapshot.attention) {
      expect(item.sources.length).toBeGreaterThan(0);
    }
  });

  it('gives every status flag a word, so no tone stands alone', async () => {
    const snapshot = await fresh().getSnapshot();
    const flags = [
      ...snapshot.problems.map((p) => p.control),
      ...snapshot.medications.map((m) => m.refills),
      ...snapshot.careGaps.map((g) => g.status),
      ...snapshot.trajectories.map((t) => t.direction),
    ];
    for (const flag of flags)
      expect(flag.label.trim().length).toBeGreaterThan(0);
  });

  it('keeps five result trajectories, each a series with a description', async () => {
    const { trajectories } = await fresh().getSnapshot();
    expect(trajectories.map((t) => t.label)).toEqual([
      'HbA1c',
      'eGFR',
      'Systolic BP',
      'Haemoglobin',
      'Weight',
    ]);
    const hba1c = trajectories[0];
    expect(hba1c.points).toHaveLength(8);
    expect(hba1c.points[0].value).toBe(7.1);
    expect(hba1c.points[hba1c.points.length - 1].value).toBe(8.4);
    for (const t of trajectories) {
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.points.length).toBeGreaterThan(2);
    }
  });

  it('lists five care gaps and three outside records', async () => {
    const snapshot = await fresh().getSnapshot();
    expect(snapshot.careGaps).toHaveLength(5);
    expect(snapshot.outsideRecords.map((r) => r.facility)).toEqual([
      'Yashoda Hospital, Secunderabad',
      'Apollo Clinic, Kukatpally',
      'Govt. UPHC Kukatpally',
    ]);
    expect(snapshot.interop.steps).toHaveLength(5);
  });

  it('rejects an unknown patient without naming the id', async () => {
    const source = fresh();
    await expect(source.getSnapshot('pt-secret-9')).rejects.toThrow(
      'That chart could not be found.',
    );
    await source.getSnapshot('pt-secret-9').catch((error: Error) => {
      expect(error.message).not.toContain('pt-secret-9');
    });
  });

  it('drafts the brief as a draft and records who approved it', async () => {
    const source = fresh();
    const brief = await source.generateBrief();
    expect(brief.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(brief.sources).toMatch(/events/);
    const approval = await source.approveBrief(brief.id, 'Dr. K. Ramesh');
    expect(approval.draftId).toBe(brief.id);
    expect(approval.approver).toBe('Dr. K. Ramesh');
    expect(Number.isNaN(Date.parse(approval.approvedAt))).toBe(false);
  });

  it('takes an approval back on Undo, once, and only if it was given', async () => {
    const source = fresh();
    const brief = await source.generateBrief();
    await expect(source.withdrawApproval(brief.id)).rejects.toThrow(
      'That draft was not approved.',
    );
    await source.approveBrief(brief.id, 'Dr. K. Ramesh');
    await source.withdrawApproval(brief.id);
    await expect(source.withdrawApproval(brief.id)).rejects.toThrow();
  });

  it('refuses to approve a draft nobody wrote, or without a name', async () => {
    const source = fresh();
    await expect(
      source.approveBrief('nope', 'Dr. K. Ramesh'),
    ).rejects.toThrow();
    const brief = await source.generateBrief();
    await expect(source.approveBrief(brief.id, '  ')).rejects.toThrow(
      'An approval needs the approver’s name.',
    );
  });

  it('acts on a care gap once: it is ordered and no longer offers the action', async () => {
    const source = fresh();
    const before = (await source.getSnapshot()).careGaps.find(
      (g) => g.id === 'gap-retinal',
    );
    expect(before?.action?.kind).toBe('order');
    const after = await source.actOnCareGap('gap-retinal');
    expect(after.action).toBeUndefined();
    expect(after.done).toMatch(/ordered/i);
    const again = (await source.getSnapshot()).careGaps.find(
      (g) => g.id === 'gap-retinal',
    );
    expect(again?.done).toMatch(/ordered/i);
  });

  it('rejects a care gap with nothing to do', async () => {
    const source = fresh();
    await expect(source.actOnCareGap('gap-hba1c')).rejects.toThrow();
    await expect(source.actOnCareGap('gap-missing')).rejects.toThrow();
  });
});

describe('mock patient record source: profile', () => {
  it('holds demographics, four conditions and the vitals baseline', async () => {
    const profile = await fresh().getProfile();
    expect(profile.demographics.dateOfBirth).toContain('22 Aug 1967');
    expect(profile.demographics.bloodGroup).toBe('B+');
    expect(profile.demographics.emergencyContact.relation).toBe('son');
    expect(profile.conditions).toHaveLength(4);
    expect(profile.vitals.readings.map((r) => r.label)).toEqual([
      'Height',
      'Weight',
      'BMI',
      'BP baseline',
      'Pulse',
      'SpO₂',
    ]);
    expect(profile.bmiCategory).toBe('Overweight');
  });

  it('shows where a condition came from when it was entered off an outside result', async () => {
    const { conditions } = await fresh().getProfile();
    const ckd = conditions.find((c) => c.name.startsWith('Chronic kidney'));
    expect(ckd?.provenance).toMatch(/Yashoda/);
    expect(conditions[0].provenance).toBeUndefined();
  });
});

describe('mock patient record source: timeline', () => {
  it('counts 39 events over five years, 3 from other hospitals', async () => {
    const timeline = await fresh().getTimeline();
    expect(timeline.years.map((y) => y.year)).toEqual([
      2026, 2025, 2024, 2023, 2022,
    ]);
    expect(timeline.totals.events).toBe(39);
    expect(timeline.totals.external).toBe(3);
    expect(timeline.totals.internal).toBe(36);
    expect(timeline.totals.departments).toBe(6);
    expect(timeline.totals.facilities).toBe(3);
    expect(timeline.years.map((y) => y.total)).toEqual([16, 10, 4, 4, 5]);
    expect(timeline.kindCounts).toEqual({
      visit: 16,
      lab: 11,
      rx: 6,
      ipd: 1,
      doc: 3,
      bill: 2,
    });
  });

  it('opens 2026 and leaves the other years to load on demand', async () => {
    const { years } = await fresh().getTimeline();
    expect(years[0].events).toHaveLength(16);
    for (const year of years.slice(1)) {
      expect(year.events).toBeNull();
      expect(year.preview.length).toBeGreaterThan(0);
    }
  });

  it('loads a year on demand, newest first', async () => {
    const source = fresh();
    const events = await source.getTimelineYear(2025);
    expect(events).toHaveLength(10);
    expect(events[0].dateLabel).toContain('18 Dec 2025');
    expect(events.every((e) => e.year === 2025)).toBe(true);
    await expect(source.getTimelineYear(1999)).rejects.toThrow(
      'That year is not on the record.',
    );
  });

  it('names the facility of every outside event, and a place for every event', async () => {
    const source = fresh();
    const all = (
      await Promise.all(
        [2026, 2025, 2024, 2023, 2022].map((y) => source.getTimelineYear(y)),
      )
    ).flat();
    expect(all).toHaveLength(39);
    const outside = all.filter((e) => e.source === 'ext');
    expect(outside).toHaveLength(3);
    for (const e of outside) expect(e.facility).toBeTruthy();
    for (const e of all) {
      expect(e.where.length).toBeGreaterThan(0);
      expect(e.kindLabel.length).toBeGreaterThan(0);
    }
  });

  it('flags the Amoxicillin consultation as an allergy conflict, in words', async () => {
    const events = await fresh().getTimelineYear(2026);
    const apollo = events.find(
      (e) => e.facility === 'Apollo Clinic, Kukatpally',
    );
    expect(apollo?.flag?.tone).toBe('crit');
    expect(apollo?.flag?.label).toMatch(/Allergy conflict/);
  });
});

describe('mock patient record source: patient memory', () => {
  it('drafts a four-year summary with its sources, and records the approval', async () => {
    const source = fresh();
    const draft = await source.summarizeHistory();
    expect(draft.findings).toHaveLength(6);
    expect(draft.sources).toMatch(/39 events/);
    const approval = await source.approveMemoryDraft(draft.id, 'Dr. K. Ramesh');
    expect(approval.approver).toBe('Dr. K. Ramesh');
    await expect(
      source.approveMemoryDraft('missing', 'Dr. K. Ramesh'),
    ).rejects.toThrow();
  });

  it('answers from the record and always cites where from', async () => {
    const source = fresh();
    const questions = [
      'HbA1c history?',
      'BP trend?',
      'Adherence gaps?',
      'Outside records?',
      'Any admissions?',
      'Allergies?',
      'Last creatinine?',
      'Retinopathy screen done?',
      'something unrelated entirely',
    ];
    for (const q of questions) {
      const answer = await source.askMemory(q);
      expect(answer.question).toBe(q);
      expect(answer.text.length).toBeGreaterThan(20);
      expect(answer.sources.length).toBeGreaterThan(5);
    }
  });

  it('matches by keyword and never predicts', async () => {
    const source = fresh();
    const hba1c = await source.askMemory('what is her HbA1c history');
    expect(hba1c.text).toMatch(/8\.4%/);
    expect(hba1c.sources).toMatch(/lab/i);
    const kidney = await source.askMemory('Last creatinine?');
    expect(kidney.text).toMatch(/eGFR/);
    expect(kidney.text).toMatch(/Yashoda/);
    const unknown = await source.askMemory('will she get dialysis?');
    expect(unknown.confidence).toBe('low');
    expect(unknown.text).not.toMatch(/will (need|get|develop)/i);
  });

  it('suggests follow-ups that are themselves answerable', async () => {
    const source = fresh();
    const answer = await source.askMemory('HbA1c history?');
    expect(answer.followups.length).toBeGreaterThan(0);
    for (const followup of answer.followups) {
      const next = await source.askMemory(followup);
      expect(next.confidence).not.toBe('low');
    }
  });

  it('rejects an empty question', async () => {
    await expect(fresh().askMemory('   ')).rejects.toThrow(
      'Ask a question about the record.',
    );
  });
});

describe('mock patient record source: documents', () => {
  it('lists the four uploaded files, with insurance staying staff-only', async () => {
    const documents = await fresh().getDocuments();
    expect(documents.files).toHaveLength(4);
    expect(documents.files.map((f) => f.name)).toContain(
      'discharge-summary_LD_12jan2026.pdf',
    );
    const card = documents.files.find((f) =>
      f.name.startsWith('insurance-card'),
    );
    expect(card?.staffOnly).toBe(true);
    const lab = documents.files.find((f) => f.category === 'Lab report');
    expect(lab?.staffOnly).toBe(false);
  });

  it('reads six values off the outside report; shaky or filed ones are marked', async () => {
    const reading = await fresh().readOutsideReport();
    expect(reading.fileName).toBe('yashoda-kft_14mar2026.jpg');
    expect(reading.lab).toBe('Yashoda Hospital, Secunderabad');
    expect(reading.values.map((v) => v.test)).toEqual([
      'Serum creatinine',
      'Blood urea',
      'Serum potassium',
      'Serum sodium',
      'eGFR (CKD-EPI)',
      'Haemoglobin',
    ]);
    const sodium = reading.values.find((v) => v.id === 'sodium');
    expect(sodium?.confidence).toBe('low');
    const filed = reading.values.filter((v) => v.filed).map((v) => v.id);
    expect(filed).toEqual(['egfr', 'haemoglobin']);
  });

  it('files exactly what was ticked, attaches the photo, and logs the approver', async () => {
    const source = fresh();
    const reading = await source.readOutsideReport();
    const receipt = await source.fileExtractedValues({
      readingId: reading.id,
      approver: 'Dr. K. Ramesh',
      values: [
        { id: 'creatinine', value: '1.4' },
        { id: 'urea', value: '42' },
        { id: 'potassium', value: '4.6' },
      ],
    });
    expect(receipt.filedCount).toBe(3);
    expect(receipt.approver).toBe('Dr. K. Ramesh');
    expect(receipt.document.name).toBe('yashoda-kft_14mar2026.jpg');
    const documents = await source.getDocuments();
    expect(documents.files).toHaveLength(5);
    expect(documents.files[0].name).toBe('yashoda-kft_14mar2026.jpg');
  });

  it('refuses to file nothing, a value the report never had, or without an approver', async () => {
    const source = fresh();
    const reading = await source.readOutsideReport();
    const ok = [{ id: 'creatinine', value: '1.4' }];
    await expect(
      source.fileExtractedValues({
        readingId: reading.id,
        approver: 'Dr. K. Ramesh',
        values: [],
      }),
    ).rejects.toThrow('Nothing was ticked, so nothing was filed.');
    await expect(
      source.fileExtractedValues({
        readingId: reading.id,
        approver: 'Dr. K. Ramesh',
        values: [{ id: 'magnesium', value: '2' }],
      }),
    ).rejects.toThrow();
    await expect(
      source.fileExtractedValues({
        readingId: reading.id,
        approver: '',
        values: ok,
      }),
    ).rejects.toThrow('An approval needs the approver’s name.');
    await expect(
      source.fileExtractedValues({
        readingId: 'missing',
        approver: 'Dr. K. Ramesh',
        values: ok,
      }),
    ).rejects.toThrow();
    // Nothing leaked into the record from the refused attempts.
    expect((await source.getDocuments()).files).toHaveLength(4);
  });

  it('refuses to file the same report twice', async () => {
    const source = fresh();
    const reading = await source.readOutsideReport();
    const request = {
      readingId: reading.id,
      approver: 'Dr. K. Ramesh',
      values: [{ id: 'creatinine', value: '1.4' }],
    };
    await source.fileExtractedValues(request);
    await expect(source.fileExtractedValues(request)).rejects.toThrow(
      'That report was already filed.',
    );
    expect((await source.getDocuments()).files).toHaveLength(5);
  });

  it('takes a filing back on Undo: the photo leaves the record and the report can be filed again', async () => {
    const source = fresh();
    const reading = await source.readOutsideReport();
    const request = {
      readingId: reading.id,
      approver: 'Dr. K. Ramesh',
      values: [{ id: 'creatinine', value: '1.4' }],
    };
    await expect(source.withdrawFiling(reading.id)).rejects.toThrow(
      'That report was not filed.',
    );
    await source.fileExtractedValues(request);
    expect((await source.getDocuments()).files).toHaveLength(5);
    await source.withdrawFiling(reading.id);
    expect((await source.getDocuments()).files).toHaveLength(4);
    const again = await source.fileExtractedValues(request);
    expect(again.filedCount).toBe(1);
  });

  it('keeps a report as a document only, charting nothing', async () => {
    const source = fresh();
    const reading = await source.readOutsideReport();
    const receipt = await source.keepReportAsDocument(reading.id);
    expect(receipt.filedCount).toBe(0);
    expect((await source.getDocuments()).files).toHaveLength(5);
  });
});

describe('mock patient record source: family and consent', () => {
  it('lists the linked son, the consents and no pending request', async () => {
    const family = await fresh().getFamily();
    expect(family.links).toHaveLength(1);
    expect(family.links[0].name).toBe('Venkatesh Naidu');
    expect(family.links[0].access.every((g) => g.allowed)).toBe(true);
    expect(family.consents.map((c) => c.id)).toEqual(['whatsapp', 'abha']);
    expect(family.requests).toEqual([]);
  });

  it('turns the WhatsApp consent off and on, but never withdraws ABHA sharing for her', async () => {
    const source = fresh();
    const off = await source.setConsent('whatsapp', false);
    expect(off.enabled).toBe(false);
    expect((await source.getFamily()).consents[0].enabled).toBe(false);
    const on = await source.setConsent('whatsapp', true);
    expect(on.enabled).toBe(true);
    await expect(source.setConsent('abha', false)).rejects.toThrow(
      'That consent is changed by the patient herself.',
    );
    await expect(source.setConsent('nope', true)).rejects.toThrow();
  });

  it('invites a family member: pending until they confirm, with no access yet', async () => {
    const source = fresh();
    const link = await source.requestFamilyLink({
      name: 'Padma Naidu',
      relation: 'Daughter-in-law',
      phone: '+91 90000 11122',
    });
    expect(link.status).toBe('invited');
    expect(link.access.every((g) => !g.allowed)).toBe(true);
    expect((await source.getFamily()).links).toHaveLength(2);
    await expect(
      source.requestFamilyLink({ name: ' ', relation: 'Son', phone: '1' }),
    ).rejects.toThrow('A name and a phone number are needed.');
  });

  it('logs a DPDP request with a reference and a due date seven days out', async () => {
    const source = fresh();
    const request = await source.requestDpdp('export', '');
    expect(request.kind).toBe('export');
    expect(request.ref).toBe('DPDP-2026-0447');
    expect(request.status).toBe('In progress');
    expect(request.dueOn).toBe('25 Jul 2026');
    const correction = await source.requestDpdp(
      'correction',
      'Please correct the date of birth',
    );
    expect(correction.ref).toBe('DPDP-2026-0448');
    expect(correction.note).toBe('Please correct the date of birth');
    expect((await source.getFamily()).requests).toHaveLength(2);
  });
});

describe('mock patient record source: patient view', () => {
  it('lists seven categories and structurally excludes the three that must never reach her', async () => {
    const view = await fresh().getPatientView();
    expect(view.categories).toHaveLength(7);
    const excluded = view.categories.filter((c) => c.excluded);
    expect(excluded.map((c) => c.label)).toEqual([
      'Doctor’s private notes',
      'Unvalidated results',
      'Internal AI drafts',
    ]);
    for (const c of excluded) {
      expect(c.visibleToPatient.tone).toBe('crit');
      expect(c.visibleToPatient.label).toMatch(/No|Not yet/);
    }
  });

  it('previews her app in her language, from recorded data only', async () => {
    const { app } = await fresh().getPatientView();
    expect(app.greeting).toContain('Lakshmi');
    expect(app.rows.map((r) => r.title)).toEqual([
      'Your next visit',
      'Your sugar report — 18 Jul',
      'Your medicines (3)',
      'Bills',
    ]);
    expect(app.withheld).toHaveLength(2);
  });
});

describe('mock patient record source: isolation', () => {
  it('returns copies: changing a result does not change the source', async () => {
    const source = fresh();
    const first = await source.getSnapshot();
    first.patient.name = 'Changed';
    first.problems.length = 0;
    const second = await source.getSnapshot();
    expect(second.patient.name).toBe('Lakshmi Devi');
    expect(second.problems).toHaveLength(4);
  });

  it('starts fresh each time the factory is called', async () => {
    const a = fresh();
    await a.actOnCareGap('gap-retinal');
    const b = fresh();
    const gap = (await b.getSnapshot()).careGaps.find(
      (g) => g.id === 'gap-retinal',
    );
    expect(gap?.done).toBeUndefined();
  });

  it('makes no network call, writes no browser storage and logs nothing', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const consoleSpies = (
      ['log', 'info', 'warn', 'error', 'debug'] as const
    ).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const source = fresh();
    await source.getSnapshot();
    await source.generateBrief();
    await source.getTimeline();
    await source.askMemory('Allergies?');
    const reading = await source.readOutsideReport();
    await source
      .fileExtractedValues({
        readingId: reading.id,
        approver: 'Dr. K. Ramesh',
        values: [{ id: 'creatinine', value: '1.4' }],
      })
      .catch(() => undefined);
    await source.getFamily();
    await source.getPatientView();
    await source.getSnapshot('unknown-id').catch(() => undefined);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});
