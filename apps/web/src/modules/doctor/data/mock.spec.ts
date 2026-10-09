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

describe('mock doctor source: consultation', () => {
  it('opens on Lakshmi Devi, the patient in the room, with her briefing', async () => {
    const consult = await source.getConsultation();
    expect(consult?.patient).toEqual({
      token: 'T-12',
      name: 'Lakshmi Devi',
      ageSex: '58F',
    });
    expect(consult?.doctorName).toBe('Dr. K. Ramesh');
    expect(consult?.briefing.allergies).toEqual(['Penicillin']);
    expect(consult?.briefing.warnings).toContain('HbA1c overdue');
    expect(consult?.scribe.steps).toHaveLength(4);
  });

  it('has no chart prepared once another patient is opened', async () => {
    await source.startConsultation('T-14');
    expect(await source.getConsultation()).toBeNull();
  });

  it('runs the reference check: three blocks of facts, none of them an instruction', async () => {
    const check = await source.runReferenceCheck();
    expect(check.blocks.map((block) => block.id)).toEqual([
      'values',
      'trajectory',
      'contradictions',
    ]);
    for (const block of check.blocks) {
      expect(block.actionLabel.length).toBeGreaterThan(0);
      expect(block.sources.length).toBeGreaterThan(0);
      expect(block.text).not.toMatch(
        /\b(you should|I recommend|consider|prescribe|increase the dose)\b/i,
      );
    }
    expect(check.blocks[2].chipTone).toBe('crit');
  });

  it('records attaching a block, and refuses a dismissal with no reason', async () => {
    await expect(source.attachCheckBlock('values')).resolves.toBeUndefined();
    await expect(source.attachCheckBlock('nope')).rejects.toThrow(
      'That block is not part of this check.',
    );
    await expect(source.dismissCheckBlock('trajectory', '   ')).rejects.toThrow(
      'Say why you are dismissing this block.',
    );
    await expect(
      source.dismissCheckBlock('trajectory', 'Already reviewed'),
    ).resolves.toBeUndefined();
  });

  it('drafts the note with S, O and A, and never a plan', async () => {
    const draft = await source
      .getConsultation()
      .then(() => source.draftConsultNote());
    expect(draft.subjective.lang).toBe('te');
    expect(draft.subjective.gloss).toMatch(/fatigue/);
    expect(draft.assessment.gloss).toMatch(/eGFR 44/);
    expect(Object.keys(draft)).not.toContain('plan');
    expect(draft.prescription.lines.map((line) => line.drug)).toEqual([
      'Tab. Metformin 1000mg',
      'Tab. Telmisartan 40mg',
      'Cap. Pregabalin 75mg',
    ]);
    // A carry-forward: every line is already on her list, with the date she started it.
    for (const line of draft.prescription.lines) {
      expect(line.since).toMatch(/\d{4}/);
    }
    expect(draft.prescription.allergyNote).toMatch(/Penicillin and Sulfa/);
  });

  it('will not sign a note until the doctor has dictated a plan', async () => {
    const note = {
      subjective: 'Fatigue.',
      objective: 'BP 148/92.',
      assessment: 'T2DM.',
      plan: '   ',
    };
    await expect(source.signNote(note)).rejects.toThrow(
      'The note cannot be signed until you have dictated the plan.',
    );
    await expect(
      source.signNote({ ...note, plan: 'Review in two weeks.' }),
    ).resolves.toBeUndefined();
  });

  it('re-checks edited durations, and refuses a line with none', async () => {
    const text = await source.checkPrescription([
      { id: 'metformin', duration: '14 days' },
    ]);
    expect(text).toMatch(/Re-checked after edit/);
    await expect(
      source.checkPrescription([{ id: 'metformin', duration: ' ' }]),
    ).rejects.toThrow('Enter a duration for every line.');
    await expect(
      source.approvePrescription([{ id: 'metformin', duration: '' }]),
    ).rejects.toThrow('Enter a duration for every line.');
    await expect(
      source.approvePrescription([{ id: 'metformin', duration: '30 days' }]),
    ).resolves.toBeUndefined();
  });
});

