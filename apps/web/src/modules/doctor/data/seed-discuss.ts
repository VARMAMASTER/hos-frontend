import type { BankEntry } from './mock-util';
import { seedOrders } from './seed-orders';
import type {
  ChatReply,
  DiscussOverview,
  LensActionResult,
  PanelResult,
} from './types';

// Invented sample data, from the prototype page (os/public/03-doctor.html, data-panel="discuss").
// Three lenses read her record separately and their disagreement is the output, not a fake consensus.
// Every lens does exactly three things: states a value that is in the record, quotes a constraint
// published somewhere citable, or asks the doctor a question. None may advise, and there is no
// chairman who resolves them: the decision is the doctor's.

export function seedDiscussion(): DiscussOverview {
  return {
    patient: { token: 'T-12', name: 'Lakshmi Devi', ageSex: '58F' },
    doctorName: 'Dr. K. Ramesh',
    headline: 'Lakshmi Devi, 58F — what her record actually contains',
    summary:
      'T2DM since Mar 2022 · HTN since Jan 2023 · diabetic neuropathy since Nov 2025 · in Room 3 since 10:41 AM',
    counts: '9 facts · 4 sources · 2 hospitals',
    facts: [
      {
        id: 'egfr',
        value: '**eGFR 44** mL/min/1.73m²',
        before: '62 · Jan 2025',
        who: 'Yashoda Hospital',
        viaAbha: true,
        when: '14 Mar 2026',
      },
      {
        id: 'metformin',
        value: '**Metformin 1000mg BD**',
        before: '500mg BD from Mar 2022',
        who: 'this hospital · Rx',
        when: 'since Mar 2024',
      },
      {
        id: 'hba1c',
        value: '**HbA1c 8.4%**',
        before: '8.1% · 21 Jun · 7.1% · 2022',
        who: 'this hospital · lab',
        when: 'today',
      },
      {
        id: 'hb',
        value: '**Hb 11.2 g/dL**, falling',
        before: '12.8',
        who: 'Yashoda CBC',
        viaAbha: true,
        when: '14 Mar 2026',
      },
      {
        id: 'lipid',
        value: '**Lipid profile — no result**',
        before: 'no sample ever logged',
        who: 'this hospital · order open',
        when: 'ordered 21 Jun · 27 days',
      },
      {
        id: 'telmisartan',
        value: '**Telmisartan 40mg OD** — 12-day gap',
        before: 'collected on time in every other month',
        who: 'this hospital · pharmacy',
        when: '07–19 May 2026',
      },
      {
        id: 'pregabalin',
        value: '**Pregabalin 75mg HS**',
        before: '—',
        who: 'this hospital · Rx',
        when: 'since Nov 2025',
      },
      {
        id: 'allergies',
        value: '**Allergies: Penicillin, Sulfa**',
        before: 'contradicted by an outside Rx — see below',
        who: 'this hospital · allergy flag',
        when: '2022',
      },
      {
        id: 'weight',
        value: '**Weight 68 kg**',
        before: '68 kg',
        who: 'this hospital · every visit',
        when: '4 years, unchanged',
      },
    ],
    conveneIntro:
      'Each lens may do exactly three things: **state a value that is in her record**, **quote a constraint published somewhere citable**, or **ask you a question**. None of them may tell you what to do — and the panel has no chairman who resolves them.',
    steps: [
      'Lens 1 reading the licensed labels and her charted values…',
      'Lens 2 reading her bills, her refills and the formulary…',
      'Lens 3 reading what her record does not contain…',
      'Comparing the three answers — no lens has seen another’s…',
    ],
    suggestions: [
      'What should I do about the Metformin?',
      'Why do you call the eGFR unconfirmed?',
      'What exactly does she pay each month?',
      'Has she ever been told about her kidneys?',
    ],
  };
}

