import { seedPatient } from './seed-patient';
import type {
  BriefDraft,
  InteropTrace,
  PatientSnapshot,
  Trajectory,
} from './types';

// The clinical snapshot's sample data: what is wrong, what she is on, what changed, what is overdue.
// Everything here is a recorded event or a consistency check between records, never a prediction.

const INTEROP_PAYLOAD = `{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "DiagnosticReport",
        "status": "final",
        "code": { "text": "Kidney Function Test" },
        "subject": { "display": "Lakshmi Devi", "reference": "ABHA/91-4327-8810-4455" },
        "effectiveDateTime": "2026-03-14",
        "performer": [{ "display": "Yashoda Hospital, Secunderabad" }],
        "result": [{ "reference": "Observation/egfr-20260314" }]
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "egfr-20260314",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "62238-1", "display": "eGFR (CKD-EPI)" }] },
        "valueQuantity": { "value": 44, "unit": "mL/min/1.73m2" },
        "effectiveDateTime": "2026-03-14"
      }
    }
  ]
}`;

function seedInterop(): InteropTrace {
  return {
    title: 'How the Yashoda result actually got here',
    intro:
      'This is the real sequence for the 14 Mar 2026 KFT result that drives today’s Metformin dose alert, traced at the protocol level.',
    steps: [
      {
        id: 'health-id',
        title: 'Health ID resolved.',
        body: 'Her ABHA 91-4327-8810-4455 identifies her the same way to every participating facility, with no re-entering of demographics at Yashoda to match records.',
      },
      {
        id: 'consent-request',
        title: 'This hospital (the HIU) requests consent.',
        body: 'Sri Venkateshwara Hospital, as Health Information User, sends a scoped consent request through the ABDM Gateway. Scope: lab reports, date range Jan–Mar 2026.',
      },
      {
        id: 'patient-approves',
        title: 'She approves it in her own app.',
        body: 'Her Consent Manager (her ABHA app, not this hospital’s software) shows the request and issues a consent artefact naming the requester, the scope and an expiry, revocable by her at any time.',
      },
      {
        id: 'hip-responds',
        title: 'Yashoda Hospital (the HIP) responds.',
        body: 'As Health Information Provider, Yashoda’s system packages the KFT as a FHIR R4 Bundle (DiagnosticReport and Observation resources) and sends it, end-to-end encrypted, through the Gateway to this hospital.',
      },
      {
        id: 'reconcile',
        title: 'HOS ingests and reconciles.',
        body: 'The eGFR observation is matched to her existing record and tagged with its real source (“Yashoda Hospital, via ABHA”). It surfaces as the value that raised today’s Metformin alert, not re-typed by anyone.',
      },
    ],
    payloadNote:
      'Illustrative shape, trimmed for length: the same eGFR 44 value shown throughout this chart, not a literal captured network payload.',
    payload: INTEROP_PAYLOAD,
  };
}

