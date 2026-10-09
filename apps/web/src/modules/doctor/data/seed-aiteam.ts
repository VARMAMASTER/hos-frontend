import type { BankEntry } from './mock-util';
import type { AiTeamOverview, ChatReply, RecallDraft } from './types';

// Invented sample data, from the prototype page (os/public/03-doctor.html, data-panel="aiteam").
// Two agents, both on a leash the doctor can see. Every learned behaviour ships with an off switch in
// the same row as the sentence it governs, and two of the rows are off, because the doctor turned
// them off and the product left the evidence on screen. Neither agent diagnoses, and neither
// prescribes: those are RED-tier actions, so they are not switched-off features, they are not built.

export function seedAiTeam(): AiTeamOverview {
  return {
    doctorName: 'Dr. K. Ramesh',
    intro:
      'Two agents work for you, and they do different jobs. **Sahayaka** (సహాయకుడు — "helper") learns **you**: your phrasing, your Telugu, your order sets, and what you keep correcting in its drafts. **Sandarbha** (సందర్భం — "reference") knows **General Medicine**: what this specialty orders, what the season is doing in Kukatpally, and how to say a difficult thing in Telugu. Neither one diagnoses, and neither one prescribes.',
    sahayaka: {
      name: 'Sahayaka',
      initials: 'SA',
      subtitle:
        'Your personal assistant · trained on **your** 412 approved notes and nothing else · never leaves this hospital’s database',
      hiddenRunning: 3,
      hiddenOff: 0,
      correctionsStopped: 6,
      preferences: [
        {
          id: 'renal',
          learned:
            'You always add a renal-function note for older patients on Metformin',
          why: 'Learned from **6 corrections** you made in 30 days. The same six appear in Administration → AI Quality as a fix in the owner’s queue — this is the doctor’s side of it.',
          does: '**every draft for a patient over 55 on Metformin carries your renal line and cites the eGFR it read, with its date and which hospital produced it.** It still does not pick a dose, and it never will.',
          enabled: true,
        },
        {
          id: 'telugu',
          learned: 'Your Telugu counselling register is spoken, not formal',
          why: 'Learned from **14 of your own Telugu lines rewritten** in 30 days. You say **షుగర్**, never మధుమేహం; you use the respectful plural throughout; you never write a sentence a patient would have to read twice.',
          does: '**drafts every patient-facing Telugu line in your spoken register**, and flags any sentence longer than 14 words for you to shorten.',
          enabled: true,
        },
        {
          id: 'orderset',
          learned: 'Your T2DM order set, and where you draw the line',
          why: 'Learned from **142 uses** of your T2DM follow-up template and 744 T2DM visits recorded here in 12 months.',
          does: '**pre-selects only the labs you order in more than half of these visits**, and **shows you the ones it left out rather than hiding them.** It will not tick a box on your behalf that you tick less than half the time.',
          enabled: true,
        },
        {
          id: 'dictation',
          learned: 'You dictate vitals before symptoms',
          why: 'Learned from the order of speech in **412 transcripts**. Most doctors here do the reverse.',
          does: '**lays the draft out in the order you spoke it**, so reading it back feels like re-reading your own sentence rather than proof-reading someone else’s. This is why your median approval time is 38 seconds.',
          enabled: true,
        },
        {
          id: 'shorten',
          learned: 'Shortening your Subjective section to two lines',
          why: 'Learned from your edits to its drafts.',
          whenOff:
            "**You switched this off on 04 Jul**, after a shortened S dropped a patient's mention of night sweats. It has not been attempted since, and it will not be re-learned unless you turn it back on.",
          does: 'compress S to the two most clinically loaded sentences.',
          enabled: false,
        },
        {
          id: 'redflag',
          learned: 'Adding "no red flags" to fever notes',
          why: 'Learned from your edits to its drafts.',
          whenOff:
            '**You switched this off on 11 Jul.** It is not a phrase you use, and a phrase you did not write should not appear over your signature.',
          does: 'append a negative-findings line to febrile-illness notes.',
          enabled: false,
        },
      ],
      neverDo:
        'It will not choose a drug. It will not choose a dose. It will not write an assessment you did not say, and it will not write a plan at all. Those are RED-tier actions under the CDSCO Software-as-a-Medical-Device framework — a licence we do not hold — so they are not features that are switched off. **They are not built.** If it ever appears to do one of them, that is a bug, and the button below reports it as one.',
      learnsFrom:
        '**Where it learns from, precisely:** your 412 approved transcripts, the edits you made before approving them, your template usage, and your dictation order. Not other doctors here. Not other hospitals. Not anything you rejected without correcting. **Nothing it learns is visible to management** — the owner sees counts of corrections, never your notes.',
    },
    sandarbha: {
      name: 'Sandarbha',
      initials: 'SN',
      subtitle:
        'General Medicine reference · depth in the specialty, not opinions about your patient · every line traces to a citation',
      orders: [
        {
          item: 'HbA1c',
          yourRate: '97%',
          hospitalRate: '94%',
          visits: '744',
        },
        {
          item: 'Lipid profile',
          yourRate: '76%',
          hospitalRate: '71%',
          visits: '744',
        },
        {
          item: 'Kidney function test',
          yourRate: '61%',
          hospitalRate: '58%',
          visits: '744',
        },
        {
          item: 'Urine albumin (ACR)',
          yourRate: '34%',
          hospitalRate: '31%',
          visits: '744',
          flag: 'least ordered',
        },
        {
          item: 'Retinal screening referral',
          yourRate: '12%',
          hospitalRate: '14%',
          visits: '744',
        },
      ],
      ordersNote:
        '744 T2DM follow-up visits recorded in this hospital in the last 12 months. **This is a count of what was ordered, not a statement about what should be.** The urine ACR is the item this specialty leaves out most often, here and in the published Indian audit literature alike.',
      season: [
        '**Monsoon window.** Ward-level dengue notifications for Kukatpally: **42 this fortnight** against **11** in the same fortnight of 2025 — Telangana IDSP weekly bulletin, week 28 of 2026. In this hospital’s own OPD, presentations recorded as "fever, 3 days or more" are running at **3.1×** the May baseline: **71 in the last 14 days** against 23 in a comparable May fortnight.',
        '**Mohd. Irfan (T-14) is in your queue now, recorded as fever, day 3.** That is a record fact, and the bulletin count above is a published number. **They are on the same screen because you asked for the specialty picture. Sandarbha is not putting them together for you** — connecting a surveillance count to a named patient is a screening judgement, which is not something it is licensed to make.',
        '**TB continuation phase.** Six patients under your care are in the continuation phase of a six-month regimen. The NTEP treatment card schedules a follow-up sputum smear at the end of month five. **Four of the six reach the end of month five this week, and none of the four has a smear recorded.** That is a schedule published by the Central TB Division held against your own records.',
      ],
      bulletin: {
        title: 'Telangana IDSP weekly bulletin — week 28 / 2026',
        lines: [
          'Dengue — **42** (11 in the same fortnight of 2025)',
          'Chikungunya — 7 (4)',
          'Malaria, P. vivax — 3 (5)',
          'Acute diarrhoeal disease — 118 (96)',
          'Enteric fever, clinically diagnosed — 22 (14)',
        ],
        note: 'A surveillance count is a published number about a population. It is not a finding about anybody in your queue, and HOS will not turn it into one.',
      },
      phrases: [
        {
          id: 'average',
          key: 'A three-month average, not today’s sugar',
          local:
            'మీ మూడు నెలల షుగర్ సగటు 8.4 ఉంది. లక్ష్యం 7 కంటే తక్కువ. ఇది ఒక్క రోజు షుగర్ కాదు — మూడు నెలల సగటు.',
          en: 'Your three-month sugar average is 8.4. The target is under 7. This is not one day’s sugar — it is a three-month average.',
        },
        {
          id: 'kidney',
          key: 'A kidney number from another hospital',
          local:
            'వేరే ఆసుపత్రిలో చేసిన కిడ్నీ పరీక్షలో ఒక సంఖ్య తక్కువగా వచ్చింది. దాన్ని ఇక్కడ మళ్లీ చూడాలి. భయపడాల్సిన అవసరం లేదు, కానీ వదిలేయకూడదు.',
          en: 'A kidney test done at another hospital came back with one low number. We should look at it again here. There is no need to be frightened, but it should not be left alone.',
        },
        {
          id: 'gap',
          key: 'Asking about a refill gap without accusing',
          local:
            'మే నెలలో పన్నెండు రోజులు మాత్రలు తీసుకోలేదని రికార్డులో ఉంది. మర్చిపోయారా, లేక డబ్బు ఇబ్బందా? నిజం చెప్పండి — తప్పు లేదు.',
          en: 'The record shows twelve days in May without tablets. Did you forget, or was money difficult? Tell me the truth — there is no blame in it.',
        },
        {
          id: 'bp',
          key: 'Why a BP tablet is not a painkiller',
          local:
            'బీపీ మాత్ర రోజూ వేసుకోవాలి. నొప్పి లేకపోయినా వేసుకోవాలి. అది నొప్పి మాత్ర కాదు.',
          en: 'The BP tablet has to be taken every day, even when there is no pain. It is not a painkiller.',
        },
      ],
      phrasesNote:
        'Phrasing only. Sandarbha writes the words; **you choose the message.** The third line is the question the cost lens raised in Case Discussion, in the language she would answer it in.',
      templates: [
        {
          id: 't2dm-egfr',
          name: 'T2DM with reduced eGFR — review note',
          meta: 'Structure only: S, O, A, and an **empty P**. Prompts for the eGFR’s date and source.',
          uses: 31,
          loaded: {
            title: 'Template loaded — T2DM with reduced eGFR',
            detail: 'Note structure only · no plan and no doses pre-filled',
          },
        },
        {
          id: 'nephro-referral',
          name: 'Nephrology referral — single unrepeated eGFR',
          meta: 'Assembles both eGFR values with dates and sources, the ACR gap, and the current drug list.',
          uses: 9,
          loaded: {
            title: 'Referral template loaded',
            detail: 'Open Referrals Out to see it drafted for the patient',
          },
        },
        {
          id: 'monsoon-fever',
          name: 'Monsoon febrile illness — day-of-illness note',
          meta: 'Forces an explicit day of illness, which your notes already do 11 times out of 11.',
          uses: 88,
          loaded: {
            title: 'Template loaded — monsoon febrile illness',
            detail: 'Ready for the next febrile presentation in your queue',
          },
        },
        {
          id: 'tb-continuation',
          name: 'TB continuation-phase visit — NTEP card fields',
          meta: 'Mirrors the NTEP treatment card: month, weight band, smear schedule, adherence entry.',
          uses: 46,
          loaded: {
            title: 'Template loaded — TB continuation phase',
            detail: 'Month-5 smear field is empty for 4 of your 6 patients',
          },
        },
      ],
      suggestions: [
        'What does the metformin label say about renal function?',
        'What is dengue doing in Kukatpally this month?',
        'What does the NTEP card schedule at month 5?',
        'Does Lakshmi Devi have kidney disease?',
      ],
      citations:
        '**Citations, because a reference agent without them is just a confident stranger.** Sources on this card: Telangana IDSP weekly bulletin, week 28/2026 · Central TB Division NTEP technical and operational guidelines · licensed prescribing information held in this hospital’s formulary · this hospital’s own 5,880 General Medicine OPD visits and 744 T2DM follow-ups over 12 months · published Indian diabetes-care audit literature. **Nothing on this card is recalled from a model’s memory**, and every line above names which of those it came from.',
    },
  };
}

