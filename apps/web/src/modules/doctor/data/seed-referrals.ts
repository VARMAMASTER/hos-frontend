import type {
  LetterAttachment,
  ReferralLetter,
  ReferralOut,
  ReferralRecipient,
  ReferralsOverview,
  TeluguCopy,
} from './types';

// Invented sample data, from the prototype page (os/public/03-doctor.html, data-panel="referrals").
// A referral letter is almost entirely re-assembly of facts the record already holds, which is what a
// drafting tool is allowed to do (GREEN). The one sentence that is not a fact is the ask, a question.

export const REFERRAL_STEPS = [
  'Reading her 38 recorded events across 4 years…',
  'Selecting what this specialty needs and dropping what it does not…',
  'Attaching 2 outside results held under her ABHA consent…',
  'Drafting the letter in your register…',
];

export function seedReferrals(): ReferralsOverview {
  return {
    patient: { token: 'T-12', name: 'Lakshmi Devi', ageSex: '58F' },
    doctorName: 'Dr. K. Ramesh',
    steps: REFERRAL_STEPS,
    recipients: RECIPIENTS,
    out: seedReferralsOut(),
    outNote:
      'The two open rows are the reason this list exists. HOS knows a letter left and no reply arrived; it will not chase a consultant on your behalf, but it will keep saying so. **G. Ramulu is in your queue today at T-21** — the referral he never got an answer to is for the same screening Lakshmi Devi has also never had.',
  };
}

const RECIPIENTS: ReferralRecipient[] = [
  {
    id: 'neph',
    specialty: 'Nephrology',
    note: '**Dr. B. Sridevi, MD DM (Nephrology) · Yashoda Hospital, Secunderabad.** Chosen because the eGFR of 44 came from that laboratory — she can be asked about her own result. 6 attachments will be assembled, 2 of them from other hospitals.',
  },
  {
    id: 'ophth',
    specialty: 'Ophthalmology',
    note: '**Dr. A. Venkataramana, MS (Ophthalmology) · Sankara Eye Hospital.** Note before you send: an earlier referral to this address on 27 Jun has had no reply for 21 days. The letter will say so.',
  },
  {
    id: 'endo',
    specialty: 'Endocrinology',
    note: '**Dr. Farah Naaz, MD DM (Endocrinology) · Apollo Hospitals, Jubilee Hills.** One thing to know: Apollo Clinic is also the source of the Amoxicillin prescription that contradicts her penicillin flag. The letter will mention it.',
  },
  {
    id: 'diet',
    specialty: 'Dietetics',
    note: '**Ms. Sunitha Rao, RD · Clinical Dietetics, this hospital.** No outside letter needed and no consultation fee — she is on staff. Her medicine cost and refill history will be attached, because they are the constraint.',
  },
];

function seedReferralsOut(): ReferralOut[] {
  return [
    {
      id: 'ramulu',
      reply: { state: 'none', text: 'None · 21 days' },
      patient: 'G. Ramulu',
      patientNote: 'T-21 today',
      to: 'Ophthalmology · Sankara Eye',
      sent: '27 Jun',
      reason: 'Retinal screening, diabetic, never done',
    },
    {
      id: 'sarala',
      reply: { state: 'none', text: 'None · 9 days' },
      patient: 'P. Sarala',
      to: 'Cardiology · Care Hospital',
      sent: '09 Jul',
      reason: 'Exertional chest pain on a treadmill test done here',
    },
    {
      id: 'yesu',
      reply: { state: 'received', text: 'Received' },
      patient: 'M. Yesu Ratnam',
      to: 'Nephrology · Yashoda',
      sent: '02 Jul',
      reason: 'eGFR 38 on a KFT done here',
    },
    {
      id: 'nazeer',
      reply: { state: 'received', text: 'Received' },
      patient: 'Sk. Nazeer',
      to: 'Endocrinology · Apollo',
      sent: '24 Jun',
      reason: 'Poorly controlled T2DM on three agents',
    },
  ];
}

