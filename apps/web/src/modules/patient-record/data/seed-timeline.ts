import type { Flag, TimelineEvent, TimelineKind, TimelineYear } from './types';

// The longitudinal timeline's sample data: 39 recorded events across 2022 to 2026, 3 of them pulled
// from other hospitals under her ABHA consent. Every one is a recorded event; nothing is predicted.
// Newest first within a year.

interface Extra {
  flag?: Flag;
  facility?: string;
  note?: string;
  noteLang?: string;
}

function event(
  id: string,
  kind: TimelineKind,
  kindLabel: string,
  dateLabel: string,
  title: string,
  where: string,
  summary: string,
  extra: Extra = {},
): TimelineEvent {
  const year = Number(/\b(20\d{2})\b/.exec(dateLabel)?.[1]);
  return {
    id,
    kind,
    kindLabel,
    source: extra.facility ? 'ext' : 'in',
    year,
    dateLabel,
    title,
    where,
    summary,
    ...extra,
  };
}

const GM = 'General Medicine · Room 3 · Dr. K. Ramesh';
const LAB = 'Central Lab · reported by Prasad';
const LAB_VERIFIED = `${LAB} · verified by Dr. K. Ramesh`;
const PHARMACY = 'Pharmacy counter · Ravi Teja';
const HIGH = (label = 'High · ref < 6.5%'): Flag => ({ tone: 'warn', label });

