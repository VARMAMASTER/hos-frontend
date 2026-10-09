import type { MemoryDraft, MemoryOverview } from './types';

// The patient-memory sample data: the four-year summary a clinician reads, and the Q&A bank behind
// "ask about this patient". Every answer quotes recorded values and names the records it came from.
// None of them says what will happen to her: that would be a prediction, and this panel is meant to
// save a doctor the minutes of reading, not to think for her.

export interface BankEntry {
  keywords: string[];
  text: string;
  sources: string;
  followups: string[];
}

export const MEMORY_BANK: readonly BankEntry[] = [
  {
    keywords: ['hba1c', 'sugar', 'glyc', 'diabet', 'history'],
    text: 'Eight HbA1c results on file since 2022: **7.1%** (Mar 22) · 7.4% (Sep 23) · 7.6% (Mar 24, dose raised) · 7.2% (Aug 25) · 7.8% (Dec 25) · 7.9% (Mar 26) · 8.1% (21 Jun 26) · **8.4% (18 Jul 26)**. All above the reference range of < 6.5%.',
    sources: 'Lab results · HbA1c ×8, 14 Mar 2022 – 18 Jul 2026',
    followups: ['Adherence gaps?', 'BP trend?'],
  },
  {
    keywords: ['bp', 'blood pressure', 'hypertens', 'telmisartan', 'trend'],
    text: 'Recorded since hypertension was entered in **Jan 2023** (156/96 then): 136/86 (Nov 24) · 138/88 (Oct 25) · **148/92 on 21 Jun 2026** · 146/90 on 18 Jul. On Telmisartan 40mg throughout; a home BP diary was advised in June.',
    sources: 'OPD visit notes · Jan 2023 – 18 Jul 2026',
    followups: ['Any admissions?', 'Adherence gaps?'],
  },
  {
    keywords: ['adher', 'refill', 'missed', 'compliance', 'gap'],
    text: 'One gap on the pharmacy record: the **May 2026 Telmisartan refill was collected 12 days late** (the strip would have run out 30 Apr, dispensed 12 May). Metformin and Pregabalin refills are all on time, and her weight is stable.',
    sources: 'Pharmacy dispensing records · 12 May 2026 · batch TLM-2605A',
    followups: ['HbA1c history?'],
  },
  {
    keywords: ['admiss', 'ipd', 'admit', 'hospitalis', 'inpatient'],
    text: '**One admission**: 09–12 Jan 2026, hyperglycemia (RBS **412 mg/dL**) via casualty. 3 days on Bed G-14, insulin sliding scale, nurse Mary Grace, discharged stable on oral agents. Bill ₹18,640, of which Star Health approved ₹14,200.',
    sources:
      'IPD admission 09 – 12 Jan 2026 · discharge summary · IPD invoice SVH/25-26/0912',
    followups: ['HbA1c history?', 'Allergies?'],
  },
  {
    keywords: ['allerg', 'penicillin', 'sulfa'],
    text: 'Two critical allergies, recorded at her first visit on **14 Mar 2022**: **Penicillin** and **Sulfa drugs**. Note the contradiction on her timeline: Apollo Clinic prescribed **Amoxicillin on 02 Jan 2026** (seen via ABHA) and she reports no reaction.',
    sources:
      'Allergy record 14 Mar 2022 · external consultation 02 Jan 2026 (Apollo Clinic, via ABHA)',
    followups: ['Any admissions?'],
  },
  {
    keywords: ['creatinine', 'kidney', 'renal', 'egfr'],
    text: 'Latest renal values are **not from here**: a KFT at **Yashoda Hospital, Secunderabad on 14 Mar 2026**, seen via ABHA: creatinine **1.4 mg/dL**, urea 42, **eGFR 44 mL/min/1.73m²**. Her last in-house creatinine was 0.9 mg/dL in Mar 2024.',
    sources:
      'Outside lab result 14 Mar 2026 (Yashoda Hospital, via ABHA) · in-house lab 18 Mar 2024',
    followups: ['Retinopathy screen done?'],
  },
  {
    keywords: [
      'outside',
      'abha',
      'other hospital',
      'external',
      'yashoda',
      'apollo',
      'uphc',
    ],
    text: '**3 outside records** are on her timeline, all pulled under her ABHA consent: **Yashoda Hospital** 14 Mar 2026 (KFT with eGFR 44, CBC), **Apollo Clinic Kukatpally** 02 Jan 2026 (consult + Amoxicillin Rx), **Govt. UPHC Kukatpally** 19 Nov 2025 (influenza vaccine). Filter the timeline by *Other hospitals · ABHA* to see only these.',
    sources:
      'ABHA records · Yashoda 14 Mar 2026, Apollo 02 Jan 2026, UPHC 19 Nov 2025',
    followups: ['Last creatinine?', 'Allergies?'],
  },
  {
    keywords: ['retino', 'eye', 'fundus', 'screen'],
    text: '**No retinopathy screen anywhere in the record**: 4 years on the diabetes register, no fundus exam logged here or in any linked record. Listed as a care gap on her Clinical Snapshot with a one-tap order.',
    sources:
      'All visit notes, orders and linked ABHA records, 2022 – 2026 · care-gap schedule',
    followups: ['HbA1c history?'],
  },
];

export const MEMORY_FALLBACK: BankEntry = {
  keywords: [],
  text: 'I’ve read all **39 events, 10 lab results and 1 discharge summary** for Lakshmi Devi (2022–2026), including **3 records from other hospitals via ABHA**, but I can’t find that in them. Ask me about her **HbA1c history**, **BP trend**, **adherence gaps**, **admissions**, **allergies**, **last creatinine** or **outside records**.',
  sources:
    '39 events · 10 lab results · 1 discharge summary · 3 outside records via ABHA',
  followups: [],
};

export function seedMemoryOverview(): MemoryOverview {
  return {
    suggestions: [
      'HbA1c history?',
      'BP trend?',
      'Adherence gaps?',
      'Outside records?',
      'Any admissions?',
      'Allergies?',
    ],
    askPlaceholder: 'Ask about Lakshmi Devi… e.g. last creatinine?',
  };
}

export function seedMemoryDraft(): MemoryDraft {
  return {
    id: 'memory-1',
    title: 'Four years in one glance',
    findings: [
      '**Diabetes recorded Mar 2022**: HbA1c 7.1% then, **8.4% on 18 Jul 2026**; Metformin raised to 1000mg BD in Mar 2024.',
      '**Hypertension since Jan 2023**: 148/92 on 21 Jun 2026, on Telmisartan 40mg throughout.',
      '**eGFR 44 from Yashoda Hospital, 14 Mar 2026** (via ABHA), recorded as CKD stage 3a; her 2024 creatinine was 0.9.',
      '**One admission, Jan 2026**: hyperglycemia (RBS 412), 3 days, Bed G-14, discharged stable on oral agents.',
      '**Adherence**: refills on time apart from a **12-day Telmisartan gap in May 2026**; weight 64.8 → 68.0 kg over four years.',
      '**Never done: retinopathy screen**: 4 years on the diabetes register, no fundus exam anywhere in the record.',
    ],
    sources:
      'Compiled from 39 events · 10 lab results · 1 discharge summary · 3 outside records via ABHA (2022 – 2026)',
  };
}