interface LetterSpec {
  title: string;
  to: string[];
  dear: string;
  why: string;
  ask: string;
}

const SPECS: Record<string, LetterSpec> = {
  neph: {
    title: 'Referral letter — Nephrology',
    to: [
      '18 July 2026',
      'To: Dr. B. Sridevi, MD DM (Nephrology)',
      'Yashoda Hospital, Secunderabad',
    ],
    dear: 'Dear Dr. Sridevi,',
    why: 'The reason I am writing is a result your own laboratory produced. A kidney function test at Yashoda on **14 March 2026** returned an **eGFR of 44 mL/min/1.73m²** with a creatinine of 1.4 mg/dL, which reached me through her ABHA record rather than through a request of mine. Her previous eGFR here was **62, in January 2025**. There has been no repeat since, and no urine albumin–creatinine ratio since January 2025 either — so I hold one reading on each side of a boundary and nothing in between.',
    ask: 'Specifically, I would be grateful for your view on whether her renal function needs re-establishing here before anything about her diabetes management is reconsidered, and on how you would sequence that against what she can afford.',
  },
  ophth: {
    title: 'Referral letter — Ophthalmology',
    to: [
      '18 July 2026',
      'To: Dr. A. Venkataramana, MS (Ophthalmology)',
      'Sankara Eye Hospital, Hyderabad',
    ],
    dear: 'Dear Dr. Venkataramana,',
    why: 'The reason I am writing is a gap rather than a result. She was diagnosed with type 2 diabetes in **March 2022** and has **never had a diabetic retinal screening** — four years and four months. Her HbA1c has not been below 7.1% at any point in that time and is **8.4% today**. I should add that a referral I sent you for another patient on **27 June** has had no reply, which is part of why I am writing this one carefully.',
    ask: 'Specifically, I would be grateful if she could be seen for a dilated fundus examination, and if the finding could be explained to her in Telugu — she reads Telugu, and the cost of each visit is a real constraint for her.',
  },
  endo: {
    title: 'Referral letter — Endocrinology',
    to: [
      '18 July 2026',
      'To: Dr. Farah Naaz, MD DM (Endocrinology)',
      'Apollo Hospitals, Jubilee Hills',
    ],
    dear: 'Dear Dr. Naaz,',
    why: 'The reason I am writing is that two things in her record now pull against each other. Her HbA1c is **8.4% today** (8.1% four weeks ago, 7.1% at her best in 2022), while an outside kidney function test on **14 March 2026** returned an **eGFR of 44** — a value I have not been able to repeat here, and one the metformin label speaks to directly.',
    ask: 'Specifically, I would be grateful for your view on how her glycaemic management should be approached in the light of a renal value I have not yet confirmed, and how you would sequence the two questions against what she is able to pay.',
  },
  diet: {
    title: 'Referral — Clinical Dietetics (in-house)',
    to: [
      '18 July 2026',
      'To: Ms. Sunitha Rao, RD',
      'Clinical Dietetics · this hospital',
    ],
    dear: 'Dear Ms. Rao,',
    why: 'The reason I am writing is a pattern rather than a number. Her weight has been **68 kg, unchanged for four years**, while her HbA1c has moved 7.1% → 8.4% over the same period. There is also a **12-day gap in her telmisartan refills in May**, and a ₹850 counter payment the day before it began.',
    ask: 'Specifically, I would be grateful if you could work out a plan she can actually sustain — she pays **₹631 a month** for medicines with no insurance cover for outpatient care, so a plan that assumes expensive food will not survive the month.',
  },
};

