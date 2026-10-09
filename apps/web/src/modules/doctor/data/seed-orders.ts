import type { OrderItem, OrdersOverview, OrderTemplate } from './types';

// Invented sample data, from the prototype page (os/public/03-doctor.html, data-panel="orders").
// The chips beside the items state a fact of the record (last done, never done), never a
// recommendation, and nothing is ticked that the doctor did not already order. The dose for this
// patient is not here and never will be: it is the one field the doctor types.

export function seedOrderItems(): OrderItem[] {
  return [
    {
      id: 'hba1c',
      group: 'lab',
      name: 'HbA1c',
      fact: { text: 'done today — 8.4%', tone: 'good' },
      ordered: true,
    },
    {
      id: 'lipid',
      group: 'lab',
      name: 'Lipid profile',
      fact: { text: 'ordered 21 Jun · no result', tone: 'warn' },
      ordered: true,
    },
    {
      id: 'kft',
      group: 'lab',
      name: 'Kidney function test (KFT)',
      fact: { text: 'none here since Jan 2025', tone: 'crit' },
      ordered: false,
    },
    {
      id: 'acr',
      group: 'lab',
      name: 'Urine albumin (ACR)',
      fact: { text: '18 months', tone: 'crit' },
      ordered: false,
    },
    {
      id: 'b12',
      group: 'lab',
      name: 'Serum vitamin B12',
      fact: { text: 'never', tone: 'neutral' },
      ordered: false,
    },
    { id: 'fbg', group: 'lab', name: 'Fasting blood glucose', ordered: false },
    { id: 'cbc', group: 'lab', name: 'CBC', ordered: false },
    {
      id: 'dengue',
      group: 'lab',
      name: 'Malaria / dengue panel',
      ordered: false,
    },
    {
      id: 'retina',
      group: 'imaging',
      name: 'Diabetic retinal screening',
      fact: { text: 'never in 4 yrs', tone: 'crit' },
      ordered: false,
    },
    {
      id: 'usg',
      group: 'imaging',
      name: 'USG abdomen — kidneys',
      ordered: false,
    },
    {
      id: 'xray',
      group: 'imaging',
      name: 'X-ray — knee, both sides',
      ordered: false,
    },
  ];
}

export function seedOrderTemplates(): OrderTemplate[] {
  return [
    {
      id: 't2dm',
      name: 'T2DM follow-up',
      labs: 'HbA1c, lipid profile, KFT, urine ACR',
      rx: 'Metformin, Telmisartan',
      doseNote: 'dose fields blank',
      uses: 142,
      specialty: 'General Medicine',
      itemIds: ['hba1c', 'lipid', 'kft', 'acr'],
    },
    {
      id: 'htn',
      name: 'Hypertension review',
      labs: 'KFT, lipid profile',
      rx: 'Telmisartan 40mg',
      uses: 98,
      specialty: 'General Medicine',
      itemIds: ['kft', 'lipid'],
    },
    {
      id: 'viral',
      name: 'Viral fever',
      labs: 'CBC, malaria/dengue panel',
      rx: 'Paracetamol, Amoxicillin-Clav 625mg',
      uses: 211,
      specialty: 'General Medicine',
      itemIds: ['cbc', 'dengue'],
    },
  ];
}

