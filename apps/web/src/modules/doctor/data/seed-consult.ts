import type {
  ConsultationOverview,
  ConsultDraft,
  ReferenceCheck,
} from './types';

// Invented sample data, from the prototype page (os/public/03-doctor.html, data-panel="consult").
// Every value is already in the sample record; every line states what the record contains, and none
// states what the doctor should do (starting, stopping or changing a dose is RED tier, and not built).

export function seedConsultation(): ConsultationOverview {
  return {
    patient: { token: 'T-12', name: 'Lakshmi Devi', ageSex: '58F' },
    doctorName: 'Dr. K. Ramesh',
    room: 'Room 3',
    inRoomSince: '10:41 AM',
    briefing: {
      steps: [
        'Reading 6 prior visits…',
        'Reading last lab panel — 14 Jan 2026…',
        'Checking pharmacy dispense history…',
      ],
      facts: ['58F', 'T2DM since 2022', 'On Metformin', 'Last visit BP 150/94'],
      allergies: ['Penicillin'],
      warnings: ['HbA1c overdue'],
      source:
        'Compiled from 6 prior visits, last lab panel 14 Jan 2026, and pharmacy dispense history',
    },
    checkSteps: [
      'Reading her charted values for today…',
      'Pulling published reference ranges — HbA1c, eGFR, Hb, BP…',
      'Comparing each value against her own earlier ones…',
      'Cross-checking records for contradictions — allergy file, outside Rx, open orders…',
    ],
    checkIntro:
      'Her recorded values against published ranges, and against her own history. Alerts, never instructions — nothing here is a diagnosis and nothing changes a prescription.',
    scribe: {
      languageLabel: 'Telugu + English',
      consent:
        'Tell the patient the consultation is being recorded. This build simulates the recording: no microphone is used.',
      interim: [
        '“కాళ్ళలో తిమ్మిరి…” — tingling in both feet… two weeks…',
        'worse at night… disturbs her sleep…',
        '“చాలా దాహం, అలసట అనిపిస్తోంది” — thirst and fatigue…',
        'sugar checked last month… RBS around 214…',
        'BP 148 over 92… pulse 82…',
        '“మందు అప్పుడప్పుడు మిస్ అవుతుంది” — misses a dose sometimes…',
        'no chest pain… no breathlessness…',
      ],
      steps: [
        'Transcribing the Telugu + English consultation…',
        'Extracting symptoms & vitals…',
        'Checking drug interactions & allergies…',
        'Drafting S, O and A — the plan is yours…',
      ],
    },
  };
}

export function seedReferenceCheck(): ReferenceCheck {
  return {
    blocks: [
      {
        id: 'values',
        title: '1 · Her values beside published reference numbers',
        chip: 'Reference · your reading',
        chipTone: 'warn',
        text: [
          '**HbA1c 8.4%** today, beside the general adult target of **below 7%**.',
          '**eGFR 44 mL/min/1.73m²** (Yashoda, 14 Mar). The licensed metformin label bands renal function at **45–59** and **30–44**; her recorded value sits in the lower band. Her problem list here carries **CKD stage 3a**, entered from that same result.',
          '**Haemoglobin 11.2 g/dL**, beside the WHO reference of **12.0 g/dL** for adult women.',
          '**BP 148/92**, beside **below 140/90**.',
          'Each line is a number already in her chart placed next to a published number. **HOS is not interpreting any of them for you.**',
        ].join('\n'),
        why: [
          'Today’s HbA1c, Hb and BP are charted values; the eGFR came from another hospital through her ABHA consent.',
          'The ranges are the published adult reference numbers and the metformin label’s renal bands, as held in this hospital’s formulary.',
        ],
        sources:
          'her 4-year record here · KFT Yashoda 14 Mar 2026 (ABHA) · licensed metformin label · WHO haemoglobin reference',
        actionLabel: 'Attach this table to today’s note',
        actionDone: 'Attached',
      },
      {
        id: 'trajectory',
        title: '2 · Her values beside her own earlier values',
        chip: 'Her trajectory',
        chipTone: 'warn',
        text: [
          '**HbA1c: 7.1% (2022) → 8.1% (21 Jun 2026) → 8.4% (today).** **eGFR: 62 (Jan 2025) → 44 (14 Mar 2026).** **Hb: 12.8 → 11.2.** **Weight 68 kg, unchanged across four years.**',
          'One note about the interval rather than about her: the 8.1% and the 8.4% are **27 days apart**, and an HbA1c reflects roughly **90 days** of red cells — so those two readings overlap for most of their span. That is a statement about what the interval can support. It is not a statement about her control.',
        ].join('\n'),
        why: [
          'Each earlier value is a dated result in her record; nothing is estimated.',
          'The interval note is arithmetic on two dates and the published life of a red cell.',
        ],
        sources:
          'lab reports 2022 – 2026 · KFT here Jan 2025 · KFT Yashoda 14 Mar 2026 (ABHA)',
        actionLabel: 'Open the 4-year trajectories',
        actionDone: 'Opened',
      },
      {
        id: 'contradictions',
        title: '3 · Contradictions between records we already hold',
        chip: '3 unresolved',
        chipTone: 'crit',
        text: [
          '**Dose against recorded renal function.** Metformin **1000mg BD since Mar 2024**. The licensed label caps the maximum daily dose below **eGFR 45**; her recorded value is **44**, and it has been in this record for **126 days**. HOS quotes the band and the value — **it does not compute a dose for her.**',
          '**Allergy recorded here, drug prescribed elsewhere.** Penicillin allergy on file since 2022, plus Sulfa. **Apollo Clinic prescribed Amoxicillin 500mg on 02 Jan 2026** (seen via ABHA) and she reports no reaction. Both entries are in the record. They cannot both be right.',
          '**Ordered, never resulted.** The **lipid profile ordered 21 Jun** has no sample logged against it — **27 days** open.',
        ].join('\n'),
        why: [
          'Each contradiction is two entries in her record that cannot both stand, shown side by side.',
          'No entry is judged right or wrong: that is for the doctor, and for her.',
        ],
        sources:
          'allergy flag 2022 · Apollo Clinic Rx 02 Jan 2026 (ABHA) · her Rx and dispense history here · open lipid order of 21 Jun',
        actionLabel: 'Take these to Case Discussion',
        actionDone: 'Carried over',
      },
    ],
    tierNote:
      'AMBER under ADR #7. Sources: her 4-year record here; the Yashoda KFT and the Apollo Rx pulled under her ABHA consent; the licensed drug labels in the formulary; published reference ranges. Every line above states what the record **contains**. None of them states what you should **do** — starting, stopping or changing a dose is RED tier, needs a CDSCO licence, and is not enabled in HOS.',
  };
}