function events2026(): TimelineEvent[] {
  return [
    event(
      'ev-2026-07-18-visit',
      'visit',
      'OPD visit',
      '18 Jul 2026 · 09:42 AM',
      'Neuropathy workup started — feet numb ×3 weeks',
      GM,
      'Monofilament test reduced bilaterally. Weight 68.0 kg, BP 146/90. Pregabalin continued.',
      {
        flag: { tone: 'neutral', label: 'Rx · 2 items' },
        note: 'Rx  Tab. Metformin 1000mg — రోజుకు రెండు సార్లు — భోజనం తర్వాత · Tab. Pregabalin 75mg — రాత్రి పడుకునే ముందు',
        noteLang: 'te',
      },
    ),
    event(
      'ev-2026-07-18-hba1c',
      'lab',
      'Lab result',
      '18 Jul 2026 · 10:04 AM',
      'HbA1c — 8.4%',
      LAB_VERIFIED,
      'Point-of-care analyser · sample collected 09:58 · ₹450 billed.',
      { flag: { tone: 'crit', label: 'High · ref < 6.5%' } },
    ),
    event(
      'ev-2026-07-18-invoice',
      'bill',
      'Billing',
      '18 Jul 2026 · 11:05 AM',
      'Invoice SVH/26-27/1184 — ₹1,240',
      'Billing desk · Swapna',
      'Consultation ₹400 · HbA1c ₹450 · pharmacy ₹390. Self-pay — Star Health policy not claimed for OPD.',
      { flag: { tone: 'good', label: 'Paid · UPI' } },
    ),
    event(
      'ev-2026-06-21-visit',
      'visit',
      'OPD visit',
      '21 Jun 2026 · 09:30 AM',
      'Routine T2DM + hypertension review',
      GM,
      'Three medicines renewed unchanged. Home BP diary advised. HbA1c and a lipid profile ordered the same morning.',
      { flag: { tone: 'warn', label: 'BP 148/92' } },
    ),
    event(
      'ev-2026-06-21-lipid',
      'lab',
      'Lab ordered',
      '21 Jun 2026 · 09:34 AM',
      'Lipid profile — no result on file',
      'Central Lab · ordered by Dr. K. Ramesh',
      'No sample was logged against this order and no report was ever returned. Surfaced on the Clinical Snapshot as an open loop.',
      { flag: { tone: 'crit', label: '27 days open' } },
    ),
    event(
      'ev-2026-06-21-hba1c',
      'lab',
      'Lab result',
      '21 Jun 2026 · 04:10 PM',
      'HbA1c — 8.1%',
      LAB_VERIFIED,
      'Released to her patient app the same evening.',
      { flag: HIGH() },
    ),
    event(
      'ev-2026-06-12-visit',
      'visit',
      'OPD visit',
      '12 Jun 2026 · 10:15 AM',
      'Palpitations reported — 12-lead ECG done',
      GM,
      'Sinus rhythm recorded, rate 84. No new finding entered in the note. Weight 68.4 kg.',
      { flag: { tone: 'neutral', label: 'ECG recorded' } },
    ),
    event(
      'ev-2026-06-12-ecg',
      'doc',
      'Document',
      '12 Jun 2026 · 10:40 AM',
      'ECG trace uploaded',
      'Reception · Swapna',
      'ecg-opd_12jun2026.pdf · 1.2 MB · full file on the Documents tab.',
    ),
    event(
      'ev-2026-05-12-telmisartan',
      'rx',
      'Pharmacy',
      '12 May 2026 · 06:05 PM',
      'Dispensed — Tab. Telmisartan 40mg ×30',
      PHARMACY,
      'Batch TLM-2605A · previous strip would have run out 30 Apr, a 12-day gap with no Telmisartan. Paid ₹142.',
      { flag: { tone: 'warn', label: '12 days late' } },
    ),
    event(
      'ev-2026-03-22-hba1c',
      'lab',
      'Lab result',
      '22 Mar 2026 · 12:40 PM',
      'HbA1c — 7.9%',
      LAB_VERIFIED,
      'Report on file as hba1c-report_22mar2026.pdf.',
      { flag: HIGH() },
    ),
    event(
      'ev-2026-03-17-teleconsult',
      'visit',
      'Teleconsult',
      '17 Mar 2026 · 04:20 PM',
      'Follow-up call on the Yashoda kidney result',
      'General Medicine · video consult · Dr. K. Ramesh',
      'Called after the eGFR 44 result came in from Yashoda three days earlier. Advised to avoid NSAIDs and stay well hydrated; the Metformin dose review was deferred to an in-person visit — a dose change like this isn’t permitted over teleconsultation under the Telemedicine Practice Guidelines, 2020.',
      {
        flag: { tone: 'neutral', label: 'Video call · 14 min' },
        note: 'Logged straight into this record: the same timeline as the Yashoda lab result and every in-person visit, not a separate telemedicine portal.',
      },
    ),
    event(
      'ev-2026-03-14-kft',
      'lab',
      'Lab result',
      '14 Mar 2026',
      'Kidney function test — eGFR 44',
      'not ordered by this hospital',
      'Serum creatinine 1.4 mg/dL · blood urea 42 mg/dL · eGFR 44 mL/min/1.73m². Same visit CBC: Hb 11.2 g/dL.',
      {
        flag: { tone: 'crit', label: 'Outside reference range' },
        facility: 'Yashoda Hospital, Secunderabad',
        note: 'Pulled under her ABHA consent on 19 Jul 2026. This is the value that put the Metformin dose above its label limit.',
      },
    ),
    event(
      'ev-2026-01-12-discharge',
      'doc',
      'Document',
      '12 Jan 2026 · 04:30 PM',
      'Discharge summary uploaded',
      'General Medicine · signed by Dr. K. Ramesh',
      'discharge-summary_LD_12jan2026.pdf · shared to her ABHA health locker · full file on the Documents tab.',
    ),
    event(
      'ev-2026-01-12-ipd-invoice',
      'bill',
      'Billing',
      '12 Jan 2026 · 05:10 PM',
      'IPD invoice SVH/25-26/0912 — ₹18,640',
      'Billing desk · insurance: Star Health',
      'Cashless claim ₹14,200 approved · patient paid ₹4,440 at discharge. 3 bed-days, pharmacy and lab itemised on the invoice.',
      { flag: { tone: 'good', label: 'Settled' } },
    ),
    event(
      'ev-2026-01-09-admission',
      'ipd',
      'IPD admission',
      '09 – 12 Jan 2026',
      'Hyperglycemia — 3 days · Bed G-14',
      'Casualty → General ward · nurse Mary Grace · Dr. K. Ramesh',
      'Admitted with RBS 412 mg/dL · insulin sliding scale · discharged stable on oral agents.',
      { flag: { tone: 'neutral', label: 'Bill ₹18,640' } },
    ),
    event(
      'ev-2026-01-02-apollo',
      'visit',
      'Consultation',
      '02 Jan 2026',
      'Fever & sore throat — Rx Amoxicillin 500mg',
      'general practice',
      'Prescribed 5 days of Amoxicillin, a penicillin, while a Penicillin allergy is on file here since 2022. She reports no reaction, so either the allergy is mis-recorded or the course was never taken.',
      {
        flag: { tone: 'crit', label: 'Allergy conflict' },
        facility: 'Apollo Clinic, Kukatpally',
      },
    ),
  ];
}

