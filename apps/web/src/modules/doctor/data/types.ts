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

// --- Consultation ------------------------------------------------------------------------------

// The pre-consult briefing: facts, assembled from the record by the AI and shown as a draft summary.
// Nothing in it is filed.
export interface Briefing {
  steps: string[];
  facts: string[];
  // Allergies lead the line, as text, never colour alone.
  allergies: string[];
  warnings: string[];
  source: string;
}

// One block of the reference and consistency check (AMBER): her values beside published ranges and
// her own history. Facts and questions, never an instruction.
export interface CheckBlock {
  id: string;
  title: string;
  // "Reference · your reading", "3 unresolved".
  chip: string;
  chipTone: 'warn' | 'crit';
  text: string;
  why: string[];
  sources: string;
  // What the doctor does with the block when they accept it ("Attach this table to today's note").
  actionLabel: string;
  actionDone: string;
}

export interface ReferenceCheck {
  blocks: CheckBlock[];
  tierNote: string;
}

export interface ScribeSetup {
  languageLabel: string;
  consent: string;
  // What the scribe hears while it records (invented sample consultation), in order.
  interim: string[];
  steps: string[];
}

export interface ConsultationOverview {
  patient: PatientRef;
  doctorName: string;
  room: string;
  inRoomSince: string;
  briefing: Briefing;
  checkSteps: string[];
  checkIntro: string;
  scribe: ScribeSetup;
}

// A SOAP section in the language it was said in, with an English gloss.
export interface SoapLine {
  text: string;
  gloss: string;
  lang: string;
}

export interface RxLine {
  id: string;
  drug: string;
  dispensedAs?: string;
  dosageLocal: string;
  dosageEn: string;
  since: string;
  duration: string;
}

// A carry-forward of her existing lines, never a proposal: the doses are the ones already on her
// record, and anything different is typed by the doctor.
export interface PrescriptionDraft {
  lines: RxLine[];
  allergyNote: string;
  costNote: string;
}

// What the scribe wrote after the consultation. There is no plan: the scribe does not write one,
// and the note cannot be signed until the doctor dictates it.
export interface ConsultDraft {
  subjective: SoapLine;
  objective: SoapLine;
  assessment: SoapLine;
  sourceLine: string;
  prescription: PrescriptionDraft;
}

// The note as the doctor signs it: the four sections, the plan in the doctor's own words.
export interface NoteText {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}