describe('mock doctor source: progress notes', () => {
  it('lists the four notes the prototype awaits, with Lakshmi Devi blocked', async () => {
    const notes = await source.getNotes();
    expect(notes.rows.map((row) => [row.id, row.state])).toEqual([
      ['naidu', 'ready'],
      ['sarojini', 'ready'],
      ['ghouse', 'ready'],
      ['lakshmi', 'blocked'],
    ]);
    expect(notes.metrics.map((metric) => metric.value)).toEqual([
      '2 min 10 s',
      '30 min',
      '0',
      '16.0 min',
    ]);
  });

  it('opens a ready note with the plan the doctor spoke, and refuses a blocked one', async () => {
    const draft = await source.openNote('naidu');
    expect(draft.plan.gloss).toMatch(/Continue the same medicine/);
    await expect(source.openNote('lakshmi')).rejects.toThrow(
      'That note is not ready to open.',
    );
  });

  it('files a note once, and the row says so', async () => {
    const draft = await source.openNote('naidu');
    const note = {
      subjective: draft.subjective.text,
      objective: draft.objective.text,
      assessment: draft.assessment.text,
      plan: draft.plan.text,
    };
    await source.fileNote('naidu', note);
    const rows = (await source.getNotes()).rows;
    expect(rows.find((row) => row.id === 'naidu')?.state).toBe('filed');
    await expect(source.fileNote('naidu', note)).rejects.toThrow(
      'That note is not ready to file.',
    );
  });

  it('will not file a note whose plan is empty', async () => {
    await expect(
      source.fileNote('naidu', {
        subjective: 's',
        objective: 'o',
        assessment: 'a',
        plan: '  ',
      }),
    ).rejects.toThrow('The note cannot be filed until it has a plan.');
  });

  it('rejects a draft only with a reason', async () => {
    await expect(source.rejectNote('ghouse', ' ')).rejects.toThrow(
      'Say why you are rejecting this draft.',
    );
    await source.rejectNote('ghouse', 'Wrong patient');
    const rows = (await source.getNotes()).rows;
    expect(rows.find((row) => row.id === 'ghouse')?.state).toBe('rejected');
  });

  it('shows the consultation note as filed once the doctor signs it in the Consultation tab', async () => {
    await source.signNote({
      subjective: 's',
      objective: 'o',
      assessment: 'a',
      plan: 'Review in two weeks.',
    });
    const rows = (await source.getNotes()).rows;
    expect(rows.find((row) => row.id === 'lakshmi')?.state).toBe('filed');
  });
});