export function seedConsultDraft(): ConsultDraft {
  return {
    subjective: {
      lang: 'te',
      text: '“రెండు వారాలుగా అలసట, ఎక్కువ దాహం అనిపిస్తోంది. కాళ్లలో జివ్వుమనే అనుభూతి కూడా ఉంది.”',
      gloss:
        'Patient reports fatigue and increased thirst over 2 weeks. Occasional tingling in both feet. Denies chest pain or breathlessness.',
    },
    objective: {
      lang: 'te',
      text: 'BP 148/92 mmHg · పల్స్ 82/నిమిషం · బరువు 68 కేజీలు · RBS 214 mg/dL',
      gloss:
        'BP 148/92 mmHg · Pulse 82/min · Weight 68 kg · Random blood sugar 214 mg/dL. Reduced sensation both soles on monofilament test.',
    },
    assessment: {
      lang: 'te',
      text: 'టైప్ 2 డయాబెటిస్ — HbA1c 8.4%; నరాల సమస్య (నవంబర్ 2025 నుంచి); బీపీ నియంత్రణలో లేదు',
      gloss:
        'Type 2 Diabetes Mellitus, HbA1c 8.4% today. Diabetic neuropathy, symptomatic. Hypertension, above target. Outside KFT of 14 Mar shows eGFR 44 — restated here because it is in her record, not because the Scribe drew a conclusion from it.',
    },
    sourceLine:
      'Transcribed from consult audio 10:41–10:44 AM · Telugu + English mixed speech · S and O are verbatim, A restates values already in her chart, P is yours',
    prescription: {
      lines: [
        {
          id: 'metformin',
          drug: 'Tab. Metformin 1000mg',
          dispensedAs:
            'dispensed as 2 × 500mg — the pharmacy stocks the 500mg tablet',
          dosageLocal: 'రోజుకు రెండు సార్లు — భోజనం తర్వాత',
          dosageEn: 'Twice daily after food',
          since: 'Mar 2024',
          duration: '30 days',
        },
        {
          id: 'telmisartan',
          drug: 'Tab. Telmisartan 40mg',
          dosageLocal: 'ఉదయం ఒకసారి — ఖాళీ కడుపుతో',
          dosageEn: 'Once in the morning, empty stomach',
          since: 'Jan 2023',
          duration: '30 days',
        },
        {
          id: 'pregabalin',
          drug: 'Cap. Pregabalin 75mg',
          dosageLocal: 'రాత్రి పడుకునే ముందు ఒకసారి',
          dosageEn: 'Once at night, before bed',
          since: 'Nov 2025',
          duration: '30 days',
        },
      ],
      allergyNote:
        '**Penicillin and Sulfa allergies on file** — no drug of either class appears in these three lines. Metformin–Telmisartan and Metformin–Pregabalin: **no interaction in either licensed label.** One thing the labels do say: **all three are renally handled, and her recorded eGFR is 44** (Yashoda, 14 Mar, via ABHA). HOS is quoting the labels and her value. **It has not chosen or ruled out any drug** — every line here is one already on her record.',
      costNote:
        'Sent to Lakshmi Devi’s number on file after approval. Her 30-day cost at today’s pharmacy rates is ₹631 — itemised under Orders & Rx → Prescription assistant.',
    },
  };
}

export const PRESCRIPTION_RECHECK =
  '✦ **Re-checked after edit** — the new durations are still clear of the Penicillin and Sulfa allergies, and the labels show no interaction between the three lines. Nothing was added or removed: only the durations you typed.';