function seedTrajectories(): Trajectory[] {
  return [
    {
      id: 'traj-hba1c',
      label: 'HbA1c',
      latest: '8.4%',
      direction: { tone: 'crit', label: 'Rising: 7.1 → 8.4 over 4 yrs' },
      target: 'target <7%',
      description: 'HbA1c rising from 7.1 to 8.4 percent over four years',
      unit: '%',
      points: [
        { label: 'Mar 2022', value: 7.1 },
        { label: 'Sep 2023', value: 7.4 },
        { label: 'Mar 2024', value: 7.6 },
        { label: 'Aug 2025', value: 7.2 },
        { label: 'Dec 2025', value: 7.8 },
        { label: 'Mar 2026', value: 7.9 },
        { label: 'Jun 2026', value: 8.1 },
        { label: 'Jul 2026', value: 8.4 },
      ],
    },
    {
      id: 'traj-egfr',
      label: 'eGFR',
      latest: '44',
      direction: { tone: 'crit', label: 'Falling: 78 → 44 · CKD 3a' },
      note: 'drives the Metformin alert',
      description: 'eGFR declining from 78 to 44',
      unit: 'mL/min/1.73m²',
      points: [
        { label: 'Mar 2022', value: 78 },
        { label: 'Sep 2023', value: 74 },
        { label: 'Mar 2024', value: 69 },
        { label: 'Jan 2025', value: 62 },
        { label: 'Mar 2026', value: 44 },
      ],
    },
    {
      id: 'traj-sbp',
      label: 'Systolic BP',
      latest: '146',
      direction: { tone: 'warn', label: 'Above target since 2023' },
      target: 'target <140',
      description: 'Systolic BP between 136 and 156 since 2023, latest 146',
      unit: 'mmHg',
      points: [
        { label: 'Jan 2023', value: 156 },
        { label: 'Nov 2024', value: 136 },
        { label: 'Oct 2025', value: 138 },
        { label: 'Dec 2025', value: 142 },
        { label: 'Jun 2026', value: 148 },
        { label: 'Jul 2026', value: 146 },
      ],
    },
    {
      id: 'traj-hb',
      label: 'Haemoglobin',
      latest: '11.2',
      direction: { tone: 'warn', label: 'Falling: 12.8 → 11.2' },
      description: 'Haemoglobin slowly falling from 12.8 to 11.2',
      unit: 'g/dL',
      points: [
        { label: 'Mar 2022', value: 12.8 },
        { label: 'Sep 2023', value: 12.5 },
        { label: 'Mar 2024', value: 12.1 },
        { label: 'Dec 2025', value: 11.8 },
        { label: 'Mar 2026', value: 11.2 },
      ],
    },
    {
      id: 'traj-weight',
      label: 'Weight',
      latest: '68 kg',
      direction: { tone: 'good', label: 'Stable near 68 kg' },
      description: 'Weight stable near 68 kilograms',
      unit: 'kg',
      points: [
        { label: 'Nov 2024', value: 66.8 },
        { label: 'Aug 2025', value: 67.4 },
        { label: 'Dec 2025', value: 67.9 },
        { label: 'Jun 2026', value: 68.4 },
        { label: 'Jul 2026', value: 68 },
      ],
    },
  ];
}