describe('mock doctor source: orders and prescriptions', () => {
  it('opens on the new order with only what the doctor already ordered ticked', async () => {
    const orders = await source.getOrders();
    expect(orders?.patient.name).toBe('Lakshmi Devi');
    expect(
      orders?.items.filter((item) => item.ordered).map((item) => item.id),
    ).toEqual(['hba1c', 'lipid']);
    expect(orders?.templates).toHaveLength(3);
    expect(orders?.dose.drug).toBe('Metformin');
  });

  it('never carries a dose for this patient: the dose is a field the doctor types', async () => {
    const orders = await source.getOrders();
    expect(JSON.stringify(orders)).not.toMatch(/"dose(Value|Suggestion)"/);
    expect(orders?.dose.note).toMatch(/does not put a number in the box/i);
  });

  it('has no chart for another patient', async () => {
    await source.startConsultation('T-14');
    expect(await source.getOrders()).toBeNull();
  });

  it('sends an order the doctor chose, and refuses an empty or unknown one', async () => {
    const receipt = await source.sendOrder({
      itemIds: ['hba1c', 'lipid'],
      admit: false,
    });
    expect(receipt.summary).toBe('HbA1c + Lipid profile');
    expect(receipt.admitFlagged).toBe(false);
    await expect(
      source.sendOrder({ itemIds: [], admit: false }),
    ).rejects.toThrow('Choose at least one item to order.');
    await expect(
      source.sendOrder({ itemIds: ['nope'], admit: false }),
    ).rejects.toThrow('One of those items is not on the order list.');
  });

  it('flags an admission with the order', async () => {
    const receipt = await source.sendOrder({ itemIds: ['kft'], admit: true });
    expect(receipt.admitFlagged).toBe(true);
  });

  it('saves a template, which then appears in the library, and needs a name', async () => {
    await expect(
      source.saveTemplate({
        name: ' ',
        specialty: 'General Medicine',
        itemIds: [],
      }),
    ).rejects.toThrow('Give the template a name.');
    const saved = await source.saveTemplate({
      name: 'Anaemia work-up',
      specialty: 'General Medicine',
      itemIds: ['b12'],
    });
    expect(saved.name).toBe('Anaemia work-up');
    const orders = await source.getOrders();
    expect(orders?.templates.map((template) => template.name)).toContain(
      'Anaemia work-up',
    );
  });

  it('records a dose only when the doctor typed one', async () => {
    await expect(source.recordDose('Metformin', '  ')).rejects.toThrow(
      'Type the dose yourself — HOS does not fill it.',
    );
    await expect(
      source.recordDose('Metformin', '500mg BD'),
    ).resolves.toBeUndefined();
  });

  it('queues the print sheet and prepares the voice note, and sends neither on its own', async () => {
    await expect(source.queuePrint()).resolves.toBeUndefined();
    await expect(source.prepareVoiceNote()).resolves.toBeUndefined();
  });
});

describe('mock doctor source: patient history', () => {
  it('opens on her indexed record with the five questions the prototype suggests', async () => {
    const history = await source.getHistory();
    expect(history?.patient.name).toBe('Lakshmi Devi');
    expect(history?.suggestions).toHaveLength(5);
    expect(history?.bp.map((reading) => reading.visit)).toEqual([
      'Jul 2024',
      'Jan 2025',
      'Jul 2025',
      '21 Jun 2026',
      'Today',
    ]);
  });

  it('answers from her record with the source visit, and offers follow-ups', async () => {
    const answer = await source.askHistory('What is her kidney function?');
    expect(answer.text).toMatch(/eGFR 44/);
    expect(answer.source).toMatch(/KFT Yashoda 14 Mar 2026/);
    expect(answer.followups.length).toBeGreaterThan(0);
  });

  it('never tells the doctor what to do about a value: it quotes the value and says so', async () => {
    const answer = await source.askHistory('What is her kidney function?');
    expect(answer.text).toMatch(/I am not telling you what to do about them/);
  });

  it('says what it can answer when the question is not in her record', async () => {
    const answer = await source.askHistory('What is the capital of Telangana?');
    expect(answer.text).toMatch(/I hold \*\*4 years of Lakshmi Devi/);
  });

  it('refuses an empty question, and has no chart for another patient', async () => {
    await expect(source.askHistory('   ')).rejects.toThrow(
      'Ask a question first.',
    );
    await source.startConsultation('T-14');
    expect(await source.getHistory()).toBeNull();
  });
});

