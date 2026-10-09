import type { BankEntry } from './mock-util';
import type { BpReading, ChatReply, HistoryOverview } from './types';

// Invented sample data, from the prototype page (os/public/03-doctor.html, HM_BANK). Every answer
// states what the record contains and where it came from, and none says what to do about it. The
// prototype's bank was repaired so the memory answers with the current record (the Yashoda KFT of
// 14 Mar 2026, the 21 Jun visit); causal language is gone, so it states two facts and asks.

export function seedHistory(): HistoryOverview {
  return {
    patient: { token: 'T-12', name: 'Lakshmi Devi', ageSex: '58F' },
    indexedNote:
      '✦ 4 years of Lakshmi Devi’s record indexed — 6 OPD visits, 1 admission, 9 lab reports, pharmacy refills. Tap a question or type your own.',
    suggestions: [
      'What is her kidney function?',
      'What does she pay each month?',
      'Is she overdue for any tests?',
      'When was her last HbA1c?',
      'Any admissions?',
    ],
    bp: seedBp(),
  };
}

function seedBp(): BpReading[] {
  return [
    { visit: 'Jul 2024', systolic: 142, diastolic: 86 },
    { visit: 'Jan 2025', systolic: 144, diastolic: 88 },
    { visit: 'Jul 2025', systolic: 146, diastolic: 88 },
    { visit: '21 Jun 2026', systolic: 146, diastolic: 90 },
    { visit: 'Today', systolic: 148, diastolic: 92 },
  ];
}

function entry(
  keywords: string[],
  text: string,
  source: string,
  followups: string[],
): BankEntry {
  return { keywords, reply: { text, source, followups } };
}

