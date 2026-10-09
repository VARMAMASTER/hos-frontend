import type { NoteDraft, NoteRow, NotesOverview } from './types';

// Invented sample data, from the prototype page (os/public/03-doctor.html, data-panel="notes").
// The published figure (JAMA) is the one the prototype quotes; ours is a measured median per note.

export function seedNoteRows(): NoteRow[] {
  return [
    {
      id: 'naidu',
      patient: { token: 'T-10', name: 'Venkatesh Naidu', ageSex: '44M' },
      draftLabel: 'S · O · A ready',
      seenFor: 'Hypertension review',
      usuallyChange:
        'Nothing in the last 8 — your BP phrasing is already learned',
      state: 'ready',
    },
    {
      id: 'sarojini',
      patient: { token: 'T-03', name: 'K. Sarojini', ageSex: '61F' },
      draftLabel: 'S · O · A ready',
      seenFor: 'Thyroid follow-up',
      usuallyChange: 'You add the next TSH date — the draft now does it',
      state: 'ready',
    },
    {
      id: 'ghouse',
      patient: { token: 'T-07', name: 'Md. Ghouse', ageSex: '29M' },
      draftLabel: 'S · O · A ready',
      seenFor: 'Fever, day 4',
      usuallyChange:
        'You name the day of illness explicitly — learned, 11 times',
      state: 'ready',
    },
    {
      id: 'lakshmi',
      patient: { token: 'T-12', name: 'Lakshmi Devi', ageSex: '58F' },
      where: 'in room',
      draftLabel: 'S · O · A ready · P empty',
      seenFor: 'T2DM follow-up',
      usuallyChange: 'Cannot be signed — no plan has been spoken yet',
      state: 'blocked',
    },
  ];
}

export function seedNotesOverview(): Omit<NotesOverview, 'rows'> {
  return {
    doctorName: 'Dr. K. Ramesh',
    drafted: { withDraft: 14, completed: 14 },
    metrics: [
      {
        id: 'median',
        value: '2 min 10 s',
        label:
          'Median saved per note — measured on your own 412 notes as draft-shown to your-signature, against your typed notes before the Scribe',
      },
      {
        id: 'today',
        value: '30 min',
        label:
          'Back to you today — 14 notes × 2 min 10 s. Volume is what compounds, not the percentage',
      },
      {
        id: 'open',
        value: '0',
        label:
          'Notes still open when you left, last week. In January it was 17 — the change your family notices',
      },
      {
        id: 'published',
        value: '16.0 min',
        label:
          'Per 8 scheduled patient hours — the published independent figure, shown so you can check ours against it',
        source: 'JAMA, 1 Apr 2026 · 8,581 clinicians, 5 systems',
      },
    ],
    honestNote:
      '**What we will not tell you.** Vendors in this market advertise 1–2 hours a day saved. That figure is marketing; you would catch it by Friday, and then you would stop believing the rest of the screen. Ours is a measured median per note plus your own volume, and the published number beside it. **If the two ever disagree badly, trust the published one.**',
  };
}

export function seedNoteDrafts(): Record<string, NoteDraft> {
  return {
    naidu: {
      noteId: 'naidu',
      title:
        'Progress note — Venkatesh Naidu (T-10) · hypertension review · 18 Jul 2026, 10:06 AM',
      subjective: {
        lang: 'te',
        text: '“తలనొప్పి తగ్గింది. మాత్ర రోజూ వేసుకుంటున్నాను. ఉప్పు తగ్గించాను.”',
        gloss:
          'Headaches have settled since the last visit. Reports taking the tablet daily and has reduced salt. No chest pain, no breathlessness, no ankle swelling.',
      },
      objective: {
        lang: 'te',
        text: 'బీపీ 138/86 mmHg (కూర్చుని) · పల్స్ 76/నిమిషం · బరువు 79 కేజీలు',
        gloss:
          'BP 138/86 mmHg seated, repeated after 5 minutes: 136/84. Pulse 76/min regular. Weight 79 kg (was 81 kg in Apr). No pedal oedema.',
      },
      assessment: {
        lang: 'te',
        text: 'హైపర్‌టెన్షన్ — ప్రస్తుతం లక్ష్యానికి దగ్గరగా ఉంది',
        gloss:
          'Hypertension, now within target on the current regimen. Weight down 2 kg over 3 months. Restated from what you dictated and from his recorded readings — the Scribe formed no assessment of its own.',
      },
      plan: {
        lang: 'te',
        text: 'అదే మందు కొనసాగించండి · ఉప్పు తక్కువగా · 3 నెలల్లో రివ్యూ, KFT + లిపిడ్‌తో',
        gloss:
          '“Continue the same medicine, keep the salt low, review in three months with a KFT and lipid profile.” — your words at 10:09 AM, transcribed. The Scribe did not compose this and would not have.',
      },
      sourceLine:
        'Transcribed from consult audio 10:04–10:09 AM · Telugu + English · vitals pulled from the nurse’s charted entry at 09:58 AM · weight compared against his own Apr 2026 record',
    },
    sarojini: {
      noteId: 'sarojini',
      title:
        'Progress note — K. Sarojini (T-03) · thyroid follow-up · 18 Jul 2026, 09:22 AM',
      subjective: {
        lang: 'en',
        text: 'Feels less tired than at the last visit. Takes the thyroid tablet every morning, empty stomach. No palpitations.',
        gloss: '',
      },
      objective: {
        lang: 'en',
        text: 'BP 126/80 mmHg · Pulse 72/min · Weight 63 kg (was 64 kg in April).',
        gloss: '',
      },
      assessment: {
        lang: 'en',
        text: 'Hypothyroidism on replacement, symptoms improved — as you said at 09:25 AM.',
        gloss: '',
      },
      plan: {
        lang: 'en',
        text: '“Same tablet, same dose. Repeat the TSH in six weeks and see me with the report.” — your words at 09:26 AM, transcribed.',
        gloss: '',
      },
      sourceLine:
        'Transcribed from consult audio 09:20–09:26 AM · English with Telugu counselling · vitals from the nurse’s charted entry at 09:14 AM',
    },
    ghouse: {
      noteId: 'ghouse',
      title:
        'Progress note — Md. Ghouse (T-07) · fever, day 4 · 18 Jul 2026, 09:48 AM',
      subjective: {
        lang: 'en',
        text: 'Fever for four days, evening spikes, body aches. No cough, no rash, no bleeding. Day of illness: 4.',
        gloss: '',
      },
      objective: {
        lang: 'en',
        text: 'Temp 38.4 °C · BP 112/70 mmHg · Pulse 96/min. Dengue/malaria panel result attached.',
        gloss: '',
      },
      assessment: {
        lang: 'en',
        text: 'Febrile illness, day 4 — as you dictated; panel result is attached to the draft as recorded.',
        gloss: '',
      },
      plan: {
        lang: 'en',
        text: '“Plenty of fluids, come back tomorrow with the platelet count, earlier if the fever settles and he feels worse.” — your words at 09:51 AM, transcribed.',
        gloss: '',
      },
      sourceLine:
        'Transcribed from consult audio 09:44–09:51 AM · English with Telugu counselling · panel result from the lab, resulted 09:40 AM',
    },
  };
}