describe('mock doctor source: referrals', () => {
  it('lists four recipients, none chosen, and last month’s referrals out', async () => {
    const referrals = await source.getReferrals();
    expect(referrals.recipients.map((recipient) => recipient.id)).toEqual([
      'neph',
      'ophth',
      'endo',
      'diet',
    ]);
    expect(referrals.out).toHaveLength(4);
    expect(
      referrals.out.filter((row) => row.reply.state === 'none'),
    ).toHaveLength(2);
  });

  it('drafts a letter for the recipient chosen, with six attachments and the sixth unticked', async () => {
    const letter = await source.draftReferralLetter('neph');
    expect(letter.id).toBe('neph');
    expect(letter.dear).toBe('Dear Dr. Sridevi,');
    expect(letter.attachments).toHaveLength(6);
    expect(letter.attachments.filter((item) => item.checked)).toHaveLength(5);
    await expect(source.draftReferralLetter('nobody')).rejects.toThrow(
      'That recipient is not on the list.',
    );
  });

  it('signs a letter with its attachments and the ask the doctor wrote, and refuses an empty ask', async () => {
    await expect(source.signReferral('neph', ['kft'], '  ')).rejects.toThrow(
      'The letter needs the question you are asking.',
    );
    await expect(
      source.signReferral('neph', ['kft'], 'Please see her this month.'),
    ).resolves.toBeUndefined();
    await expect(source.signReferral('nobody', [], 'x')).rejects.toThrow(
      'That letter is not drafted.',
    );
  });

  it('drafts the Telugu copy, and sends it only when approved', async () => {
    const copy = await source.draftTeluguCopy('neph');
    expect(copy.text.length).toBeGreaterThan(0);
    expect(copy.gloss).toMatch(/specialist/);
    await expect(source.approveTeluguCopy('neph')).resolves.toBeUndefined();
  });

  it('has no recipient list for the patient once another is opened', async () => {
    await source.startConsultation('T-14');
    const referrals = await source.getReferrals();
    expect(referrals.patient).toBeNull();
    expect(referrals.recipients).toEqual([]);
    expect(referrals.out).toHaveLength(4);
  });
});

describe('mock doctor source: coding & claims', () => {
  it('proposes six codes, each naming where it came from, none confirmed for the doctor', async () => {
    const coding = await source.getCoding();
    expect(coding?.codes.map((code) => code.code)).toEqual([
      'E11.40',
      'E11.65',
      'I10',
      'Z79.84',
      'N18.30',
      'D64.9',
    ]);
    for (const code of coding?.codes ?? []) {
      expect(code.origin.length).toBeGreaterThan(0);
    }
    expect(
      coding?.codes.find((code) => code.code === 'N18.30')?.confidence,
    ).toBe('needs-you');
    expect(
      coding?.codes.find((code) => code.code === 'D64.9')?.confidence,
    ).toBe('low');
  });

  it('never proposes a cause for the anaemia: a coded cause would be a diagnosis', async () => {
    const coding = await source.getCoding();
    const anaemia = coding?.codes.find((code) => code.code === 'D64.9');
    expect(anaemia?.origin).toMatch(/HOS will not pick one/);
  });

  it('approves the codes the doctor confirmed, and refuses none or unknown ones', async () => {
    await expect(source.approveCodes([])).rejects.toThrow(
      'Confirm at least one code first.',
    );
    await expect(source.approveCodes(['Z99.9'])).rejects.toThrow(
      'One of those codes is not on the list.',
    );
    await expect(
      source.approveCodes(['E11.40', 'I10']),
    ).resolves.toBeUndefined();
  });

  it('adds a code by hand, validated, and lists it as the doctor’s own', async () => {
    await expect(
      source.addManualCode({ code: 'banana', term: 'x' }),
    ).rejects.toThrow('Enter an ICD-10 code like E11.65.');
    await expect(
      source.addManualCode({ code: 'E78.5', term: ' ' }),
    ).rejects.toThrow('Enter the term for the code.');
    await expect(
      source.addManualCode({ code: 'I10', term: 'Hypertension' }),
    ).rejects.toThrow('That code is already on the list.');
    const added = await source.addManualCode({
      code: 'e78.5',
      term: 'Hyperlipidaemia, unspecified',
    });
    expect(added).toMatchObject({ code: 'E78.5', confidence: 'yours' });
    const coding = await source.getCoding();
    expect(coding?.codes.map((code) => code.code)).toContain('E78.5');
  });

  it('has no coding proposal for another patient', async () => {
    await source.startConsultation('T-14');
    expect(await source.getCoding()).toBeNull();
  });
});

