import type {
  AiCallingOverview,
  CallLogEntry,
  WhatsAppConversation,
  WhatsAppOverview,
} from './types';

// The two AI channels of the front desk, from the prototype (02-reception.html, WhatsApp Assistant
// and AI Calling). Invented people throughout. Every AI-written message here that has not gone out
// is a draft: it is sent only from a person's approval.

export function seedWhatsApp(): WhatsAppOverview {
  return {
    banner: 'AI answered 23 chats today · 3 missed calls recovered',
    stats: [
      { label: 'Chats handled', value: '142' },
      { label: 'Bookings confirmed', value: '37' },
      { label: 'Missed calls recovered', value: '11' },
      { label: 'Avg. response time', value: '8 sec' },
      { label: 'Reschedules handled', value: '14' },
    ],
    conversations: [
      {
        id: 'wa-irfan',
        patientName: 'Mohd. Irfan',
        phone: '+91 98480 2231•',
        topic: 'Reschedule · needs approval',
        messages: [
          {
            id: 'irfan-1',
            direction: 'out',
            ai: true,
            text: 'Reminder: your appointment with Dr. K. Ramesh is today at 11:00 AM, Room 3. Token T-15.',
            time: '09:30 AM',
          },
          {
            id: 'irfan-2',
            direction: 'in',
            ai: false,
            text: 'Stuck in traffic near Miyapur. Can I move my 11:00 AM slot with Dr. Ramesh?',
            time: '10:41 AM',
          },
        ],
        draft: {
          id: 'draft-irfan',
          title: 'AI reschedule suggestion',
          summary:
            "Mohd. Irfan messaged asking to move his 11:00 AM slot with Dr. Ramesh — he's stuck in traffic. AI suggests offering the 12:30 PM slot (currently open) and notifying the front desk.",
          message:
            'Namaste Mohd. Irfan — no problem! We have moved your appointment with Dr. K. Ramesh to 12:30 PM today. Please reach Room 3 by 12:20 PM. — Sri Venkateshwara Multi-Speciality Hospital',
        },
      },
      {
        id: 'wa-padma',
        patientName: 'Padma Sree',
        phone: '+91 98480 1123•',
        topic: 'Booked by the assistant',
        messages: [
          {
            id: 'padma-1',
            direction: 'out',
            ai: true,
            lang: 'te',
            text: 'నమస్తే! Sri Venkateshwara Hospital కి స్వాగతం. మీకు ఏ డాక్టర్ కావాలి?',
            gloss: 'Namaste! How can I help you today?',
            time: '09:24 AM',
          },
          {
            id: 'padma-2',
            direction: 'in',
            ai: false,
            lang: 'te',
            text: 'Dr. Sunitha Rao గారికి అపాయింట్‌మెంట్ కావాలి, రేపు',
            gloss: 'I need an appointment with Dr. Sunitha Rao tomorrow.',
            time: '09:24 AM',
          },
          {
            id: 'padma-3',
            direction: 'out',
            ai: true,
            lang: 'te',
            text: 'తప్పకుండా! రేపు (19 Jul) Dr. Sunitha Rao గారి అందుబాటులో ఉన్న స్లాట్‌లు — ఒకటి ఎంచుకోండి:',
            gloss:
              'Of course! Dr. Sunitha Rao’s open slots tomorrow (19 Jul) — pick one:',
            time: '09:25 AM',
            quickReplies: [
              { value: '10:00 AM', label: '10:00 AM — available' },
              { value: '11:30 AM', label: '11:30 AM — available' },
              { value: '04:00 PM', label: '04:00 PM — available' },
            ],
            chosenReply: '11:30 AM',
          },
          {
            id: 'padma-4',
            direction: 'in',
            ai: false,
            lang: 'te',
            text: '11:30 AM బాగుంటుంది 👍',
            gloss: '11:30 AM works 👍',
            time: '09:25 AM',
          },
          {
            id: 'padma-5',
            direction: 'out',
            ai: true,
            lang: 'te',
            text: 'Confirmed ✅ Padma Sree — Dr. Sunitha Rao, 19 Jul 2026, 11:30 AM, Room 5 — token T-09. షెడ్యూల్ కన్ఫర్మ్ అయ్యింది.',
            gloss:
              'Confirmed — Dr. Sunitha Rao, 19 Jul 2026, 11:30 AM, Room 5, token T-09. Token will be sent 1 hour before.',
            time: '09:26 AM',
          },
        ],
        draft: null,
      },
    ],
  };
}