export function seedPanel(): PanelResult {
  return {
    lenses: [
      {
        id: 'safety',
        title: 'Lens 1 · Drug safety and what the labels say',
        tier: 'amber',
        paragraphs: [
          'She has been on **Metformin 1000mg BD since March 2024** — 28 months. The most recent renal function anywhere in her record is **eGFR 44 mL/min/1.73m²**, from a KFT at Yashoda Hospital on **14 March 2026**, which reached this hospital through her ABHA consent rather than through an order of ours.',
          'The licensed prescribing information for metformin bands renal function at **45–59**, **30–44** and **below 30**. In the **30–44** band the label caps the maximum daily dose and advises against initiation. Her recorded value sits inside that band. **I am quoting the band and her value. I am not computing a dose for her** — that is a prescribing decision, and software that recommends a dose is a licensed medical device under the CDSCO framework.',
          'Her other two lines, against the same labels: **Telmisartan 40mg OD** — no interaction with metformin in either label; both labels ask for periodic renal monitoring. **Pregabalin 75mg HS** — renally cleared, and its label carries a renal-adjustment table of its own. **Metformin–Pregabalin** — no documented interaction. Allergies on file are **penicillin and sulfa**; nothing in her current three lines belongs to either class.',
          'What is documented, and what is not: the eGFR of 44 has been in this record for **126 days**. In those 126 days the metformin dose is unchanged, **no repeat KFT has been ordered here**, and **no serum B12 exists anywhere in 28 months** of metformin while the haemoglobin has moved 12.8 → 11.2. Those are four record facts. I am not telling you what follows from them.',
        ],
        questions: [
          'Is there a renal result you have seen that never made it into this record?',
          'Do you want the label’s renal bands printed on the sheet she takes home, so the next doctor who sees her sees them too?',
          'Is a serum B12 among the things you want today, or not this month?',
        ],
        actions: [
          {
            id: 'label',
            label: 'Show the metformin label in full',
            kind: 'label',
          },
          {
            id: 'recheck',
            label: 'Re-run the interaction check',
            kind: 'check',
          },
        ],
        sources:
          'licensed prescribing information for metformin, telmisartan and pregabalin as held in this hospital’s formulary · KFT Yashoda 14 Mar 2026 (ABHA) · her Rx and dispense history here · her allergy flag',
      },
      {
        id: 'cost',
        title: 'Lens 2 · Cost and access — what this actually costs her',
        tier: 'green',
        paragraphs: [
          '**What she pays now.** Her three lines for 30 days, at this pharmacy’s rates today, inclusive of 12% GST: metformin 1000mg BD dispensed as 120 × 500mg tablets — **₹161**. Telmisartan 40mg, 30 tablets — **₹151**. Pregabalin 75mg, 30 capsules of the brand she is actually dispensed — **₹319**. **Total ₹631 a month**, and every rupee of it is out of pocket: her Star Health policy is on file and was used for her August 2023 admission, but it **carries no OPD benefit**, and she is **not enrolled in Aarogyasri or PM-JAY**. Her last three outpatient visits were billed self-pay.',
          '**One price fact.** The formulary stocks a generic pregabalin 75mg at **₹3.20** a capsule against **₹9.50** for the brand on her card. That is **₹211 a month** on a ₹631 bill — a third of what she spends on medicines. It is a formulary price and a stock fact. **Which one she gets is your prescription, not mine.**',
          '**The 12-day gap, and what the record can and cannot say.** The pharmacy logged **no telmisartan dispense between 07 and 19 May**. On **06 May** she paid **₹850** at the counter — a ₹400 consultation and a ₹450 HbA1c. The gap begins the following day. That is a sequence in the record. **It is not a reason.** A 12-day gap looks identical whether it was money, a festival week at her daughter’s, or a strip she forgot in a bag. I can show you the sequence. Only she can tell you which it was.',
          '**What today could cost her.** Four items are overdue on her own care-gap list: retinal screening **₹350**, urine ACR **₹280**, lipid profile **₹480**, repeat KFT **₹550**. All four ordered today is **₹1,660** — **2.6 times her monthly medicine bill**, on a visit she is already paying ₹400 for.',
        ],
        questions: [
          'Has anyone ever asked her what she pays? I searched all six of her consultation transcripts. **Cost is mentioned in none of them.**',
          'If only one of those four items can be paid for this month, which one do you want first? I have no basis on which to rank them, and I am not going to invent one.',
          'Should the counter quote her the generic pregabalin price before she pays, so the choice is hers as well as yours?',
        ],
        actions: [
          {
            id: 'costsheet',
            label: 'Draft her a Telugu cost sheet',
            kind: 'draft',
          },
          {
            id: 'eligibility',
            label: 'Re-check scheme eligibility',
            kind: 'check',
          },
        ],
        sources:
          'this pharmacy’s live rates and batch stock · her own billed visits and counter payments · the Star Health policy scan on file · her ABHA enrolment record · this hospital’s lab tariff · her care-gap list',
      },
      {
        id: 'gaps',
        title: 'Lens 3 · What is missing from this record',
        tier: 'amber',
        paragraphs: [
          'Gaps, not conclusions. Six things this record does not contain.',
          '**1 · A result for the lipid profile ordered 21 June.** The order exists. No sample was ever logged against it. **27 days** open. That matters twice: once as a missing result, and once as evidence that an order placed here does not always come back.',
          '**2 · A second eGFR.** The 44 is **one reading, from another hospital, 126 days ago**. The reading before it was **62, in January 2025**. There is nothing since. Her problem list here carries **CKD stage 3a**, but that entry was made from that single outside result — and a stage is normally read off two values at least 90 days apart. **This record holds one on either side of the boundary and nothing in between.**',
          '**3 · A urine albumin–creatinine ratio since January 2025** — 18 months. **4 · Any diabetic retinal screening, ever** — she was diagnosed in March 2022, so that is 4 years and 4 months. **5 · A serum B12**, against 28 months of metformin and a haemoglobin that has gone 12.8 → 11.2.',
          '**6 · A resolution to a contradiction nobody has touched.** Penicillin allergy recorded here in 2022. **Apollo Clinic prescribed Amoxicillin 500mg on 02 January 2026**, seen via ABHA, and she reports no reaction. Either the flag is wrong or she never took the course. Both entries are in the record and they cannot both be right.',
          'And one note about an interval rather than about her: **HbA1c 8.4% today, 8.1% on 21 June** — 27 days apart. An HbA1c reflects roughly 90 days of red cells, so those two values overlap for most of their span. **That is a statement about what the interval can support. It is not a statement about her control.**',
        ],
        questions: [
          'Do you want to treat 44 as her current renal function, or re-establish it here first? This record supports either reading and does not settle it.',
          'Which contradiction do you want closed today — the allergy flag, or the lipid order?',
          'Nothing in four years of notes shows anyone telling her she has a kidney finding. **Has she been told?**',
        ],
        actions: [
          {
            id: 'chase',
            label: 'Chase the open lipid order',
            kind: 'draft',
          },
          {
            id: 'amoxicillin',
            label: 'Ask her about the Amoxicillin',
            kind: 'draft',
          },
        ],
        sources:
          'her 38 recorded events across 4 years · the open ServiceRequest of 21 Jun with no matching DiagnosticReport · her care-gap schedule · the Apollo Clinic Rx of 02 Jan 2026 (ABHA) · her allergy flag of 2022',
      },
    ],
    disagreements: [
      {
        id: 'safety',
        label: 'Drug safety says the constraint is already on the record',
        text: 'The constraint is already on the record. A value of **44** has been sitting here for **126 days**, the label band for 30–44 is unambiguous, and **nothing about it is waiting on new information.** Whatever is decided, it is not being decided in the dark.',
      },
      {
        id: 'gaps',
        label: "What's-missing says the opposite, from the same record",
        text: 'The same record says the opposite. **44 is one reading, from another hospital, 126 days old**, with no repeat and no urine ACR for 18 months — and a lipid profile ordered here on 21 June never came back, which is direct evidence that an order placed in this building does not always return. **On that view the number itself is not yet established.**',
      },
      {
        id: 'cost',
        label: 'Cost disagrees with both about the order of operations',
        text: 'Both of those skip the question of what she can carry. Whichever reading is taken, **she pays ₹631 a month before anything is added**, has an **unexplained 12-day gap in May** with a ₹850 counter payment the day before it, and would owe **₹1,660** if today ordered everything the other two lenses want. **What a patient can sustain is a clinical variable** — and it is the one variable that is not in this chart.',
      },
    ],
    noRecommendation:
      '**No lens recommended an action, and there is no fourth lens whose job is to resolve them.** A consensus here would be manufactured. This is a real judgement with a real trade-off in it, and the trade-off is yours.',
    yours: {
      title: 'The decision is yours. HOS is not going to make it.',
      paragraphs: [
        'Nothing in this panel has been written to her chart. Nothing has changed her prescription. No part of it is a recommendation, and none of it will be — under the CDSCO Software-as-a-Medical-Device framework, software that predicts, screens, diagnoses, triages by acuity or **recommends a treatment or a dose** is a licensed medical device. **HOS is not one, and will not behave like one.**',
        'What it can do is make certain that before you decide, you are looking at everything her record actually holds: a renal value from another hospital that has sat here for 126 days, a stage entered from a single reading, a lab order that never came back, a 12-day gap in May with a ₹850 counter payment the day before it, and ₹631 a month that she pays herself.',
        '**Five questions the panel would like answered, in her hearing rather than ours:**',
        '1 · Do you treat the eGFR of 44 as current, or re-establish it here first? · 2 · Has she been told there is a kidney finding at all? · 3 · Was the May gap money, or memory? · 4 · If one test can be afforded this month, which one? · 5 · Is the penicillin flag real?',
      ],
    },
    chartNote: {
      title: 'Note for her chart — that this review happened',
      text: '“Multi-perspective record review, 18 Jul 2026. Reviewed: metformin 1000mg BD against an outside eGFR of 44 (Yashoda, 14 Mar 2026, via ABHA) and the licensed renal bands; a single unrepeated renal value with no urine ACR since Jan 2025; a lipid profile ordered 21 Jun with no result; a 12-day telmisartan refill gap in May; a penicillin-allergy flag contradicted by an outside Amoxicillin Rx of 02 Jan 2026; monthly out-of-pocket medicine cost ₹631 with no OPD insurance cover. **Five questions raised for discussion with the patient. No change to therapy recorded at this review.**”',
      tierNote:
        '**This is the only thing the panel writes.** It records that a review took place and what was examined — a documentation act, GREEN under ADR #7. It contains no plan, because the panel has none. If you later change her therapy, that entry will be yours and will carry your name, not the panel’s.',
    },
    label: seedOrders().dose.label,
  };
}