describe('mock doctor source: AI insights', () => {
  it('analyses the last 30 days into three insights, each with an action the doctor approves', async () => {
    const overview = await source.getInsights();
    expect(overview.steps.length).toBeGreaterThan(0);
    const result = await source.analyzeInsights();
    expect(result.insights.map((insight) => insight.id)).toEqual([
      'neuropathy',
      'tuesday',
      'working',
    ]);
    for (const insight of result.insights) {
      expect(insight.action.label.length).toBeGreaterThan(0);
    }
    expect(result.footnote).toMatch(/not to management/);
  });

  it('draws two of the insights as charts', async () => {
    const { insights } = await source.analyzeInsights();
    expect(insights[0].chart?.bars.map((bar) => bar.value)).toEqual([14, 5, 9]);
    expect(insights[1].chart?.bars.length).toBeGreaterThan(2);
    expect(insights[2].chart).toBeUndefined();
  });

  it('acts on an insight only by an action it offers, and dismisses only with a reason', async () => {
    await expect(
      source.actOnInsight('neuropathy', 'template'),
    ).resolves.toBeUndefined();
    await expect(source.actOnInsight('neuropathy', 'nope')).rejects.toThrow(
      'That action is not on this insight.',
    );
    await expect(source.actOnInsight('nobody', 'template')).rejects.toThrow(
      'That insight is not on your list.',
    );
    await expect(source.dismissInsight('tuesday', ' ')).rejects.toThrow(
      'Say why you are dismissing this insight.',
    );
    await expect(
      source.dismissInsight('tuesday', 'Already handled'),
    ).resolves.toBeUndefined();
  });
});

describe('mock doctor source: case discussion', () => {
  it('lists nine facts with the value now first, and the two that came through ABHA', async () => {
    const discussion = await source.getDiscussion();
    expect(discussion?.facts).toHaveLength(9);
    expect(discussion?.facts.filter((fact) => fact.viaAbha)).toHaveLength(2);
    expect(discussion?.counts).toBe('9 facts · 4 sources · 2 hospitals');
    expect(discussion?.suggestions).toHaveLength(4);
  });

  it('has no case open for another patient', async () => {
    await source.startConsultation('T-14');
    expect(await source.getDiscussion()).toBeNull();
  });

  it('convenes three lenses that disagree and recommend nothing', async () => {
    const panel = await source.convenePanel();
    expect(panel.lenses.map((lens) => [lens.id, lens.tier])).toEqual([
      ['safety', 'amber'],
      ['cost', 'green'],
      ['gaps', 'amber'],
    ]);
    expect(panel.disagreements).toHaveLength(3);
    expect(panel.noRecommendation).toMatch(/No lens recommended an action/);
    for (const lens of panel.lenses) {
      expect(lens.questions.length).toBeGreaterThanOrEqual(3);
      expect(lens.paragraphs.join(' ')).not.toMatch(
        /\b(you should|I recommend|consider (reducing|stopping|increasing))\b/i,
      );
    }
  });

  it('writes only a note that the review happened, with no plan in it', async () => {
    const panel = await source.convenePanel();
    expect(panel.chartNote.text).toMatch(/No change to therapy recorded/);
    await expect(source.approveReviewNote()).resolves.toBeUndefined();
  });

  it('runs a check as a read-out and prepares a draft for approval, and sends nothing itself', async () => {
    const check = await source.runLensAction('safety', 'recheck');
    expect(check.title).toBe(
      'Interaction check re-run against all three lines',
    );
    expect(check.draft).toBeUndefined();
    const chase = await source.runLensAction('gaps', 'chase');
    expect(chase.draft?.title).toBe(
      'Draft: chase the lab on the 21 Jun lipid order',
    );
    await expect(source.runLensAction('gaps', 'nope')).rejects.toThrow(
      'That action is not on this lens.',
    );
    await expect(
      source.approveLensDraft('gaps', 'chase'),
    ).resolves.toBeUndefined();
    await expect(source.approveLensDraft('safety', 'recheck')).rejects.toThrow(
      'That action has no draft to approve.',
    );
  });

  it('answers a follow-up with evidence, and refuses to say what to do', async () => {
    const evidence = await source.askPanel(
      'Why do you call the eGFR unconfirmed?',
    );
    expect(evidence.tier).toBe('amber');
    expect(evidence.text).toMatch(/Because of three dates and nothing else/);
    const refusal = await source.askPanel(
      'What should I do about the Metformin?',
    );
    expect(refusal.tier).toBe('red');
    expect(refusal.text).toMatch(/I am not going to answer that/);
    expect(refusal.text).toMatch(/The decision is yours/);
    // It hands over the facts instead of an instruction.
    expect(refusal.text).toMatch(/eGFR 44/);
  });
});

