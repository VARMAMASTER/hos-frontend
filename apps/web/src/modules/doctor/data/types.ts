// The Doctor module's domain types: what the tabs read and write through DoctorDataSource. Every
// person in the sample data is invented; a real record never reaches these types in this module's
// mock. Text fields that carry emphasis use **bold** markers, rendered by Nova's safe markdown.

// The tier an AI output belongs to (ADR #7). Only green and amber are ever shown as a feature; red
// (a dose, a diagnosis, a treatment recommendation) is not built, and appears only as the blocked
// chip that says so.
export type DoctorAiTier = 'green' | 'amber';

// A figure at the head of a tab (the prototype's .kpi-row).
export interface DoctorKpi {
  id: string;
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  sentiment?: 'good' | 'warn' | 'crit';
}

// A figure with a long explanation (the prototype's .metric strip on Progress Notes, Coding and My
// AI Team). The source names where a published number comes from.
export interface DoctorMetric {
  id: string;
  value: string;
  label: string;
  source?: string;
}

// The patient a patient-scoped tab is about.
export interface PatientRef {
  token: string;
  name: string;
  ageSex: string;
}

// --- My queue --------------------------------------------------------------------------------

export type QueueStatus = 'in-room' | 'done' | 'waiting' | 'booked';
export type Urgency = 'routine' | 'review' | 'urgent';

export interface QueueEntry {
  token: string;
  name: string;
  ageSex: string;
  status: QueueStatus;
  complaint: string;
  urgency: Urgency;
}

export interface DoctorSession {
  doctorName: string;
  department: string;
  room: string;
  dateLabel: string;
  sessionLabel: string;
  nowLabel: string;
  runningBehindMinutes: number;
}

export interface HourlyConsults {
  hour: string;
  consults: number;
  // The hour is still running, so the count is so far.
  partial?: boolean;
}

export interface DayWait {
  day: string;
  minutes: number;
}

export interface QueueOverview {
  session: DoctorSession;
  entries: QueueEntry[];
  // "next 7 of 26": the roster shows the next few of the day's list.
  listed: { next: number; total: number };
  kpis: DoctorKpi[];
  hourly: HourlyConsults[];
  weekWait: DayWait[];
  weekWaitNote: string;
}
