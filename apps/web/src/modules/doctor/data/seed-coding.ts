import type { CodingOverview } from './types';

// Invented sample data, from the prototype page (os/public/03-doctor.html, data-panel="coding").
// Coding is GREEN (ADR #7 names ICD coding): codes are stored beside the doctor's own local text from
// the first visit, because retro-coding a year of free text is not feasible. Each code names the line
// it came from, and a code that would be a diagnosis is left for the doctor.

export function seedCoding(): CodingOverview {
  return {
    patient: { token: 'T-12', name: 'Lakshmi Devi', ageSex: '58F' },
    doctorName: 'Dr. K. Ramesh',
    codes: [
      {
        code: 'E11.40',
        term: 'T2DM with diabetic neuropathy, unspecified',
        origin:
          'A: "diabetic neuropathy, symptomatic" · problem list since Nov 2025 · Pregabalin on the current list',
        confidence: 'high',
      },
      {
        code: 'E11.65',
        term: 'T2DM with hyperglycaemia',
        origin: 'O: RBS 214 mg/dL · HbA1c 8.4% resulted today',
        confidence: 'high',
      },
      {
        code: 'I10',
        term: 'Essential hypertension',
        origin:
          'Problem list since 2023 · Telmisartan 40mg on the current list',
        confidence: 'high',
      },
      {
        code: 'Z79.84',
        term: 'Long-term use of oral hypoglycaemic drugs',
        origin: 'Metformin dispensed continuously since Mar 2024',
        confidence: 'high',
      },
      {
        code: 'N18.30',
        term: 'Chronic kidney disease, stage 3 unspecified',
        origin:
          'From an outside KFT — eGFR 44, Yashoda Hospital, 14 Mar 2026, via ABHA. This code would be new on her problem list, entered here on the strength of another hospital’s single result.',
        confidence: 'needs-you',
      },
      {
        code: 'D64.9',
        term: 'Anaemia, unspecified',
        origin:
          'O: Hb 11.2 g/dL, falling from 12.8. No cause is documented anywhere in her record, and HOS will not pick one — a coded cause would be a diagnosis.',
        confidence: 'low',
      },
    ],
    notCoded:
      'Not coded: her 12-day Telmisartan gap and the unresolved lipid order. Neither has an ICD representation — they affect her care, not her claim.',
    whyNote:
      '**Why bother, on a self-pay OPD visit that bills nothing today?** Three reasons, and none of them is money this morning. Her problem list becomes correct. Her next admission’s package selection becomes defensible against a payer — her Aug 2023 admission was coded E11.65 + E86.0 and cleared first time. And the hospital can answer "how many CKD patients do you have" without a chart review. Codes are stored beside your own local text from the first visit because **retro-coding a year of free text is not feasible**, and India is moving toward package-based schemes where coding accuracy is existential.',
    metrics: [
      {
        id: 'before',
        value: '3 min 20 s',
        label: 'You used to spend this per note looking codes up',
      },
      {
        id: 'now',
        value: '25 s',
        label: 'You now spend this checking a proposal — your last 40 notes',
      },
      {
        id: 'wrong',
        value: '6 of 240',
        label:
          'Proposed codes that were wrong across those 40 notes. **You caught all six.** This is the number that matters more than the time',
      },
      {
        id: 'systematic',
        value: '1',
        label:
          'Systematic error found: it over-proposed E11.9 where E11.65 was right. Corrected 09 Jul; not seen since',
      },
    ],
  };
}