function events2025(): TimelineEvent[] {
  return [
    event(
      'ev-2025-12-18-visit',
      'visit',
      'OPD visit',
      '18 Dec 2025 · 10:20 AM',
      'Routine T2DM review',
      GM,
      'HbA1c ordered, all three medicines continued. Weight 67.9 kg, BP 142/88.',
      { flag: { tone: 'neutral', label: 'Rx · 3 items' } },
    ),
    event(
      'ev-2025-12-18-hba1c',
      'lab',
      'Lab result',
      '18 Dec 2025 · 11:05 AM',
      'HbA1c — 7.8%',
      LAB_VERIFIED,
      'Up from 7.2% in Aug 2025, the point where control starts slipping.',
      { flag: HIGH() },
    ),
    event(
      'ev-2025-11-19-flu',
      'visit',
      'Immunisation',
      '19 Nov 2025',
      'Seasonal influenza vaccine given',
      'public health centre',
      'Recorded on the national immunisation register and visible here without anyone re-entering it.',
      {
        flag: { tone: 'good', label: 'Immunisation' },
        facility: 'Govt. UPHC Kukatpally',
      },
    ),
    event(
      'ev-2025-11-12-visit',
      'visit',
      'OPD visit',
      '12 Nov 2025 · 09:40 AM',
      'Burning feet at night — neuropathy recorded',
      GM,
      'Symptoms ~2 months. Diabetic peripheral neuropathy added to the problem list; Pregabalin 75mg at night started.',
      { flag: { tone: 'neutral', label: 'New problem' } },
    ),
    event(
      'ev-2025-11-12-pregabalin',
      'rx',
      'Pharmacy',
      '12 Nov 2025 · 06:20 PM',
      'Dispensed — Cap. Pregabalin 75mg ×30',
      PHARMACY,
      'Batch PGB-2511C · first course · night-time dosing explained in Telugu.',
      { flag: { tone: 'good', label: 'Paid ₹210' } },
    ),
    event(
      'ev-2025-10-15-visit',
      'visit',
      'OPD visit',
      '15 Oct 2025 · 09:30 AM',
      'Hypertension follow-up',
      GM,
      'Telmisartan 40mg continued, salt restriction advised.',
      { flag: { tone: 'warn', label: 'BP 138/88' } },
    ),
    event(
      'ev-2025-09-28-lipid',
      'lab',
      'Lab result',
      '28 Sep 2025 · 11:15 AM',
      'Lipid profile',
      LAB,
      'LDL 132 mg/dL · triglycerides 178 mg/dL · statin discussed and deferred at that visit.',
      { flag: { tone: 'info', label: 'Borderline' } },
    ),
    event(
      'ev-2025-08-12-visit',
      'visit',
      'OPD visit',
      '12 Aug 2025 · 10:05 AM',
      'Diabetes & hypertension review',
      'General Medicine · Room 3 · dietician Anitha',
      'Diet counselling session recorded. Weight 67.4 kg.',
      { flag: { tone: 'neutral', label: 'Rx · 2 items' } },
    ),
    event(
      'ev-2025-08-12-hba1c',
      'lab',
      'Lab result',
      '12 Aug 2025 · 12:30 PM',
      'HbA1c — 7.2%',
      LAB,
      'Her best reading since the Metformin increase of Mar 2024.',
      { flag: HIGH() },
    ),
    event(
      'ev-2025-06-05-telmisartan',
      'rx',
      'Pharmacy',
      '05 Jun 2025 · 05:40 PM',
      'Dispensed — Tab. Telmisartan 40mg ×30',
      PHARMACY,
      'Batch TLM-2506B · refill collected on time.',
      { flag: { tone: 'good', label: 'Paid ₹142' } },
    ),
  ];
}