// A missed call, recovered: the assistant drafts the first WhatsApp message to the caller, and a
// person approves it before it goes.
export function missedCallConversation(id: string): WhatsAppConversation {
  return {
    id,
    patientName: '+91 99887 4431•',
    phone: 'Missed call · 09:29 AM · rang 40 sec',
    topic: 'Missed call · needs approval',
    messages: [],
    draft: {
      id: `${id}-draft`,
      title: 'AI-drafted missed-call reply',
      summary:
        'This number rang the front desk for 40 seconds at 09:29 AM and nobody answered. The assistant drafted a reply in Telugu, the language most callers from this area use.',
      message:
        'నమస్తే 🙏 మీరు Sri Venkateshwara Hospital కి కాల్ చేశారు — క్షమించండి, మిస్ అయ్యింది. అపాయింట్‌మెంట్ కావాలా? ఇక్కడే రిప్లై చేయండి. (You called us — sorry we missed it. Reply here to book an appointment.)',
    },
  };
}

const LOG: [string, CallLogEntry['outcomeTone'], ...string[]][] = [
  [
    '→ Escalated to Swapna',
    'crit',
    '10:39 AM',
    'Inbound',
    'B. Nagaraju',
    '49M · +91 90104 8••••',
    'Caller began describing symptoms — agent stopped and transferred',
    'Telugu',
    '0:36',
    '₹1.50',
  ],
  [
    'Do not call again',
    'warn',
    '10:12 AM',
    'Outbound · dues',
    'P. Kondal Reddy',
    '58M',
    '₹3,400 outstanding — patient asked to be removed; agent stopped and logged it',
    'Telugu',
    '0:48',
    '₹2.00',
  ],
  [
    'Rescheduled to 22 Jul',
    'good',
    '09:58 AM',
    'Inbound',
    'Ritu Agarwal',
    '34F',
    'Moved her Gynecology slot herself, in the call',
    'English',
    '1:12',
    '₹3.00',
  ],
  [
    'No answer · retry 4:30 PM',
    'neutral',
    '09:52 AM',
    'Outbound · reminder',
    'M. Sailoo',
    '57M',
    'Reminder for Mon 20 Jul, 09:30 AM',
    'Telugu',
    '0:24',
    '₹1.00',
  ],
  [
    'Report ready — informed',
    'good',
    '09:44 AM',
    'Outbound · lab',
    'T. Anjaneyulu',
    '62M',
    'HbA1c report ready for collection — status only, no values spoken',
    'Telugu',
    '0:48',
    '₹2.00',
  ],
  [
    '→ Escalated to Swapna',
    'crit',
    '09:30 AM',
    'Outbound · post-discharge',
    'G. Vijaya Lakshmi',
    '61F',
    'Day-2 check-in — caller became angry about a billing item, agent transferred',
    'Telugu',
    '1:36',
    '₹4.00',
  ],
  [
    'Wrong number — flagged',
    'warn',
    '09:21 AM',
    'Outbound · recall',
    'M. Sarojini',
    '48F · number on file',
    'Answered by a stranger — number flagged for the front desk to correct',
    'Telugu',
    '0:24',
    '₹1.00',
  ],
  [
    'Confirmed for Mon 20 Jul',
    'good',
    '09:12 AM',
    'Outbound · reminder',
    'Ch. Vijaya',
    '55F',
    'Reminder — Dr. Sunitha Rao, Gynecology',
    'Hindi',
    '1:00',
    '₹2.50',
  ],
  [
    '→ Escalated to Swapna',
    'crit',
    '09:05 AM',
    'Inbound',
    '+91 99120 4••••',
    'no record match',
    'Asked the agent to interpret a lab report — refused and transferred',
    'Telugu',
    '0:24',
    '₹1.00',
  ],
  [
    'Paid on the UPI link',
    'good',
    '09:02 AM',
    'Outbound · dues',
    'B. Nagaraju',
    '49M',
    '₹1,850 balance — UPI link sent during the call, paid before it ended',
    'Telugu',
    '1:24',
    '₹3.50',
  ],
];