export function seedTbRecall(): RecallDraft {
  return {
    title: 'WhatsApp recall — 4 TB patients',
    body: 'To the four patients in the continuation phase of treatment: your month-5 sputum test is due this week. Please come to the OPD on any morning, bring your NTEP card, and tell the counter you are here for the month-5 smear. Do not stop your tablets. Nothing in this message is about your medicines — only the date of your test.',
  };
}

function entry(
  keywords: string[],
  text: string,
  source: string | undefined,
  followups: string[],
  tier: ChatReply['tier'] = 'amber',
): BankEntry {
  return { keywords, reply: { text, source, followups, tier } };
}

export const SPECIALTY_BANK: BankEntry[] = [
  entry(
    [
      'does she have',
      'have kidney',
      'kidney disease',
      'diagnose',
      'diagnosis',
      'is it ckd',
      'what is wrong with',
      'what does she have',
    ],
    'No — and it is worth being precise about why, because "the AI won’t say" usually means "the AI doesn’t know".\nI know a great deal here. **Her recorded eGFR is 44** (Yashoda, 14 Mar 2026). **The KDIGO staging bands and the metformin label bands are both published and I can quote either.** **Her problem list carries CKD stage 3a**, entered from that result.\nWhat I will not do is put those together into a finding about her. Deciding that a named patient has a disease is **diagnosis** — RED tier under ADR #7, requiring a CDSCO licence, ICMR ethics review and separate DPDP consent. Not something HOS is, and not something it is pretending to be.\n**I can hand you every band and every value. Which one she is in is yours to say.**',
    undefined,
    ['What does the metformin label say about renal function?'],
    'red',
  ),
  entry(
    ['metformin', 'label', 'renal', 'egfr band'],
    'From the licensed prescribing information:\n**eGFR 45–59** — maximum daily dose restricted; monitor renal function every 3–6 months.\n**eGFR 30–44** — **maximum daily dose capped at half the usual maximum; do not initiate.**\n**Below 30** — contraindicated.\nThose are the label’s three bands, quoted as published. What any individual patient’s value means for her prescription is a prescribing decision.',
    'licensed prescribing information held in this hospital’s formulary',
    ['Does Lakshmi Devi have kidney disease?'],
  ),
  entry(
    ['dengue', 'monsoon', 'fever', 'season', 'kukatpally', 'outbreak', 'idsp'],
    '**Kukatpally ward notifications, fortnight ending 17 Jul 2026** (Telangana IDSP weekly bulletin, week 28/2026): dengue **42** against 11 in the same fortnight of 2025 · chikungunya 7 (4) · P. vivax malaria 3 (5) · acute diarrhoeal disease 118 (96) · clinically diagnosed enteric fever 22 (14).\nIn this hospital’s own OPD, presentations recorded as "fever, 3 days or more" are at **71 in the last 14 days** against 23 in a comparable May fortnight — **3.1×**.\n**Two of the patients in your queue right now are febrile presentations**, including Mohd. Irfan at T-14, recorded as day 3. **That is a record fact and a population count on one screen. I am not joining them up** — connecting a surveillance number to a named patient is a screening judgement, and screening is RED tier.',
    'Telangana IDSP weekly bulletin wk 28/2026 · this hospital’s own OPD presentation counts',
    ['What does the NTEP card schedule at month 5?'],
  ),
  entry(
    ['ntep', 'tb', 'tuberculosis', 'smear', 'continuation', 'month 5'],
    'The **NTEP treatment card** schedules a **follow-up sputum smear at the end of month 5** of a six-month regimen, alongside a weight-band check and an adherence entry at every visit.\nHeld against your own records: **six patients under your care are in the continuation phase**, **four of the six reach the end of month 5 this week**, and **none of those four has a smear recorded.**\nThat is a published schedule compared with your own charting. It is not a statement about any of their disease.',
    'Central TB Division, NTEP technical and operational guidelines · this hospital’s TB register',
    ['What does this specialty usually order for T2DM here?'],
  ),
  entry(
    ['order', 'panel', 'acr', 'usually', 'this specialty', 'rate', 't2dm'],
    'Across **744 T2DM follow-up visits** recorded in this hospital in the last 12 months: HbA1c ordered in **94%** of visits, lipid profile **71%**, kidney function test **58%**, **urine albumin–creatinine ratio 31%**, retinal screening referral **14%**.\n**Your own rates: 97 · 76 · 61 · 34 · 12.**\nThe urine ACR is the item this specialty leaves out most often, here and in the published Indian diabetes-care audit literature alike. **That is a count of what was ordered. It is not a statement about what should be** — I am showing you the distribution, not correcting you.',
    'this hospital’s own 744 T2DM follow-up visits, 12 months · published Indian audit literature',
    ['Does Lakshmi Devi have kidney disease?'],
  ),
  entry(
    ['telugu', 'phrase', 'counsel', 'explain', 'vernacular', 'language'],
    'Four lines are on the card above, and the hardest of them is the money question: **"మే నెలలో పన్నెండు రోజులు మాత్రలు తీసుకోలేదని రికార్డులో ఉంది. మర్చిపోయారా, లేక డబ్బు ఇబ్బందా? నిజం చెప్పండి — తప్పు లేదు."**\n"The record shows twelve days in May without tablets. Did you forget, or was money difficult? Tell me the truth — there is no blame in it."\nThat is deliberately built so that **the cheaper answer is not the shameful one**. All four lines stay under 14 words, use the respectful plural, and use **షుగర్** rather than మధుమేహం, because that is the word patients here actually use.\n**Phrasing only. You choose the message.**',
    undefined,
    ['What does this specialty usually order for T2DM here?'],
  ),
];

export const SPECIALTY_FALLBACK: ChatReply = {
  text: 'I answer two kinds of question: **what does the reference say** — drug labels, the NTEP card, IDSP bulletins, published ranges — and **what does this hospital’s own data show**. Try **the metformin renal bands**, **dengue in Kukatpally this month**, **the NTEP month-5 smear**, **what this specialty orders for T2DM here**, or **Telugu counselling phrasing**.\nI do not answer "what is wrong with this patient". Ask me that and I will tell you exactly why.',
  followups: [
    'Does Lakshmi Devi have kidney disease?',
    'What does the metformin label say about renal function?',
  ],
  tier: 'amber',
};