interface LensActionSpec {
  result: LensActionResult;
}

// What each lens button does. A check only reports. A draft is prepared for the doctor to approve:
// the lens never chases the lab, writes to the patient or asks another hospital by itself.
export const LENS_ACTIONS: Record<string, LensActionSpec> = {
  'safety:label': {
    result: {
      title: 'The metformin label',
      detail: 'Opened in full: the label’s bands, quoted and not computed.',
    },
  },
  'safety:recheck': {
    result: {
      title: 'Interaction check re-run against all three lines',
      detail:
        'Licensed labels only · no interaction found · penicillin and sulfa both clear',
    },
  },
  'cost:costsheet': {
    result: {
      title: 'Cost sheet drafted for her',
      detail:
        'Telugu · itemised · what each test costs before she agrees to it',
      draft: {
        title: 'Draft: a Telugu cost sheet for the patient',
        body: 'Itemised, in Telugu, before she agrees to anything: retinal screening ₹350, urine ACR ₹280, lipid profile ₹480, repeat KFT ₹550. Nothing on the sheet is a recommendation — it lists what each item costs, so the choice is hers as well as yours.',
        approveLabel: 'Approve & send to her',
        approvedVerb: 'Sent',
      },
    },
  },
  'cost:eligibility': {
    result: {
      title: 'Scheme eligibility re-checked',
      detail:
        'No Aarogyasri or PM-JAY enrolment found against her ABHA · Star Health has no OPD rider',
    },
  },
  'gaps:chase': {
    result: {
      title: 'Lipid chase drafted',
      detail:
        'No sample was ever logged — the lab has no record to return. Nothing is sent until you approve it.',
      draft: {
        title: 'Draft: chase the lab on the 21 Jun lipid order',
        body: 'To the lab: the lipid profile ordered for this patient on 21 Jun has no sample logged against it after 27 days. Please confirm whether a sample was ever collected, and re-issue the collection if not.',
        approveLabel: 'Approve & send to the lab',
        approvedVerb: 'Sent',
      },
    },
  },
  'gaps:amoxicillin': {
    result: {
      title: 'Allergy re-verification drafted',
      detail:
        'A structured question for her, and a request to Apollo Clinic for the dispense record. Nothing is sent until you approve it.',
      draft: {
        title: 'Draft: ask her about the Amoxicillin',
        body: 'To the patient: did you take the Amoxicillin prescribed at Apollo Clinic in January, and did anything happen? To Apollo Clinic: please confirm whether the Amoxicillin course of 02 Jan 2026 was dispensed.',
        approveLabel: 'Approve & send to her',
        approvedVerb: 'Sent',
      },
    },
  },
};