export function seedSnapshot(): PatientSnapshot {
  return {
    patient: seedPatient(),
    lastVisit: '21 Jun 2026',
    eventCount: 39,
    vitals: {
      recordedOn: '18 Jul 2026',
      readings: [
        { id: 'weight', label: 'Weight', value: '68.0 kg' },
        {
          id: 'bp',
          label: 'Blood pressure',
          value: '146/90',
          flag: { tone: 'warn', label: 'Above target' },
        },
        { id: 'pulse', label: 'Pulse', value: '78' },
        { id: 'spo2', label: 'SpO₂', value: '97%' },
      ],
    },
    problems: [
      {
        id: 'prob-t2dm',
        name: 'Type 2 diabetes',
        since: '2022',
        control: { tone: 'crit', label: 'HbA1c 8.4% — above target' },
      },
      {
        id: 'prob-htn',
        name: 'Hypertension',
        since: '2023',
        control: { tone: 'warn', label: '148/92 on 21 Jun' },
      },
      {
        id: 'prob-neuropathy',
        name: 'Diabetic neuropathy',
        since: '2025',
        control: { tone: 'neutral', label: 'Symptomatic' },
      },
      {
        id: 'prob-ckd',
        name: 'CKD stage 3a',
        since: '2026',
        note: 'newly relevant — see alert',
        control: { tone: 'warn', label: 'eGFR 44' },
      },
    ],
    medications: [
      {
        id: 'med-metformin',
        name: 'Metformin',
        dose: '1000mg BD',
        since: 'Mar 2024',
        refills: { tone: 'good', label: 'On time' },
      },
      {
        id: 'med-telmisartan',
        name: 'Telmisartan',
        dose: '40mg OD',
        since: 'Jan 2023',
        refills: { tone: 'warn', label: '12-day gap in May' },
      },
      {
        id: 'med-pregabalin',
        name: 'Pregabalin',
        dose: '75mg HS',
        since: 'Nov 2025',
        refills: { tone: 'good', label: 'On time' },
      },
    ],
    attention: [
      {
        id: 'attn-metformin-renal',
        title: 'Metformin dose vs renal function.',
        detail:
          'She is on Metformin 1000mg BD, but her eGFR fell to 44 on 14 Mar (was 62). The label caps the dose below eGFR 45.',
        sources: 'Rx 21 Jun · KFT 14 Mar',
        referenceAlert: true,
      },
      {
        id: 'attn-allergy-conflict',
        title: 'Allergy recorded, drug prescribed elsewhere.',
        detail:
          'Penicillin allergy is on file here, but Apollo Clinic prescribed Amoxicillin 500mg on 02 Jan (seen via ABHA). She reports no reaction: the allergy may be mis-recorded, or she didn’t take it.',
        sources: 'allergy 2022 · external Rx 02 Jan 2026 (ABHA)',
      },
      {
        id: 'attn-open-order',
        title: 'Ordered, never resulted.',
        detail:
          'A lipid profile ordered 21 Jun has no result 27 days later. Either it wasn’t collected or the result never came back.',
        sources: 'ServiceRequest 21 Jun · no matching DiagnosticReport',
      },
    ],
    trajectories: seedTrajectories(),
    careGaps: [
      {
        id: 'gap-retinal',
        item: 'Diabetic retinal screening',
        lastDone: 'Never',
        status: { tone: 'crit', label: 'Overdue 4 yrs' },
        action: { kind: 'order', label: 'Order' },
      },
      {
        id: 'gap-foot',
        item: 'Foot examination',
        lastDone: 'Mar 2025',
        status: { tone: 'crit', label: 'Overdue 16 mo' },
        action: { kind: 'add-today', label: 'Add today' },
      },
      {
        id: 'gap-acr',
        item: 'Urine albumin (ACR)',
        lastDone: 'Jan 2025',
        status: { tone: 'crit', label: 'Overdue · CKD' },
        action: { kind: 'order', label: 'Order' },
      },
      {
        id: 'gap-lipid',
        item: 'Lipid profile',
        lastDone: 'Ordered 21 Jun',
        status: { tone: 'warn', label: 'No result' },
        action: { kind: 'chase', label: 'Chase' },
      },
      {
        id: 'gap-hba1c',
        item: 'HbA1c',
        lastDone: '18 Jul 2026',
        status: { tone: 'good', label: 'Current' },
      },
    ],
    outsideRecords: [
      {
        id: 'out-yashoda',
        facility: 'Yashoda Hospital, Secunderabad',
        dateLabel: '14 Mar 2026',
        summary: 'KFT (eGFR 44, the value driving today’s alert), CBC.',
        note: 'Already available; no need to repeat.',
        noteTone: 'good',
      },
      {
        id: 'out-apollo',
        facility: 'Apollo Clinic, Kukatpally',
        dateLabel: '02 Jan 2026',
        summary: 'Consultation + Rx Amoxicillin 500mg.',
        note: 'Conflicts with her Penicillin allergy — flagged above.',
        noteTone: 'crit',
      },
      {
        id: 'out-uphc',
        facility: 'Govt. UPHC Kukatpally',
        dateLabel: '19 Nov 2025',
        summary: 'Immunisation record · influenza vaccine.',
      },
    ],
    interop: seedInterop(),
  };
}

// What each care-gap action says once it is done, keyed by gap id.
export const CARE_GAP_DONE: Readonly<Record<string, string>> = {
  'gap-retinal': 'Ordered — WhatsApp booking link sent to Lakshmi Devi',
  'gap-foot': 'Added to today’s visit',
  'gap-acr': 'Ordered — sample can be given at today’s visit',
  'gap-lipid':
    'Lab chased — no sample was logged against this order, likely never collected',
};

export function seedBrief(): BriefDraft {
  return {
    id: 'brief-1',
    title: 'What changed since 21 Jun 2026',
    paragraphs: [
      'Since 21 Jun her **HbA1c rose 8.1 → 8.4%** despite unchanged Metformin, and an outside KFT from Yashoda (14 Mar, via ABHA) shows **eGFR fallen to 44**. She has moved into **CKD stage 3a**, which her record here did not previously reflect.',
      'Three things need you today: the **Metformin 1000mg BD dose is above the label limit** below eGFR 45; Apollo prescribed **Amoxicillin in January despite a Penicillin allergy on file** (she reports no reaction; worth re-taking that history); and the **lipid profile ordered on 21 Jun never produced a result**.',
      'She is otherwise adherent: weight stable, refills on time apart from a **12-day Telmisartan gap in May**. Overdue: **retinal screening (never done)**, foot exam, urine ACR.',
    ],
    sources:
      'Assembled from 39 events across 4 years · 3 outside facilities via ABHA · every claim links to its source record',
  };
}