export function seedAiCalling(): AiCallingOverview {
  return {
    banner:
      'The voice agent took 41 calls today and handed 3 to Swapna the moment they stopped being about appointments. ₹185 of call minutes.',
    kpis: [
      {
        id: 'calls',
        label: 'Calls today',
        value: '41',
        delta: '29 outbound · 12 inbound',
      },
      {
        id: 'handled',
        label: 'Handled without a human',
        value: '32',
        delta: 'of 35 answered · 91%',
        trend: 'up',
        sentiment: 'good',
      },
      {
        id: 'escalated',
        label: 'Escalated to a human',
        value: '3',
        delta: '2 clinical · 1 upset caller',
      },
      {
        id: 'cost',
        label: 'Call cost today',
        value: '₹185',
        delta: '74 min metered @ ₹2.50/min · ₹4.51 avg per call',
      },
    ],
    calls: [
      {
        id: 'call-yadamma',
        label: 'Outbound follow-up recall',
        title: 'Outbound · K. Yadamma, 63F',
        subtitle: 'Follow-up recall · +91 98493 21574',
        durationSeconds: 132,
        steps: [
          {
            kind: 'system',
            id: 'y-0',
            text: 'Dialling +91 98493 21574 · follow-up recall · language on her record: Telugu',
          },
          turn('y-1', true, '0:06', {
            te: 'నమస్తే, ఇది శ్రీ వేంకటేశ్వర హాస్పిటల్ నుండి ఆటోమేటిక్ కాల్. నేను హాస్పిటల్ AI అసిస్టెంట్‌ని — మనిషిని కాదు. యాదమ్మ గారు మాట్లాడుతున్నారా?',
            hi: 'नमस्ते, यह श्री वेंकटेश्वर हॉस्पिटल से एक स्वचालित कॉल है। मैं हॉस्पिटल की AI असिस्टेंट हूँ — कोई व्यक्ति नहीं। क्या मैं यादम्मा जी से बात कर रही हूँ?',
            en: 'Namaste, this is an automated call from Sri Venkateshwara Hospital. I am the hospital’s AI assistant — not a person. Am I speaking with Yadamma garu?',
          }),
          turn(
            'y-2',
            false,
            '0:12',
            {
              te: 'అవును, నేనే మాట్లాడుతున్నాను.',
              hi: 'हाँ, मैं ही बोल रही हूँ।',
              en: 'Yes, this is her.',
            },
            'K. Yadamma · patient',
          ),
          turn('y-3', true, '0:28', {
            te: 'మీ షుగర్ రివ్యూ 2 జూలైకి రావాల్సింది, 16 రోజులు దాటింది. Dr. K. Ramesh గారితో ఇప్పుడే అపాయింట్‌మెంట్ పెట్టాలా?',
            hi: 'आपका शुगर रिव्यू 2 जुलाई को होना था, 16 दिन हो गए हैं। क्या मैं Dr. K. Ramesh के साथ अभी अपॉइंटमेंट बुक कर दूँ?',
            en: 'Your diabetes review was due on 2 July — that is 16 days ago. Shall I book an appointment with Dr. K. Ramesh now?',
          }),
          turn(
            'y-4',
            false,
            '0:35',
            {
              te: 'సోమవారం పొద్దున అయితే వస్తాను.',
              hi: 'सोमवार सुबह हो जाए तो आ जाऊँगी।',
              en: 'I can come on Monday morning.',
            },
            'K. Yadamma · patient',
          ),
          turn('y-5', true, '0:52', {
            te: 'సోమవారం, 20 జూలై — Dr. K. Ramesh గారికి ఉదయం 9:30 లేదా మధ్యాహ్నం 12:00 ఖాళీగా ఉన్నాయి. ఏది కావాలి?',
            hi: 'सोमवार, 20 जुलाई — Dr. K. Ramesh के पास सुबह 9:30 या दोपहर 12:00 खाली है। कौन सा समय चाहिए?',
            en: 'Monday 20 July — Dr. K. Ramesh has 9:30 AM or 12:00 noon free. Which would you like?',
          }),
          turn(
            'y-6',
            false,
            '0:58',
            { te: '9:30 సరిపోతుంది.', hi: '9:30 ठीक है।', en: '9:30 works.' },
            'K. Yadamma · patient',
          ),
          turn('y-7', true, '1:32', {
            te: 'బుక్ చేశాను — సోమవారం 20 జూలై, ఉదయం 9:30, Dr. K. Ramesh, రూమ్ 3, టోకెన్ T-29. వాట్సాప్‌లో కన్ఫర్మేషన్ పంపుతాము; ₹500 కన్సల్టేషన్ ఫీజుకి UPI లింక్ కూడా ఉంటుంది.',
            hi: 'बुक हो गया — सोमवार 20 जुलाई, सुबह 9:30, Dr. K. Ramesh, रूम 3, टोकन T-29। WhatsApp पर कन्फर्मेशन भेजेंगे; ₹500 कंसल्टेशन फीस के लिए UPI लिंक भी।',
            en: 'Booked — Monday 20 July, 9:30 AM, Dr. K. Ramesh, Room 3, token T-29. We will send a WhatsApp confirmation with a UPI link for the ₹500 consultation fee — pay in advance and you can skip the counter queue.',
          }),
          turn(
            'y-8',
            false,
            '1:38',
            {
              te: 'సరే, ధన్యవాదాలు.',
              hi: 'ठीक है, धन्यवाद।',
              en: 'Alright, thank you.',
            },
            'K. Yadamma · patient',
          ),
          turn('y-9', true, '1:52', {
            te: 'ధన్యవాదాలు. ఈ కాల్‌లు ఇకపై రావద్దు అనుకుంటే “వద్దు” అని చెప్పండి — శాశ్వతంగా ఆపేస్తాము.',
            hi: 'धन्यवाद। अगर आप ये कॉल नहीं चाहतीं तो “नहीं” कह दें — हम इन्हें हमेशा के लिए बंद कर देंगे।',
            en: 'Thank you. If you would rather not receive these calls, just say “no” — we will stop them permanently.',
          }),
          {
            kind: 'system',
            id: 'y-10',
            text: 'Call ended · 2:12 · metered ₹5.50 at ₹2.50/min',
          },
        ],
        writeBack: [
          {
            id: 'wb-appointment',
            title: 'Appointment created',
            detail:
              'Mon 20 Jul 2026, 09:30 AM · Dr. K. Ramesh · Room 3 — FHIR Encounter, same record a walk-in would create',
          },
          {
            id: 'wb-token',
            title: 'Token T-29 issued',
            detail:
              'From the same sequence as the counter, so it cannot collide with a walk-in token',
          },
          {
            id: 'wb-flag',
            title: 'Follow-up flag cleared',
            detail:
              'She leaves the overdue list — 29 → 28 still overdue of the 34 Analytics found',
          },
          {
            id: 'wb-slot',
            title: 'Tomorrow’s 09:30 slot taken',
            detail:
              'Free slots for Mon 20 Jul: 11 → 10, updated in Appointments',
          },
          {
            id: 'wb-recording',
            title: 'Recording, transcript and cost attached',
            detail:
              '2:12 · ₹5.50 metered against your plan (ADR #8) · AI worker named in the audit log',
          },
        ],
        followUp: {
          id: 'followup-yadamma',
          title: 'AI-drafted confirmation after the call',
          summary:
            'The agent promised a WhatsApp confirmation. It is drafted from what the call booked and waits for your approval.',
          recipient: 'K. Yadamma · +91 98493 21574',
          message:
            'Namaste Yadamma garu — your appointment is booked: Mon 20 Jul 2026, 9:30 AM, Dr. K. Ramesh, Room 3, token T-29. Pay the ₹500 consultation fee by UPI before you come and skip the counter queue. — Sri Venkateshwara Multi-Speciality Hospital',
        },
      },
      {
        id: 'call-escalation',
        label: 'The 10:39 escalation',
        title: 'Inbound · +91 90104 8••••',
        subtitle: 'Answered by the AI agent · 10:39 AM',
        durationSeconds: 36,
        steps: [
          {
            kind: 'system',
            id: 'e-0',
            text: 'Inbound · +91 90104 8•••• · number matches the record of B. Nagaraju, 49M · answered by the agent in 1.2 s',
          },
          turn('e-1', true, '0:04', {
            te: 'నమస్తే, శ్రీ వేంకటేశ్వర హాస్పిటల్. నేను హాస్పిటల్ AI అసిస్టెంట్‌ని. ఇది నాగరాజు గారి నంబర్ లాగా కనిపిస్తోంది — ఎలా సహాయం చేయగలను?',
            hi: 'नमस्ते, श्री वेंकटेश्वर हॉस्पिटल। मैं हॉस्पिटल की AI असिस्टेंट हूँ। यह नागराजू जी का नंबर लग रहा है — मैं कैसे मदद कर सकती हूँ?',
            en: 'Namaste, Sri Venkateshwara Hospital. I am the hospital’s AI assistant. This looks like Mr. Nagaraju’s number — how can I help?',
          }),
          turn(
            'e-2',
            false,
            '0:14',
            {
              te: 'మా నాన్నగారికి ఛాతీలో నొప్పిగా ఉంది, చెమటలు పడుతున్నాయి. ఏం చేయాలి?',
              hi: 'मेरे पिताजी को छाती में दर्द हो रहा है और पसीना आ रहा है। क्या करें?',
              en: 'My father has chest pain and he is sweating. What should we do?',
            },
            'Caller · son',
          ),
          turn('e-3', true, '0:21', {
            te: 'ఇది నేను చెప్పగలిగే విషయం కాదు. మిమ్మల్ని ఇప్పుడే మా ఫ్రంట్ డెస్క్‌లో స్వప్న గారికి కలుపుతున్నాను — లైన్‌లోనే ఉండండి. మీకు అత్యవసరం అనిపిస్తే వెంటనే 108కి కాల్ చేయండి.',
            hi: 'यह ऐसी बात नहीं है जिस पर मैं कुछ कह सकूँ। मैं आपको अभी हमारे फ्रंट डेस्क पर स्वप्ना जी से जोड़ रही हूँ — लाइन पर ही रहिए। अगर आपको यह आपातकाल लगे तो तुरंत 108 पर कॉल करें।',
            en: 'This is not something I can advise on. I am connecting you to Swapna at our front desk right now — please stay on the line. If you feel this is an emergency, call 108 immediately.',
          }),
          {
            kind: 'system',
            id: 'e-4',
            critical: true,
            text: 'Transferred to Swapna · 3.1 s after the symptom was mentioned · the call never dropped · she picked up at 10:39 AM',
          },
          {
            kind: 'system',
            id: 'e-5',
            text: 'The agent asked no follow-up question, gave no advice and assigned no urgency level. Triage by acuity is RED tier under ADR #7 — it needs a CDSCO licence this product does not hold. Stopping here is the designed behaviour, not a failure.',
          },
        ],
        writeBack: [],
        followUp: null,
      },
    ],
    recallDraft: {
      id: 'recall-12',
      title: 'Recall list ready to dial — 12 patients',
      body: 'The remaining overdue follow-ups, scripted per patient in the language on their record — 9 Telugu, 2 Hindi, 1 English. Estimated 29 min of call minutes, about ₹72. Nothing dials until you approve; the TRAI calling window closes at 8:00 PM.',
      source:
        'Analytics → Money Leaks, 34 overdue follow-ups · est. ₹40,800 · ADR #8 metering records every call minute against your plan',
    },
    campaigns: [
      campaign(
        'reminders',
        'Appointment reminders',
        "Tomorrow's 09:00–13:00 list",
        8,
        '6 confirmed · 1 rescheduled · 1 no answer',
        'Te 5 · Hi 2 · En 1',
        '10',
        '₹25',
      ),
      campaign(
        'recall',
        'Follow-up recall',
        '34 overdue · est. ₹40,800 (Analytics)',
        12,
        '5 booked · 2 declined · 2 no answer · 1 escalated · 1 wrong number · 1 do-not-call',
        'Te 9 · Hi 2 · En 1',
        '28',
        '₹70',
      ),
      campaign(
        'lab',
        'Lab report ready',
        'Status only — never the values',
        4,
        '3 informed · 1 no answer',
        'Te 3 · En 1',
        '4',
        '₹10',
      ),
      campaign(
        'discharge',
        'Post-discharge check-in',
        'Day 2 after discharge',
        3,
        '2 completed · 1 escalated (upset about a bill)',
        'Te 3',
        '10',
        '₹25',
      ),
      campaign(
        'dues',
        'Payment / dues reminder',
        'Sends a UPI link during the call',
        2,
        '1 paid on the UPI link · 1 do-not-call',
        'Te 2',
        '4',
        '₹10',
      ),
      campaign(
        'inbound',
        'Inbound — agent answers',
        'Caller matched by number to the record',
        12,
        '3 booked · 3 questions answered · 2 rescheduled · 2 cancelled · 1 escalated · 1 wrong number',
        'Te 8 · Hi 2 · En 2',
        '18',
        '₹45',
      ),
    ],
    campaignNote:
      'The recall campaign is the arithmetic an owner asks about: ₹70 of call minutes so far → 5 patients rebooked → ₹6,000 of visits recovered out of the ₹40,800 on the list. 29 of the 34 are still overdue; 22 have not been called yet.',
    queue: [
      queued(
        'q-yadamma',
        'K. Yadamma',
        '63F',
        'T2DM review overdue since 02 Jul · Dr. K. Ramesh',
        'తెలుగు',
        'te',
      ),
      queued(
        'q-sailoo',
        'M. Sailoo',
        '57M',
        'Post-fracture check overdue since 28 Jun · reminder for 20 Jul 09:30',
        'తెలుగు',
        'te',
      ),
      queued(
        'q-zubeda',
        'Sk. Zubeda',
        '51F',
        'BP review overdue since 09 Jul · high no-show risk for 20 Jul 12:30',
        'हिन्दी',
        'hi',
      ),
      queued(
        'q-ritu',
        'Ritu Agarwal',
        '34F',
        'Lab report ready for collection — status only, no values read out',
        'English',
        'en',
      ),
      {
        ...queued(
          'q-kondal',
          'P. Kondal Reddy',
          '58M',
          'Asked not to be called again, 10:12 AM — excluded from every campaign',
          'తెలుగు',
          'te',
        ),
        doNotCall: true,
      },
    ],
    limits: [
      {
        mark: '✕',
        text: 'It never asks about symptoms and never assigns an urgency level. Triage by acuity is RED tier under ADR #7 — it needs a CDSCO licence, and we do not have one.',
      },
      {
        mark: '✕',
        text: 'It gives no medical advice, not even reassurance. "It\'s probably nothing" is a clinical statement.',
      },
      {
        mark: '✕',
        text: 'It reads out report status, never report values. "Your HbA1c is ready" — not the number.',
      },
      {
        mark: '→',
        text: 'Anything clinical, anyone upset, anything it is not confident about: the live call goes to a human within one turn and stays connected while it transfers.',
      },
      {
        mark: '→',
        text: 'Outside 09:00 AM – 08:00 PM it does not dial at all. Inbound is answered 24×7 and after hours it books or takes a message.',
      },
      {
        mark: '✓',
        text: "Every call is recorded, transcribed and attached to the patient's record with the AI worker named — the same audit trail as any other AI action (ADR #7).",
      },
    ],
    consent: {
      window: '09:00 AM – 08:00 PM',
      optOut: 'Yes — spoken, in their language',
      doNotCallCount: 7,
      maxAttempts: 2,
      request: {
        id: 'dnc-kondal',
        patientName: 'P. Kondal Reddy',
        detail:
          'said "don\'t call me again" at 10:12 AM. HOS has already stopped calling him. Confirming makes it permanent across voice and WhatsApp.',
        confirmed: false,
      },
    },
    log: LOG.map(
      (
        [
          outcome,
          outcomeTone,
          time,
          direction,
          who,
          whoDetail,
          about,
          language,
          duration,
          cost,
        ],
        index,
      ) => ({
        id: `log-${index}`,
        outcome,
        outcomeTone,
        time,
        direction,
        who,
        whoDetail,
        about,
        language,
        duration,
        cost,
      }),
    ),
  };
}

function turn(
  id: string,
  ai: boolean,
  at: string,
  text: { te: string; hi: string; en: string },
  speaker = 'AI agent',
): AiCallingOverview['calls'][number]['steps'][number] {
  return { kind: 'turn', id, ai, at, speaker, text };
}

function campaign(
  id: string,
  name: string,
  detail: string,
  called: number,
  outcome: string,
  languages: string,
  minutes: string,
  cost: string,
): AiCallingOverview['campaigns'][number] {
  return {
    id,
    name,
    detail,
    called,
    outcome,
    languages,
    minutes,
    cost,
    running: true,
  };
}

function queued(
  id: string,
  patientName: string,
  ageSex: string,
  why: string,
  language: string,
  languageCode: 'te' | 'hi' | 'en',
): AiCallingOverview['queue'][number] {
  return {
    id,
    patientName,
    ageSex,
    why,
    language,
    languageCode,
    doNotCall: false,
  };
}