describe('mock doctor source: my AI team', () => {
  it('shows six of the nine learned preferences, two of them off', async () => {
    const team = await source.getAiTeam();
    expect(team.sahayaka.preferences).toHaveLength(6);
    expect(
      team.sahayaka.preferences.filter((preference) => !preference.enabled),
    ).toHaveLength(2);
    expect(team.sahayaka.hiddenRunning + team.sahayaka.hiddenOff).toBe(3);
    expect(team.sandarbha.templates).toHaveLength(4);
  });

  it('switches a preference and keeps it switched, for an id it knows', async () => {
    await source.setPreference('telugu', false);
    let team = await source.getAiTeam();
    expect(
      team.sahayaka.preferences.find((preference) => preference.id === 'telugu')
        ?.enabled,
    ).toBe(false);
    await source.setPreference('telugu', true);
    team = await source.getAiTeam();
    expect(
      team.sahayaka.preferences.find((preference) => preference.id === 'telugu')
        ?.enabled,
    ).toBe(true);
    await expect(source.setPreference('nope', true)).rejects.toThrow(
      'That preference is not on your list.',
    );
  });

  it('records a correction only when the doctor wrote one', async () => {
    await expect(source.correctPreference('renal', '  ')).rejects.toThrow(
      'Say what it should do instead.',
    );
    await expect(
      source.correctPreference('renal', 'Name the hospital'),
    ).resolves.toBeUndefined();
  });

  it('forgets everything it learned, hidden preferences included', async () => {
    await source.forgetAllPreferences();
    const team = await source.getAiTeam();
    expect(
      team.sahayaka.preferences.every((preference) => !preference.enabled),
    ).toBe(true);
    expect(team.sahayaka.hiddenRunning).toBe(0);
    expect(team.sahayaka.hiddenOff).toBe(3);
  });

  it('drafts the TB recall without sending it, and sends it only on approval', async () => {
    const draft = await source.draftTbRecall();
    expect(draft.title).toBe('WhatsApp recall — 4 TB patients');
    await expect(source.approveTbRecall()).resolves.toBeUndefined();
  });

  it('answers a reference question, and refuses a diagnosis', async () => {
    const reference = await source.askSpecialty(
      'What does the metformin label say about renal function?',
    );
    expect(reference.tier).toBe('amber');
    expect(reference.source).toMatch(/licensed prescribing information/);
    const refusal = await source.askSpecialty(
      'Does Lakshmi Devi have kidney disease?',
    );
    expect(refusal.tier).toBe('red');
    expect(refusal.text).toMatch(/What I will not do is put those together/);
  });

  it('records the phrasebook, the template and the report, and rejects an unknown template', async () => {
    await expect(source.addToPhrasebook()).resolves.toBeUndefined();
    await expect(source.reportOverstep()).resolves.toBeUndefined();
    await expect(
      source.loadSpecialtyTemplate('t2dm-egfr'),
    ).resolves.toBeUndefined();
    await expect(source.loadSpecialtyTemplate('nope')).rejects.toThrow(
      'That template is not in the library.',
    );
  });
});
