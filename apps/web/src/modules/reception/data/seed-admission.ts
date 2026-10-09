import type { AdmissionOverview, FanOutRecord, PayerOption } from './types';

// The prototype's admission case (02-reception.html, Admission): D. Prakash, a planned right total
// knee replacement. Invented, like every patient in the sample data.

export const PAYERS: PayerOption[] = [
  {
    id: 'star',
    label: 'Star Health — cashless TPA',
    chip: 'Star Health · cashless',
    policy: 'STAR/HYD/2024/778341',
    sum: '₹5,00,000 · family floater',
    code: 'TKR-SEMI-3N',
    split: [
      { label: 'Star Health pre-auth requested', amount: '₹1,52,000' },
      {
        label: 'Patient payable — items the policy excludes',
        amount: '₹25,500',
      },
      { label: 'Advance to collect now', amount: '₹20,000' },
      { label: 'Balance at discharge', amount: '₹5,500' },
    ],
    claim: 'Star Health pre-auth packet',
    claimNote:
      'Assembled from this form. IRDAI gives the insurer 1 hour on a pre-auth — but only from a COMPLETE request, so nothing is missing when it goes.',
  },
  {
    id: 'pmjay',
    label: 'PM-JAY',
    chip: 'PM-JAY · package rate',
    policy: 'PMJAY-TS-2019-4471203',
    sum: '₹5,00,000 per family per year',
    code: 'HBP-2.7.1 · Total knee replacement',
    split: [
      { label: 'PM-JAY package rate — HBP-2.7.1', amount: '₹1,45,000' },
      { label: 'Patient payable', amount: '₹0' },
      { label: 'Advance to collect now', amount: '₹0' },
      {
        label: 'Absorbed by the hospital vs the itemised estimate',
        amount: '₹32,500',
      },
    ],
    claim: 'PM-JAY TMS claim shell',
    claimNote:
      'Package is ₹32,500 below the itemised estimate and nothing is billable to the patient. Claim must reach the TMS portal within 3 days of discharge.',
  },
  {
    id: 'self',
    label: 'Self-pay',
    chip: 'Self-pay',
    policy: '—',
    sum: '—',
    code: 'TKR-SEMI-3N',
    split: [
      { label: 'Patient payable', amount: '₹1,77,500' },
      { label: 'Advance to collect now', amount: '₹50,000' },
      { label: 'Balance at discharge', amount: '₹1,27,500' },
    ],
    claim: 'No payer — nothing to claim',
    claimNote:
      'The estimate IS the bill, so the signed copy on the patient’s phone is the only dispute defence either side has.',
  },
];

