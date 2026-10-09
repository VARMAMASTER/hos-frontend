import type {
  PatientHeader,
  PatientViewOverview,
  ProfileOverview,
} from './types';

// Invented sample data, matching the prototype's patient record (os/public/04-patient-record.html).
// No real person, phone number or ABHA number. Every seed* function returns a fresh object, so each
// mock source starts clean and a change made through one never reaches another.

export const PATIENT_ID = 'pt-lakshmi-devi';

export function seedPatient(): PatientHeader {
  return {
    id: PATIENT_ID,
    name: 'Lakshmi Devi',
    initials: 'LD',
    age: 58,
    sex: 'Female',
    mrn: 'SVH-2022-08114',
    abha: '91-4327-8810-4455',
    allergies: [
      {
        id: 'allergy-penicillin',
        substance: 'Penicillin',
        recordedOn: '14 Mar 2022',
      },
      {
        id: 'allergy-sulfa',
        substance: 'Sulfa drugs',
        recordedOn: '14 Mar 2022',
      },
    ],
    clinician: 'Dr. K. Ramesh',
  };
}

export function seedProfile(): ProfileOverview {
  return {
    patient: seedPatient(),
    demographics: {
      dateOfBirth: '22 Aug 1967 (58y)',
      sex: 'Female',
      phone: '+91 98491 22310',
      bloodGroup: 'B+',
      address:
        'H.No. 4-6-112, Vivekananda Nagar, Kukatpally, Hyderabad – 500072',
      emergencyContact: {
        name: 'Venkatesh Naidu',
        relation: 'son',
        phone: '+91 90140 55231',
      },
      registeredOn: '14 Mar 2022',
      registeredBy: 'Swapna, Reception',
    },
    conditions: [
      {
        id: 'cond-t2dm',
        name: 'Type 2 Diabetes Mellitus',
        onset: 'Mar 2022',
        detail: 'managed by Dr. K. Ramesh',
        status: 'Active — HbA1c 8.4% on 18 Jul 2026',
      },
      {
        id: 'cond-htn',
        name: 'Hypertension',
        onset: 'Jan 2023',
        detail: 'managed by Dr. K. Ramesh',
        status: 'Active — on Telmisartan 40mg',
      },
      {
        id: 'cond-neuropathy',
        name: 'Diabetic peripheral neuropathy',
        onset: 'Nov 2025',
        detail: 'on Pregabalin 75mg HS · monofilament test reduced bilaterally',
        status: 'Active',
      },
      {
        id: 'cond-ckd',
        name: 'Chronic kidney disease, stage 3a',
        onset: 'Mar 2026',
        detail: 'from eGFR 44 at Yashoda Hospital (via ABHA)',
        status: 'Active — drives the Metformin dose alert',
        // Entered off another hospital's number: exactly what a doctor will want to verify.
        provenance:
          'Yashoda Hospital, Secunderabad · KFT 14 Mar 2026 · via ABHA',
      },
    ],
    vitals: {
      recordedOn: '18 Jul 2026',
      readings: [
        { id: 'height', label: 'Height', value: '152 cm' },
        { id: 'weight', label: 'Weight', value: '68 kg' },
        { id: 'bmi', label: 'BMI', value: '29.4' },
        { id: 'bp', label: 'BP baseline', value: '130/82' },
        { id: 'pulse', label: 'Pulse', value: '78' },
        { id: 'spo2', label: 'SpO₂', value: '97%' },
      ],
    },
    bmiCategory: 'Overweight',
  };
}

export function seedPatientView(): PatientViewOverview {
  const yes = { tone: 'good', label: 'Yes' } as const;
  const onRequest = { tone: 'good', label: 'ABHA · on request' } as const;
  return {
    patient: seedPatient(),
    categories: [
      {
        id: 'prescriptions',
        label: 'Prescriptions',
        hint: 'every Rx, in Telugu or English',
        visibleToPatient: yes,
        sharedOutside: onRequest,
        excluded: false,
      },
      {
        id: 'lab-reports',
        label: 'Lab reports',
        hint: 'released after the doctor validates',
        visibleToPatient: yes,
        sharedOutside: onRequest,
        excluded: false,
      },
      {
        id: 'bills',
        label: 'Bills & receipts',
        visibleToPatient: yes,
        sharedOutside: { tone: 'neutral', label: 'No' },
        excluded: false,
      },
      {
        id: 'discharge',
        label: 'Discharge summaries',
        visibleToPatient: yes,
        sharedOutside: onRequest,
        excluded: false,
      },
      {
        id: 'private-notes',
        label: 'Doctor’s private notes',
        hint: 'differentials, clinical reasoning',
        visibleToPatient: { tone: 'crit', label: 'No' },
        sharedOutside: { tone: 'crit', label: 'Never' },
        excluded: true,
      },
      {
        id: 'unvalidated',
        label: 'Unvalidated results',
        hint: 'still on the analyser',
        visibleToPatient: { tone: 'crit', label: 'Not yet' },
        sharedOutside: { tone: 'crit', label: 'No' },
        excluded: true,
      },
      {
        id: 'ai-drafts',
        label: 'Internal AI drafts',
        hint: 'before a human approves',
        visibleToPatient: { tone: 'crit', label: 'No' },
        sharedOutside: { tone: 'crit', label: 'Never' },
        excluded: true,
      },
    ],
    app: {
      greeting: 'Namaste, Lakshmi',
      subline: 'Sri Venkateshwara Hospital · ABHA linked',
      rows: [
        {
          id: 'next-visit',
          title: 'Your next visit',
          body: '01 Aug 2026, 10:30 AM · Dr. K. Ramesh',
          note: 'Please come fasting — a blood test is planned.',
        },
        {
          id: 'sugar-report',
          title: 'Your sugar report — 18 Jul',
          body: 'HbA1c 8.4%. Your doctor’s target for you is below 7%.',
          note: 'Plain-language explanation, in Telugu or English.',
        },
        {
          id: 'medicines',
          title: 'Your medicines (3)',
          body: 'Metformin · Telmisartan · Pregabalin',
          note: 'With a reminder if a refill is late.',
        },
        {
          id: 'bills',
          title: 'Bills',
          body: '₹1,240 paid on 18 Jul · receipt available',
        },
      ],
      withheld: [
        'Doctor’s clinical notes, AI drafts and unvalidated results are not shown here.',
        'She can revoke ABHA sharing, request a correction, or download everything — from this screen.',
      ],
    },
  };
}