function events2024(): TimelineEvent[] {
  return [
    event(
      'ev-2024-11-20-visit',
      'visit',
      'OPD visit',
      '20 Nov 2024 · 09:55 AM',
      'Annual review — no new complaint recorded',
      GM,
      'Metformin 1000mg BD and Telmisartan 40mg continued. Weight 66.8 kg.',
      { flag: { tone: 'warn', label: 'BP 136/86' } },
    ),
    event(
      'ev-2024-07-20-metformin',
      'rx',
      'Pharmacy',
      '20 Jul 2024 · 06:00 PM',
      'Dispensed — Tab. Metformin 1000mg ×60',
      PHARMACY,
      'Batch MTF-2407A · 30-day supply at the new dose.',
      { flag: { tone: 'good', label: 'Paid ₹212' } },
    ),
    event(
      'ev-2024-03-18-hba1c',
      'lab',
      'Lab result',
      '18 Mar 2024 · 12:10 PM',
      'HbA1c — 7.6%',
      LAB,
      'Rising on Metformin 500mg BD. Serum creatinine that day 0.9 mg/dL.',
      { flag: HIGH() },
    ),
    event(
      'ev-2024-03-18-visit',
      'visit',
      'OPD visit',
      '18 Mar 2024 · 04:40 PM',
      'Metformin raised 500mg → 1000mg BD',
      GM,
      'Decision recorded against the same-day HbA1c of 7.6%. Serum creatinine was 0.9 mg/dL that day; the eGFR of 44 was measured two years later, in Mar 2026.',
      { flag: { tone: 'neutral', label: 'Dose changed' } },
    ),
  ];
}

function events2023(): TimelineEvent[] {
  return [
    event(
      'ev-2023-09-14-hba1c',
      'lab',
      'Lab result',
      '14 Sep 2023 · 11:30 AM',
      'HbA1c — 7.4%',
      LAB,
      'On Metformin 500mg BD.',
      { flag: HIGH() },
    ),
    event(
      'ev-2023-09-14-visit',
      'visit',
      'OPD visit',
      '14 Sep 2023 · 12:15 PM',
      'Six-month diabetes review',
      GM,
      'Both medicines continued. Weight 65.9 kg.',
      { flag: { tone: 'neutral', label: 'Rx · 2 items' } },
    ),
    event(
      'ev-2023-01-20-visit',
      'visit',
      'OPD visit',
      '20 Jan 2023 · 09:15 AM',
      'Hypertension recorded — 156/96 on two readings',
      GM,
      'Telmisartan 40mg once daily started. Home monitoring explained in Telugu.',
      { flag: { tone: 'warn', label: 'New problem' } },
    ),
    event(
      'ev-2023-01-20-telmisartan',
      'rx',
      'Pharmacy',
      '20 Jan 2023 · 05:05 PM',
      'Dispensed — Tab. Telmisartan 40mg ×30',
      PHARMACY,
      'Batch TLM-2301A · first course.',
      { flag: { tone: 'good', label: 'Paid ₹138' } },
    ),
  ];
}