export function seedAdmission(): AdmissionOverview {
  return {
    kpis: [
      {
        id: 'admissions',
        label: 'Admissions today',
        value: '3',
        delta: '2 planned · 1 from casualty',
      },
      {
        id: 'free-beds',
        label: 'Ward beds free',
        value: '12',
        delta: 'of 54 · 42 occupied',
      },
      {
        id: 'icu',
        label: 'ICU',
        value: '8 / 8',
        delta: 'at capacity — no ICU bed to allocate',
        trend: 'down',
        sentiment: 'crit',
      },
      {
        id: 'time-to-admit',
        label: 'Time to admit',
        value: '6 min',
        delta: 'median of 41 admissions since 01 Jul · paper pathway 24 min',
        trend: 'up',
        sentiment: 'good',
      },
    ],
    banner:
      'One pass, then it fans out. 24 fields and 4 consents are collected here once. The same 24 are what the paper pathway asks for five times — admission form, IPD case file, billing sheet, nursing admission chart, consent bundle.',
    request: {
      id: 'adm-prakash',
      when: "Planned admission · 18 Jul 2026, 10:47 AM · admitting doctor's OPD note already on file",
      dateChip: 'Sat 18 Jul 2026',
      patient: {
        name: 'D. Prakash',
        ageSex: '51 / M',
        abha: '91-6620-4417-8853',
        mrn: 'SVH-2024-03118',
        phone: '+91 94904 11827',
        address: 'Plot 44, Vivekananda Nagar, Kukatpally, Hyderabad 500072',
      },
      reason: {
        noteSource: "From today's OPD note · Dr. P. Anil Kumar",
        doctors: [
          'Dr. P. Anil Kumar — Orthopedics',
          'Dr. K. Ramesh — General Medicine',
          'Dr. Sunitha Rao — Gynecology',
        ],
        types: [
          'Planned — surgical',
          'Planned — medical',
          'Emergency / casualty',
          'Day care',
        ],
        diagnosis: 'Right knee osteoarthritis, grade IV',
        procedure: 'Right total knee replacement — Mon 20 Jul, 09:00 AM',
        stay: '3 nights',
      },
      payers: PAYERS.map((payer) => ({
        ...payer,
        split: payer.split.map((row) => ({ ...row })),
      })),
      eligibility: {
        title:
          'Policy verified — 4 terms that decide what Star Health will pay',
        terms: [
          {
            ok: true,
            text: 'Policy active, 3rd year · family floater',
            value: '₹5,00,000',
          },
          {
            ok: true,
            text: 'Available after ₹62,000 claimed by the family this year',
            value: '₹4,38,000',
          },
          {
            ok: true,
            text: 'Joint-replacement waiting period cleared (24 months; policy is 36)',
            value: 'cleared',
          },
          {
            ok: false,
            text: 'Room-rent sub-limit — a product sub-limit, lower than 1% of the sum insured',
            value: '₹4,000/day',
          },
        ],
        footer: 'Cashless · pre-auth before admission.',
      },
      bed: {
        wards: [
          {
            id: 'semi',
            label: 'Semi-private (2-bed) — ₹2,800/night',
            ratePerNight: 2800,
            available: true,
          },
          {
            id: 'general',
            label: 'General ward (6-bed) — ₹1,200/night',
            ratePerNight: 1200,
            available: true,
          },
          {
            id: 'private',
            label: 'Private room — ₹4,500/night',
            ratePerNight: 4500,
            available: true,
          },
          {
            id: 'icu',
            label: 'ICU — 8/8 occupied, unavailable',
            ratePerNight: 0,
            available: false,
          },
        ],
        beds: [
          { id: 'W-214', label: 'W-214 · free, cleaned 09:35 AM' },
          { id: 'W-207', label: 'W-207 · free, cleaned 08:10 AM' },
          { id: 'W-221', label: 'W-221 · free, cleaned 10:20 AM' },
        ],
        tariff: 'Class B — TPA schedule 2026',
        icuNote:
          "If this case needs post-op ICU, admission needs Dr. G. Prakash's approval first — the ICU is full and HOS will not let the bed board show a bed that does not exist.",
        nights: 3,
        subLimitPerDay: 4000,
        estimateTotal: 177500,
        nonPayable: 8000,
        pharmacy: 12000,
        baseRatePerNight: 2800,
      },
      attender: {
        name: 'K. Sujatha',
        relationship: 'Wife',
        phone: '+91 90142 76338',
      },
      consents: [
        {
          id: 'general',
          title: 'General consent to treatment',
          detail: 'Signed on the counter tablet · Telugu version read out',
        },
        {
          id: 'procedure',
          title: 'Procedure & anaesthesia consent',
          detail:
            'Right total knee replacement · countersigned by Dr. P. Anil Kumar',
        },
        {
          id: 'estimate',
          title: 'Estimate acknowledged by the patient',
          detail:
            'Patient and attender have seen the figure below and its ±10% band',
        },
        {
          id: 'dpdp',
          title: 'DPDP data consent — specific and revocable',
          detail:
            'Purpose: this admission and its billing. Revocable at the counter or on WhatsApp (DPDP Act 2023 · ADR #7)',
        },
      ],
      estimate: {
        lines: [
          { label: 'Surgeon + anaesthetist fees', amount: '₹54,000' },
          {
            label: 'Knee implant — cobalt-chrome, NPPA price-capped',
            amount: '₹76,000',
          },
          { label: 'OT + anaesthesia consumables · 2 h', amount: '₹18,500' },
          { label: 'Semi-private bed · 3 nights @ ₹2,800', amount: '₹8,400' },
          { label: 'Drugs & consumables', amount: '₹13,600' },
          { label: 'Physiotherapy · 5 sessions @ ₹450', amount: '₹2,250' },
          { label: 'Pre-op investigations + X-ray', amount: '₹4,750' },
        ],
        total: '₹1,77,500',
        note: 'The patient signs this figure and gets a copy on WhatsApp. Cost transparency at admission is a dispute reducer — most billing arguments start with a number nobody wrote down at the start.',
      },
      estimateDraft: {
        title: 'Estimate assembled — needs your sign-off',
        body: "Priced from the Class B TPA schedule and Dr. Anil Kumar's operative plan. Two items differ from the last 6 TKRs at this hospital: implant ₹76,000 (last 6 averaged ₹71,400 — this is the cemented cobalt-chrome model the surgeon asked for) and physiotherapy 5 sessions (protocol default is 4).",
        source:
          'Tariff master · TPA Class B schedule 2026 · last 6 TKR bills at this hospital · nothing is sent to the patient until you approve',
      },
      reuse: [
        {
          fact: 'Name, age, sex, address',
          source: 'ABHA, under consent',
          reusedIn:
            'IPD case file · billing header · nursing admission chart · consent forms · pre-auth packet',
        },
        {
          fact: 'ABHA + MRN',
          source: 'ABHA / master patient index',
          reusedIn:
            'IPD · billing · lab requisition barcodes · ABDM record push at discharge',
        },
        {
          fact: 'Mobile number',
          source: 'Registration, 12 Feb 2026',
          reusedIn:
            'WhatsApp updates · UPI advance link · discharge summary delivery',
        },
        {
          fact: 'Diagnosis + planned procedure',
          source: "Dr. Anil Kumar's OPD note, today",
          reusedIn:
            'IPD · OT list · pre-auth clinical justification · package selection · ICD coding',
        },
        {
          fact: 'Payer, policy number, package',
          source: 'Entered once, step 3',
          reusedIn:
            'Estimate · pre-auth · claim · cashless discharge clearance',
        },
        {
          fact: 'Bed + tariff class',
          source: 'Bed board, step 4',
          reusedIn:
            'Billing room rent · nursing worklist · housekeeping turnaround · diet order',
        },
        {
          fact: 'Attender name + mobile',
          source: 'Entered once, step 5',
          reusedIn:
            'Nursing next-of-kin · consent witness · discharge handover · WhatsApp updates',
        },
        {
          fact: 'Consent signatures',
          source: 'Counter tablet, step 6',
          reusedIn:
            'Consent bundle · hash-chained audit log · DPDP consent record (revocable)',
        },
      ],
    },
  };
}

export function fanOutRecords(
  payer: PayerOption,
  bedId: string,
): FanOutRecord[] {
  return [
    {
      workspace: 'IPD',
      record: 'Encounter IP-2026-0418',
      detail: `Bed ${bedId} · Dr. P. Anil Kumar · admitted 18 Jul 10:47 AM · expected 3 nights`,
    },
    {
      workspace: 'Billing',
      record: 'BILL-IP-2026-0418',
      detail:
        'Class B tariff live · room rent accruing · advance receipt posted',
    },
    { workspace: 'Claims', record: payer.claim, detail: payer.claimNote },
    {
      workspace: 'Nursing',
      record: 'Admission assessment queued',
      detail: `Fall-risk + pain assessment on ${bedId} for the 11:00 AM round · next of kin K. Sujatha (wife)`,
    },
    {
      workspace: 'Laboratory',
      record: 'Pre-op panel ordered',
      detail:
        'CBC, RBS, creatinine, PT/INR, HBsAg · barcodes printed at the counter',
    },
    {
      workspace: 'Operation Theatre',
      record: 'Provisional list — Mon 20 Jul 09:00',
      detail: 'Right TKR, 2 h, Dr. P. Anil Kumar · implant reserved from stock',
    },
  ];
}