export function seedOrders(): Omit<OrdersOverview, 'items' | 'templates'> {
  return {
    patient: { token: 'T-12', name: 'Lakshmi Devi', ageSex: '58F' },
    allergyBanner:
      '**Allergies on file before you write: Penicillin** (recorded 2022 — rash within a day of Amoxicillin) **and Sulfa.** Neither class appears in her current three lines. One caveat you should know about the allergy itself: **Apollo Clinic prescribed Amoxicillin 500mg on 02 Jan 2026** (seen via ABHA) and she reports no reaction, so the flag and the outside record disagree. HOS is showing you both; it is not deciding which is correct.',
    formulary: [
      {
        id: 'metformin',
        cost: '₹161',
        costNote: '120 tabs incl. 12% GST',
        drug: 'Tab. Metformin 500mg',
        tag: { text: 'in formulary', tone: 'neutral' },
        brand: '—',
        generic: '₹1.20',
        stock: { text: '420 tabs', tone: 'good' },
      },
      {
        id: 'telmisartan',
        cost: '₹151',
        costNote: '30 tabs incl. 12% GST',
        drug: 'Tab. Telmisartan 40mg',
        tag: { text: 'in formulary', tone: 'neutral' },
        brand: '—',
        generic: '₹4.50',
        stock: { text: '38 tabs · below reorder', tone: 'warn' },
      },
      {
        id: 'pregabalin',
        cost: '₹319',
        costNote: '30 caps of the brand she is dispensed',
        drug: 'Cap. Pregabalin 75mg',
        tag: { text: 'generic available', tone: 'ai' },
        brand: '₹9.50',
        generic: '₹3.20',
        stock: { text: 'both stocked', tone: 'good' },
      },
    ],
    formularyTotal: {
      cost: '₹631',
      costNote: 'her total, all out of pocket',
      note: 'Star Health policy on file — used for her Aug 2023 admission, **carries no OPD benefit**. Not enrolled in Aarogyasri or PM-JAY. Switching the Pregabalin line to the generic would move ₹631 → ₹420. **Which one she gets is your prescription, not ours.**',
    },
    dose: {
      drug: 'Metformin',
      defaults: '500mg / 850mg / 1000mg, usual maximum 2000mg/day',
      bands: 'eGFR 45–59, 30–44, below 30',
      note: '**Her recorded eGFR is 44.** HOS will tell you which band that is. It does not put a number in the box — a dose chosen for a named patient is a RED-tier action under the CDSCO SaMD framework, and HOS is not licensed for it.',
      label: {
        title: 'Metformin — the label, in full',
        bands: [
          {
            range: 'eGFR 45–59',
            text: 'mL/min/1.73m² — maximum daily dose restricted; monitor renal function every 3–6 months.',
          },
          {
            range: 'eGFR 30–44',
            text: 'maximum daily dose capped at half the usual maximum; do not initiate.',
          },
          { range: 'eGFR below 30', text: 'contraindicated.' },
        ],
        patientNote:
          'Her recorded eGFR of 44 (Yashoda Hospital, 14 Mar 2026, via ABHA) falls in the second band. She has been on 1000mg BD since March 2024, and that value has been in this record for 126 days.',
        disclaimer:
          'HOS quotes the band and the value. It does not compute a new dose for her — that is a prescribing decision, and under the CDSCO Software-as-a-Medical-Device framework a dose recommendation would make this software a licensed medical device.',
      },
    },
    printing: {
      teluguShare: 'you already do this on 92% of prescriptions',
      phrases: [
        {
          id: 'metformin',
          local:
            'మెట్‌ఫార్మిన్ — రోజుకు రెండు సార్లు, భోజనం తర్వాత. మాత్ర ఎప్పుడూ ఆపకండి, ముందు డాక్టర్‌ని అడగండి.',
          en: 'Metformin — twice a day, after food. Never stop the tablet without asking the doctor first.',
        },
        {
          id: 'telmisartan',
          local:
            'టెల్మిసార్టన్ — ఉదయం ఒకసారి, ఖాళీ కడుపుతో. మందు అయిపోయే ముందే మళ్లీ తీసుకోండి.',
          en: 'Telmisartan — once in the morning on an empty stomach. Collect the refill before the strip runs out.',
        },
      ],
    },
    sourcesNote:
      'Sources: this hospital’s formulary and live batch stock, the licensed prescribing information for each molecule, her allergy record, and the ABHA-linked Apollo Rx. **Time honesty:** across your last 40 prescriptions the assistant saved a median of **1 min 5 s** each — mostly the formulary and generic lookups you used to do in another tab. It saves nothing on the decision, because it does not make one.',
  };
}