// The same six attachments for every recipient, as in the prototype: the sixth is a gap in our own
// record, unticked by default because the doctor may not want to send it.
function attachments(): LetterAttachment[] {
  return [
    {
      id: 'kft',
      label: 'KFT — eGFR 44, creatinine 1.4',
      detail: 'Yashoda Hospital, 14 Mar 2026 — the result the letter is about',
      viaAbha: true,
      checked: true,
    },
    {
      id: 'trajectory',
      label: 'eGFR and HbA1c trajectories, 2022–2026',
      detail: 'assembled from 9 lab reports held here',
      checked: true,
    },
    {
      id: 'medications',
      label: 'Current medication list with start dates',
      detail: 'Metformin Mar 2024, Telmisartan Jan 2023, Pregabalin Nov 2025',
      checked: true,
    },
    {
      id: 'allergy',
      label: 'Allergy record and the contradicting outside Rx',
      detail: 'Apollo Clinic, 02 Jan 2026',
      viaAbha: true,
      checked: true,
    },
    {
      id: 'refills',
      label: 'Pharmacy refill history, 12 months',
      detail: 'including the 12-day Telmisartan gap in May',
      checked: true,
    },
    {
      id: 'lipid',
      label: 'Open lipid-profile order from 21 Jun with no result',
      detail: '',
      checked: false,
      hint: 'unticked by default: it is a gap in our record, and you may not want to send it',
    },
  ];
}

export function seedLetter(recipientId: string): ReferralLetter | null {
  const spec = SPECS[recipientId];
  if (!spec) return null;
  return {
    id: recipientId,
    title: spec.title,
    hospital: 'Sri Venkateshwara Multi-Speciality Hospital',
    hospitalMeta:
      'Kukatpally, Hyderabad · 60 beds · Dr. K. Ramesh, MD · General Medicine · Room 3',
    to: spec.to,
    re: 'Re: Smt. Lakshmi Devi, 58F · ABHA linked · MRN SVH/2022/04117',
    dear: spec.dear,
    paragraphs: [
      'I would value your opinion on this lady, who has had type 2 diabetes since March 2022 and hypertension since January 2023, and who has been under my care throughout.',
      spec.why,
      'She has been on **Metformin 1000mg BD since March 2024**, and I am conscious of what the label says about that dose at her recorded eGFR. Her haemoglobin has drifted from 12.8 to **11.2 g/dL**. Her weight has been stable at 68 kg for four years and her HbA1c today is **8.4%**, up from 8.1% four weeks ago.',
      'Two things you should know before you see her. She is recorded here as allergic to **penicillin and sulfa**, but an Amoxicillin course was prescribed elsewhere in January 2026 with no reaction reported, so treat the flag as unconfirmed. And she is entirely self-paying for outpatient care — her insurance carries no OPD benefit, and her medicines already cost her **₹631 a month** — which is relevant to whatever you decide to investigate.',
    ],
    ask: spec.ask,
    signature:
      'Dr. K. Ramesh, MD · General Medicine\nSri Venkateshwara Multi-Speciality Hospital · 18 Jul 2026\n**Unsigned draft** — this letter does not exist outside this screen until you sign it.',
    attachments: attachments(),
    attachmentsTitle:
      'Attachments assembled — 6 items, 2 of them from other hospitals',
    note: '**Nothing here was invented.** Every clinical statement is a value already in her record — 4 items from this hospital, 2 pulled under her ABHA consent. The one sentence that is not a fact is the request for an opinion, and that sentence is a question.\n**Time honesty:** your last 9 referral letters took a median of **6 min 40 s** to type; reviewing a draft has taken **48 s**. A referral letter is mostly re-assembly of facts the record already holds, which is precisely what a drafting tool is allowed to do.',
  };
}

export function seedTeluguCopy(): TeluguCopy {
  return {
    text: 'మీ రిపోర్టులను ఇంకొక స్పెషలిస్ట్ డాక్టర్ గారికి చూపించమని మేము రాస్తున్నాం. భయపడాల్సిన అవసరం లేదు. వారిని ఎప్పుడు కలవాలో మా కౌంటర్ మీకు చెబుతుంది.',
    gloss:
      'We are writing to a specialist doctor to look at your reports. There is no need to be frightened. Our counter will tell you when to see them.',
  };
}

export const RECIPIENT_IDS = Object.keys(SPECS);
