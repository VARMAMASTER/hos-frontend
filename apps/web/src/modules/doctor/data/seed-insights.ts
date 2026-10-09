import type { InsightsOverview, InsightsResult } from './types';

// Invented sample data, from the prototype page (os/public/03-doctor.html, data-panel="insights").
// The Scribe reads the doctor's own approved transcripts. Insights are private to the doctor,
// suggestions and never report cards, and each one is a draft the doctor acts on or dismisses.

export function seedInsightsOverview(): InsightsOverview {
  return {
    doctorName: 'Dr. K. Ramesh',
    intro:
      'The Scribe reads every approved transcript — across visits it starts seeing what one visit can’t show. Private to you; insights are suggestions, never report cards.',
    steps: [
      'Reading 412 approved consultation transcripts (18 Jun – 18 Jul)…',
      'Clustering symptoms, diagnoses & follow-up mentions…',
      'Cross-referencing your orders, templates & schedule…',
      'Drafting 3 insights…',
    ],
  };
}

export function seedInsightsResult(): InsightsResult {
  return {
    insights: [
      {
        id: 'neuropathy',
        title: 'Clinical pattern — worth a screening habit',
        chip: 'From 412 transcripts',
        chipTone: 'ai',
        text: '**14 of your 62 T2DM patients mentioned foot tingling or numbness** in the last 30 days — but only 5 have a documented monofilament test. The other 9 are one line away from a missed neuropathy diagnosis. Your T2DM follow-up template doesn’t include the screen yet.',
        chart: {
          label: 'Foot tingling in T2DM patients, last 30 days',
          unit: 'patients',
          bars: [
            { label: 'Mentioned tingling or numbness', value: 14 },
            { label: 'Monofilament test documented', value: 5 },
            { label: 'No documented test', value: 9 },
          ],
        },
        action: {
          id: 'template',
          label: 'Add screen to T2DM template',
          doneLabel:
            'Monofilament screen added to your T2DM follow-up template',
        },
        secondary: {
          id: 'patients',
          label: 'See the 9 patients',
          doneLabel: 'List of 9 patients sent to your queue for recall',
        },
      },
      {
        id: 'tuesday',
        title: 'Schedule pattern — Tuesday clinic runs late',
        chip: 'From consult timestamps',
        chipTone: 'ai',
        text: 'Your **Tuesday 11 AM–1 PM block runs 22 minutes late on average** — the only block where patients mention waiting in the transcripts (3× more than any other slot). Root cause looks structural: 5 slots booked against your average 14-minute Tuesday consults. One fewer slot would absorb it.',
        chart: {
          label: 'Minutes late by clinic block, last 30 days',
          unit: 'min',
          bars: [
            { label: 'Mon 9–11', value: 6 },
            { label: 'Mon 11–1', value: 9 },
            { label: 'Tue 9–11', value: 8 },
            { label: 'Tue 11–1', value: 22 },
            { label: 'Wed 9–11', value: 7 },
            { label: 'Wed 11–1', value: 10 },
          ],
        },
        action: {
          id: 'slots',
          label: 'Adjust Tuesday slots',
          doneLabel:
            'Reception asked to book 4 slots in the Tuesday 11–1 block',
        },
      },
      {
        id: 'working',
        title: "What's working — keep doing this",
        chip: 'Positive signal',
        chipTone: 'good',
        text: 'You explain dosage in **Telugu 92% of the time** — and your patients make **18% fewer confused follow-up calls** about medicines than the hospital average. The WhatsApp assistant now mirrors your Telugu phrasing style in its reminders to your patients.',
        action: {
          id: 'ack',
          label: 'Acknowledge',
          doneLabel: 'Noted',
        },
      },
    ],
    footnote:
      'Computed from your approved consultation transcripts only · visible to you, not to management · every insight is a suggestion you can act on or ignore.',
  };
}
