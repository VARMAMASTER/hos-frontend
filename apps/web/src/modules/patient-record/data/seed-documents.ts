import { seedPatient } from './seed-patient';
import type {
  DocumentsOverview,
  OutsideReading,
  PatientDocument,
} from './types';

// The documents tab's sample data: four files on record, and an outside paper report (a phone photo
// of a printed KFT) that HOS reads the values off. Extraction is transcription, not interpretation:
// the wording says what the page says and never what a value means.

export const READING_ID = 'reading-yashoda-kft';

export function seedFiles(): PatientDocument[] {
  return [
    {
      id: 'doc-discharge',
      name: 'discharge-summary_LD_12jan2026.pdf',
      format: 'PDF',
      category: 'Discharge',
      sizeLabel: '248 KB',
      uploadedOn: '12 Jan 2026',
      uploadedBy: 'Dr. K. Ramesh',
      staffOnly: false,
      preview: {
        heading: 'PDF preview',
        lines: [
          'Discharge summary · 2 pages · 248 KB',
          'Hyperglycemia admission · 09–12 Jan 2026 · Bed G-14',
          'Signed by Dr. K. Ramesh',
        ],
      },
    },
    {
      id: 'doc-hba1c',
      name: 'hba1c-report_22mar2026.pdf',
      format: 'PDF',
      category: 'Lab report',
      sizeLabel: '96 KB',
      uploadedOn: '22 Mar 2026',
      uploadedBy: 'Prasad (Lab)',
      staffOnly: false,
      preview: {
        heading: 'PDF preview',
        lines: [
          'HbA1c report · 1 page · 96 KB',
          'Result 7.9% (High · ref < 6.5%)',
          'Reported by Prasad · verified by Dr. K. Ramesh',
        ],
      },
    },
    {
      id: 'doc-ecg',
      name: 'ecg-opd_12jun2026.pdf',
      format: 'PDF',
      category: 'Diagnostic',
      sizeLabel: '1.2 MB',
      uploadedOn: '12 Jun 2026',
      uploadedBy: 'Swapna (Reception)',
      staffOnly: false,
      preview: {
        heading: 'PDF preview',
        lines: [
          '12-lead ECG · 1 page · 1.2 MB',
          'Recorded at OPD visit · 12 Jun 2026',
          'Uploaded by Swapna (Reception)',
        ],
      },
    },
    {
      id: 'doc-insurance',
      name: 'insurance-card_LD_14mar2022.jpg',
      format: 'JPG',
      category: 'ID / Insurance',
      sizeLabel: '1.8 MB',
      uploadedOn: '14 Mar 2022',
      uploadedBy: 'Swapna (Reception)',
      staffOnly: true,
      preview: {
        heading: 'Image preview',
        lines: [
          'Insurance card scan · JPG · 1.8 MB',
          'Star Health · policy on file',
          'Uploaded by Swapna (Reception) · 14 Mar 2022',
        ],
      },
    },
  ];
}

export function seedDocuments(): DocumentsOverview {
  return {
    patient: seedPatient(),
    files: seedFiles(),
    uploadLimits:
      'PDF, JPG, PNG up to 10 MB · attaches to Lakshmi Devi’s record · values are proposed, never filed automatically',
  };
}

export function seedReading(): OutsideReading {
  return {
    id: READING_ID,
    fileName: 'yashoda-kft_14mar2026.jpg',
    sizeLabel: '2.1 MB',
    uploadedOn: '19 Jul 2026',
    uploadedBy: 'Swapna (Reception)',
    lab: 'Yashoda Hospital, Secunderabad',
    reportDate: '14 Mar 2026',
    patientOnReport: 'Lakshmi Devi',
    values: [
      {
        id: 'creatinine',
        test: 'Serum creatinine',
        value: '1.4',
        unit: 'mg/dL',
        rangeLow: 0.6,
        rangeHigh: 1.1,
        rangeText: '0.6 – 1.1',
        confidence: 'high',
        source: 'page 1 · line 4',
      },
      {
        id: 'urea',
        test: 'Blood urea',
        value: '42',
        unit: 'mg/dL',
        rangeLow: 15,
        rangeHigh: 40,
        rangeText: '15 – 40',
        confidence: 'high',
        source: 'page 1 · line 5',
      },
      {
        id: 'potassium',
        test: 'Serum potassium',
        value: '4.6',
        unit: 'mmol/L',
        rangeLow: 3.5,
        rangeHigh: 5.1,
        rangeText: '3.5 – 5.1',
        confidence: 'high',
        source: 'page 1 · line 7',
      },
      {
        // The photo is blurred here, so the reader says so: it arrives unticked.
        id: 'sodium',
        test: 'Serum sodium',
        value: '138',
        unit: 'mmol/L',
        rangeLow: 135,
        rangeHigh: 145,
        rangeText: '135 – 145',
        confidence: 'low',
        source: 'page 1 · line 6 · blurred',
      },
      {
        // The ABHA pull already delivered this one, so it is proposed unticked rather than filed twice.
        id: 'egfr',
        test: 'eGFR (CKD-EPI)',
        value: '44',
        unit: 'mL/min/1.73m²',
        rangeLow: 90,
        rangeText: '> 90',
        confidence: 'high',
        source: 'page 1 · line 8',
        filed: true,
        filedSource: 'ABHA',
      },
      {
        id: 'haemoglobin',
        test: 'Haemoglobin',
        value: '11.2',
        unit: 'g/dL',
        rangeLow: 12,
        rangeHigh: 15,
        rangeText: '12.0 – 15.0',
        confidence: 'high',
        source: 'page 2 · line 2',
        filed: true,
        filedSource: 'ABHA',
      },
    ],
  };
}
