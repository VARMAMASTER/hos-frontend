import type { QueueOverview } from './types';

// Invented sample data, from the prototype page (os/public/03-doctor.html, data-panel="queue").

// The patient whose chart the clinical tabs hold: the one in the room at the start of the session.
export const OPEN_PATIENT_TOKEN = 'T-12';

export function seedQueue(): QueueOverview {
  return {
    session: {
      doctorName: 'Dr. K. Ramesh',
      department: 'General Medicine',
      room: 'Room 3',
      dateLabel: 'Saturday, 18 Jul 2026',
      sessionLabel: 'OPD session 09:00 AM – 01:00 PM',
      nowLabel: '10:47 AM',
      runningBehindMinutes: 12,
    },
    entries: [
      {
        token: 'T-12',
        name: 'Lakshmi Devi',
        ageSex: '58F',
        status: 'in-room',
        complaint: 'T2DM follow-up',
        urgency: 'review',
      },
      {
        token: 'T-10',
        name: 'Venkatesh Naidu',
        ageSex: '44M',
        status: 'done',
        complaint: 'Hypertension review',
        urgency: 'routine',
      },
      {
        token: 'T-14',
        name: 'Mohd. Irfan',
        ageSex: '32M',
        status: 'waiting',
        complaint: 'Fever 3 days',
        urgency: 'urgent',
      },
      {
        token: 'T-15',
        name: 'N. Mahesh',
        ageSex: '39M',
        status: 'waiting',
        complaint: 'Cough & cold',
        urgency: 'routine',
      },
      {
        token: 'T-17',
        name: 'D. Prakash',
        ageSex: '51M',
        status: 'waiting',
        complaint: 'Knee pain',
        urgency: 'routine',
      },
      {
        token: 'T-21',
        name: 'G. Ramulu',
        ageSex: '63M',
        status: 'booked',
        complaint: 'Diabetic review',
        urgency: 'review',
      },
      {
        token: 'T-24',
        name: 'S. Yadamma',
        ageSex: '70F',
        status: 'booked',
        complaint: 'BP check',
        urgency: 'routine',
      },
    ],
    listed: { next: 7, total: 26 },
    kpis: [
      {
        id: 'done',
        label: 'Consults done today',
        value: '14 / 26',
        delta: '54% through the list',
        trend: 'flat',
      },
      {
        id: 'wait',
        label: 'Avg wait time',
        value: '14 min',
        delta: '3 min vs last Saturday',
        trend: 'down',
        sentiment: 'good',
      },
      {
        id: 'length',
        label: 'Avg consult length',
        value: '8 min',
        delta: 'target 10 min',
        trend: 'flat',
      },
      {
        id: 'behind',
        label: 'Running behind by',
        value: '12 min',
        delta: 'since 10:15 AM',
        trend: 'down',
        sentiment: 'warn',
      },
    ],
    hourly: [
      { hour: '9–10 AM', consults: 3 },
      { hour: '10–11 AM', consults: 4 },
      { hour: '11–12 PM', consults: 3 },
      { hour: '12–1 PM', consults: 4, partial: true },
    ],
    weekWait: [
      { day: 'Mon', minutes: 16 },
      { day: 'Tue', minutes: 15 },
      { day: 'Wed', minutes: 17 },
      { day: 'Thu', minutes: 14 },
      { day: 'Fri', minutes: 15 },
      { day: 'Sat', minutes: 14 },
    ],
    weekWaitNote:
      '17 min avg on Wed (clinic double-booked) · today trending better at 14 min',
  };
}