function entry(
  keywords: string[],
  text: string,
  source: string | undefined,
  followups: string[],
  tier: ChatReply['tier'] = 'amber',
): BankEntry {
  return { keywords, reply: { text, source, followups, tier } };
}

export const PANEL_BANK: BankEntry[] = [
  entry(
    [
      'should i',
      'what do i do',
      'what should',
      'recommend',
      'reduce',
      'stop the',
      'increase',
      'change the dose',
      'advice',
      'advise',
    ],
    'I am not going to answer that, and the reason is not modesty.\nChoosing, starting, stopping or changing a dose for a named patient is a **RED-tier action** under ADR #7 — the CDSCO Software-as-a-Medical-Device framework. It requires a licence HOS does not hold, and a vendor whose AI answered it would be shipping an unlicensed medical device.\nWhat I can do is hand you everything: **eGFR 44 on 14 Mar, one reading, 126 days old, no repeat** · label bands **45–59 / 30–44 / below 30** · **Metformin 1000mg BD since Mar 2024** · **HbA1c 8.4% today, 8.1% on 21 Jun** · **Hb 11.2 falling from 12.8** · **no urine ACR for 18 months** · **no retinal screening ever** · **lipid profile ordered 21 Jun, never resulted** · **₹631 a month, all out of pocket** · **a 12-day refill gap in May**.\n**The decision is yours, and the record will show it as yours.**',
    undefined,
    [
      'Why do you call the eGFR unconfirmed?',
      'What exactly does she pay each month?',
    ],
    'red',
  ),
  entry(
    [
      'unconfirmed',
      'second egfr',
      'why do you call',
      'one reading',
      'repeat',
      'stage',
    ],
    'Because of three dates and nothing else.\n**Jan 2025 — eGFR 62**, measured here. **14 Mar 2026 — eGFR 44**, measured at Yashoda Hospital and received through her ABHA consent. **Since then — nothing.** No repeat here, and no urine albumin–creatinine ratio since Jan 2025.\nHer problem list here carries **CKD stage 3a**, but that entry was made from that one outside result. A stage is normally read from two values at least 90 days apart, and this record holds one on either side of the boundary with a 14-month hole between them.\n**None of that means the 44 is wrong.** It means the record does not settle whether it is stable, and I am not going to pretend it does.',
    'KFT here Jan 2025 · KFT Yashoda 14 Mar 2026 (ABHA) · her problem list entry of Mar 2026',
    [
      'Show me the metformin label',
      'Has she ever been told about her kidneys?',
    ],
  ),
  entry(
    ['pay', 'cost', 'money', 'afford', 'insurance', 'rupees', '631'],
    'For 30 days, at this pharmacy’s rates today, with 12% GST:\n**Metformin 1000mg BD — ₹161** (120 × 500mg tablets; the pharmacy stocks the 500mg)\n**Telmisartan 40mg OD — ₹151**\n**Pregabalin 75mg HS — ₹319** (the brand she is dispensed; the formulary generic is ₹3.20 a capsule against ₹9.50, which would make her total **₹420**)\n**₹631 a month, every rupee out of pocket.** Star Health is on file and paid for her Aug 2023 admission, but **has no OPD benefit**; no Aarogyasri or PM-JAY enrolment against her ABHA.\nIf today ordered all four overdue items — retinal ₹350, urine ACR ₹280, lipid ₹480, KFT ₹550 — that is **₹1,660**, or **2.6× her monthly medicine bill**, on a visit she is already paying ₹400 for.',
    'live pharmacy rates and stock · her billed visits · the Star Health policy scan · this hospital’s lab tariff',
    ['Was the May gap money or memory?'],
  ),
  entry(
    ['gap', 'may', 'memory', 'forgot', 'adherence', 'refill'],
    'The record holds a sequence and I am going to stop there.\n**06 May — she paid ₹850 at the counter**: a ₹400 consultation and a ₹450 HbA1c.\n**07 to 19 May — no telmisartan dispense logged.** 12 days.\n**19 May — collected, and on time in every other month of the last twelve.**\nThat is the whole of the evidence. **A 12-day gap looks identical whether it was money, a festival week at her daughter’s, or a strip left in a bag** — and I have no way to tell which. **She does.** Her six consultation transcripts contain no mention of cost at all, so nobody has yet asked her.',
    'pharmacy dispense history · billing records, May 2026 · transcript search across 6 visits',
    ['What exactly does she pay each month?'],
  ),
  entry(
    ['told', 'counsel', 'explain', 'kidney', 'does she know', 'aware'],
    'Not according to anything written down.\nThe eGFR of 44 arrived on **14 March 2026**. Her next visit here was **21 June**, and that note contains **no mention of renal function**. I searched all six of her consultation transcripts for the Telugu and English words for kidney, urine, creatinine and dialysis. **No match in any of them.**\nThe absence of a record is not proof the conversation never happened — you may have mentioned it and not charted it. But if it did happen, it is not written down, and the next doctor who opens this record will conclude what I just concluded.',
    'transcript search across 6 OPD visits, Mar 2022 – Jul 2026 · the OPD note of 21 Jun 2026',
    ['Why do you call the eGFR unconfirmed?'],
  ),
  entry(
    [
      'label',
      'band',
      'metformin label',
      'prescribing information',
      'show me the',
    ],
    'From the licensed prescribing information, verbatim in substance:\n**eGFR 45–59** — maximum daily dose restricted; monitor renal function every 3–6 months.\n**eGFR 30–44** — **maximum daily dose capped at half the usual maximum; do not initiate.**\n**eGFR below 30** — contraindicated.\nHer recorded value is **44**, which is in the second band, and she has been on **1000mg BD since March 2024**. **I am quoting the band and her number. I am not calculating a dose for her** — the moment I did, this software would be a licensed medical device.',
    'licensed prescribing information for metformin, as held in this hospital’s formulary',
    ['What should I do about the Metformin?'],
  ),
  entry(
    ['lipid', 'never resulted', 'open order', 'ordered'],
    'A **lipid profile was ordered on 21 June 2026**. The order exists as a request. **No sample was ever logged against it**, and no result has ever come back. **27 days.**\nThat matters twice. Once because a value she should have is missing. And once because it is direct evidence, from her own record, that **an order placed in this building does not reliably come back** — which is worth knowing before relying on anything ordered today.',
    'the open ServiceRequest of 21 Jun 2026 with no matching DiagnosticReport',
    ['Is anything else missing from her record?'],
  ),
  entry(
    ['allergy', 'penicillin', 'amoxicillin', 'contradiction', 'sulfa'],
    '**Penicillin** was flagged here in **2022**, after a rash within a day of Amoxicillin. **Sulfa** is also on file. Neither class appears in her current three lines.\nAnd then: **Apollo Clinic prescribed Amoxicillin 500mg on 02 January 2026**, visible through her ABHA record, and **she reports no reaction**.\nEither the flag is wrong, or she was given the prescription and never took it. **Both entries are in this record and they cannot both be right.**',
    'allergy flag 2022 · Apollo Clinic Rx 02 Jan 2026 (ABHA) · her own report at today’s visit',
    ['Is anything else missing from her record?'],
  ),
  entry(
    ['missing', 'gaps', 'anything else', 'overdue'],
    'Six things her record does not contain:\n**1** · a result for the lipid profile ordered 21 Jun — 27 days.\n**2** · a second eGFR — the 44 is one reading, 126 days old, from another hospital.\n**3** · a urine albumin–creatinine ratio since Jan 2025 — 18 months.\n**4** · any diabetic retinal screening, ever — 4 years 4 months since diagnosis.\n**5** · a serum B12, against 28 months of metformin and an Hb of 11.2 falling from 12.8.\n**6** · any resolution of the penicillin-versus-Amoxicillin contradiction.\nAll four of the orderable items together would cost her **₹1,660**. **I am not ranking them.**',
    'her care-gap schedule · lab history · the allergy flag and the outside Rx',
    ['What exactly does she pay each month?'],
  ),
];

export const PANEL_FALLBACK: ChatReply = {
  text: 'The three lenses stay open. Ask any of them for the evidence behind a line — **the metformin label**, **why the eGFR is unconfirmed**, **what she pays each month**, **the May refill gap**, **the allergy contradiction**, **the open lipid order**, or **whether she has ever been told**.\nAnd if you ask me what to do, I will tell you why I am not allowed to answer, then give you every fact instead.',
  followups: [
    'What should I do about the Metformin?',
    'Why do you call the eGFR unconfirmed?',
  ],
  tier: 'amber',
};