export const HISTORY_BANK: BankEntry[] = [
  entry(
    ['bp', 'blood pressure', 'pressure', 'changed'],
    'Systolic BP has sat **above target for two years** and has not really moved: Jul’24 **142** → Jan’25 **144** → Jul’25 **146** → 21 Jun’26 **146/90** → today **148/92**. Flat, not rising, and above the 140/90 reference throughout. Telmisartan 40mg has been running since Jan 2023, with a **12-day dispense gap in May 2026**.',
    '6 OPD visits, Jul 2024 – Jul 2026 · pharmacy dispense history',
    ['Any medication adherence concerns?', 'When was her last HbA1c?'],
  ),
  entry(
    ['hba1c', 'a1c', 'glycemic', 'glycaemic'],
    'HbA1c is **8.4% today**, resulted this morning. Before that: **8.1% on 21 Jun 2026**, and **7.1% in 2022**, her best. Against the general adult target of below 7%.\nOne caution about the interval rather than about her: today’s value and the 21 Jun value are **27 days apart**, and an HbA1c reflects roughly 90 days of red cells, so the two readings overlap for most of their span.',
    'lab reports 12 Mar 2022, 21 Jun 2026, 18 Jul 2026',
    ['Is she overdue for any tests?', 'What is her kidney function?'],
  ),
  entry(
    ['kidney', 'renal', 'egfr', 'creatinine', 'kft', 'ckd'],
    '**eGFR 44 mL/min/1.73m²**, with creatinine 1.4 — from a KFT at **Yashoda Hospital, Secunderabad on 14 Mar 2026**, which reached us through her ABHA consent and not through an order of ours. **126 days ago.** The reading before it was **62, in January 2025**. There has been **no repeat here**, and **no urine ACR since Jan 2025**.\nHer problem list here carries CKD stage 3a, entered from that single outside result. She is on Metformin 1000mg BD, and the licensed label caps the maximum daily dose below eGFR 45. **I am telling you the values and the label band. I am not telling you what to do about them.**',
    'KFT Yashoda 14 Mar 2026 (ABHA) · KFT here Jan 2025 · her Rx since Mar 2024',
    ['Is she overdue for any tests?', 'What does she pay each month?'],
  ),
  entry(
    [
      'admission',
      'admissions',
      'admitted',
      'hospitalised',
      'hospitalized',
      'ipd',
    ],
    '**One admission** — 3 days in **Aug 2023** for hyperglycaemia (RBS 388 mg/dL with dehydration). Coded E11.65 + E86.0; the cashless claim on her Star Health policy cleared first time. **No admissions since.**',
    'IPD discharge summary, 21 Aug 2023',
    ['Summarise her last visit'],
  ),
  entry(
    ['last visit', 'summarise', 'summary', 'recent visit'],
    'Last visit **21 Jun 2026** — routine T2DM follow-up. BP **146/90**, weight 68.0 kg, monofilament reduced bilaterally. HbA1c **8.1%** resulted. Metformin 1000mg and Pregabalin continued. A **lipid profile was ordered that day and has never produced a result** — 27 days open, no sample logged.\nNothing in that note mentions the eGFR of 44, which had been in her record since 14 Mar.',
    'OPD visit note, 21 Jun 2026',
    ['Is she overdue for any tests?', 'What is her kidney function?'],
  ),
  entry(
    ['adherence', 'compliance', 'missed', 'refill', 'taking her', 'gap'],
    'Metformin has been collected on time every month. **Telmisartan has one gap: no dispense between 07 and 19 May 2026**, 12 days. Pregabalin on time.\nTwo other facts from the same weeks, offered without joining them up: on **06 May she paid ₹850** at the counter (a ₹400 consultation and a ₹450 HbA1c), and her weight has been **68 kg, unchanged for four years**. **The record shows a sequence. It cannot tell you a reason** — was the gap money, or memory? She can answer that; I cannot.',
    'pharmacy dispense history Aug 2025 – Jul 2026 · billing records May 2026',
    ['What does she pay each month?', 'What changed in her BP over 2 years?'],
  ),
  entry(
    ['pay', 'cost', 'money', 'afford', 'insurance', 'expensive', 'price'],
    'Her three lines cost **₹631 a month** at today’s pharmacy rates including GST — Metformin ₹161, Telmisartan ₹151, Pregabalin ₹319 (the brand she is dispensed; the generic would make it ₹420 in total).\n**All of it is out of pocket.** The Star Health policy on file was used for her Aug 2023 admission but **carries no OPD benefit**, and she is **not enrolled in Aarogyasri or PM-JAY**.\nAnd the thing that is genuinely missing: **cost is mentioned in none of her six consultation transcripts.** Nobody has asked her.',
    'pharmacy rates · her billed visits · the Star Health policy scan · her ABHA enrolment record',
    ['Any medication adherence concerns?'],
  ),
  entry(
    ['overdue', 'tests', 'due', 'screening', 'pending', 'missing'],
    'Four items are overdue, and one order is stuck:\n**Diabetic retinal screening — never**, in 4 years and 4 months since diagnosis.\n**Urine albumin (ACR) — Jan 2025**, 18 months.\n**Repeat KFT — none here since Jan 2025**; the only newer value is the outside one.\n**Serum B12 — never**, against 28 months of Metformin and an Hb of 11.2 falling from 12.8.\n**Lipid profile — ordered 21 Jun, no result**, no sample ever logged, 27 days open.\nAll four ordered today would cost her **₹1,660** out of pocket.',
    'her care-gap schedule · lab history · the open ServiceRequest of 21 Jun',
    ['What does she pay each month?', 'What is her kidney function?'],
  ),
  entry(
    ['allergy', 'allergies', 'penicillin', 'sulfa', 'reaction'],
    '**Penicillin** — flagged here in **2022** after a rash within a day of Amoxicillin. **Sulfa** also on file. Neither class appears in her current three lines.\nBut the flag is contradicted: **Apollo Clinic prescribed Amoxicillin 500mg on 02 Jan 2026** (seen via ABHA) and she reports no reaction. Either the flag is wrong or she never took the course. **Both entries are in the record and they cannot both be right** — and nobody has closed it.',
    'allergy flag 2022 · Apollo Clinic Rx 02 Jan 2026 (ABHA)',
    ['Any admissions?', 'Is she overdue for any tests?'],
  ),
];

export const HISTORY_FALLBACK: ChatReply = {
  text: 'I hold **4 years of Lakshmi Devi’s record** — 38 events across 6 OPD visits, 1 admission, 9 lab reports, her pharmacy refills, and **3 results from other hospitals pulled under her ABHA consent**. Ask about her **kidney function**, **HbA1c**, **BP trend**, **admissions**, **refill gaps**, **what she pays**, **allergies**, or **what is overdue**.',
  followups: ['What is her kidney function?', 'What does she pay each month?'],
};