function events2022(): TimelineEvent[] {
  return [
    event(
      'ev-2022-08-20-visit',
      'visit',
      'OPD visit',
      '20 Aug 2022 · 10:10 AM',
      'Five-month diabetes review',
      GM,
      'Metformin 500mg BD continued. Weight 64.8 kg, BP 128/80.',
      { flag: { tone: 'neutral', label: 'Rx · 1 item' } },
    ),
    event(
      'ev-2022-03-14-visit',
      'visit',
      'OPD visit',
      '14 Mar 2022 · 09:05 AM',
      'First visit — Type 2 diabetes recorded',
      'General Medicine · Room 3 · registered by Swapna · MRN SVH-2022-08114',
      'Presented with thirst and fatigue. Penicillin and Sulfa allergies recorded at this visit and carried on every prescription screen since.',
      { flag: { tone: 'crit', label: 'Allergies recorded' } },
    ),
    event(
      'ev-2022-03-14-hba1c',
      'lab',
      'Lab result',
      '14 Mar 2022 · 11:20 AM',
      'HbA1c — 7.1% · FBS 156 mg/dL',
      LAB,
      'The first HbA1c on record: the left-hand end of the trajectory on her Clinical Snapshot.',
      { flag: HIGH() },
    ),
    event(
      'ev-2022-03-14-metformin',
      'rx',
      'Pharmacy',
      '14 Mar 2022 · 12:40 PM',
      'Dispensed — Tab. Metformin 500mg ×60',
      PHARMACY,
      'Batch MTF-2203A · first course · dosing explained in Telugu.',
      { flag: { tone: 'good', label: 'Paid ₹96' } },
    ),
    event(
      'ev-2022-03-14-insurance',
      'doc',
      'Document',
      '14 Mar 2022 · 01:10 PM',
      'Insurance card scanned at registration',
      'Reception · Swapna',
      'insurance-card_LD_14mar2022.jpg · Star Health policy on file, the same card used for the Jan 2026 cashless claim.',
      { flag: { tone: 'neutral', label: 'JPG · 1.8 MB' } },
    ),
  ];
}

// Every event on the record, newest year first. A seed function, so each source owns its copy.
export function seedTimelineEvents(): TimelineEvent[] {
  return [
    ...events2026(),
    ...events2025(),
    ...events2024(),
    ...events2023(),
    ...events2022(),
  ];
}

interface YearNotes {
  blurb: string;
  preview: string[];
}

export const YEAR_NOTES: Readonly<Record<number, YearNotes>> = {
  2026: { blurb: '', preview: [] },
  2025: {
    blurb: '',
    preview: [
      '4 OPD visits · General Medicine',
      'HbA1c 7.2% → 7.8% over the year',
      'Neuropathy recorded · Pregabalin started',
      'Influenza vaccine · Govt. UPHC (ABHA)',
    ],
  },
  2024: {
    blurb: '2 visits, 1 lab report, 1 refill',
    preview: [
      'HbA1c 7.6% · Mar 2024',
      'Metformin raised 500mg → 1000mg BD',
      '1 pharmacy refill',
      'Annual review · Nov 2024',
    ],
  },
  2023: {
    blurb: '2 visits, 1 lab report, 1 new medicine',
    preview: [
      'Hypertension recorded · Jan 2023',
      'Telmisartan 40mg OD started',
      'HbA1c 7.4% · Sep 2023',
      '1 review visit',
    ],
  },
  2022: {
    blurb: 'where her record begins',
    preview: [
      'Registered 14 Mar 2022 · MRN issued',
      'T2DM recorded · HbA1c 7.1%',
      'Metformin 500mg BD started',
      'Penicillin & Sulfa allergies recorded',
    ],
  },
};

// The year summaries, with only the open year's events loaded.
export function summariseYears(
  all: TimelineEvent[],
  openYear: number,
): TimelineYear[] {
  const years = [...new Set(all.map((e) => e.year))].sort((a, b) => b - a);
  return years.map((year) => {
    const inYear = all.filter((e) => e.year === year);
    const notes = YEAR_NOTES[year] ?? { blurb: '', preview: [] };
    return {
      year,
      total: inYear.length,
      external: inYear.filter((e) => e.source === 'ext').length,
      blurb: notes.blurb,
      preview: notes.preview,
      events: year === openYear ? inYear : null,
    };
  });
}
