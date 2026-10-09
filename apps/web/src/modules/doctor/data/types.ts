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

// --- Progress notes ----------------------------------------------------------------------------

export type NoteState = 'ready' | 'blocked' | 'filed' | 'rejected';

export interface NoteRow {
  id: string;
  patient: PatientRef;
  // "in room": where the patient is, when that matters.
  where?: string;
  // What the scribe has drafted: "S · O · A ready", or "S · O · A ready · P empty".
  draftLabel: string;
  seenFor: string;
  // What the doctor usually changes in these drafts (what the assistant has learned).
  usuallyChange: string;
  state: NoteState;
}

export interface NotesOverview {
  // The signed-in doctor: approvals are recorded against their name.
  doctorName: string;
  drafted: { withDraft: number; completed: number };
  metrics: DoctorMetric[];
  // What the product will not claim: no bare percentage, the published figure beside ours.
  honestNote: string;
  rows: NoteRow[];
}

// A drafted note, opened for the doctor to read and sign. The plan is the doctor's own words,
// transcribed verbatim: the scribe does not compose one.
export interface NoteDraft {
  noteId: string;
  title: string;
  subjective: SoapLine;
  objective: SoapLine;
  assessment: SoapLine;
  plan: SoapLine;
  sourceLine: string;
}

// --- Orders & prescriptions --------------------------------------------------------------------

export type FactTone = 'good' | 'warn' | 'crit' | 'neutral';

// A fact the record holds about an orderable item (last done, never done): a statement of record,
// never a recommendation. Surfacing a care gap is AMBER; ticking the box is the doctor's.
export interface OrderFact {
  text: string;
  tone: FactTone;
}

export interface OrderItem {
  id: string;
  group: 'lab' | 'imaging';
  name: string;
  fact?: OrderFact;
  // The doctor already ordered it: the only reason a box starts ticked.
  ordered: boolean;
}

export interface OrderTemplate {
  id: string;
  name: string;
  labs: string;
  rx: string;
  // Rx dose fields are blank in a template: a dose is typed for the patient in front of you.
  doseNote?: string;
  uses: number;
  specialty: string;
  itemIds: string[];
}

export interface FormularyRow {
  id: string;
  cost: string;
  costNote: string;
  drug: string;
  tag: { text: string; tone: 'neutral' | 'ai' };
  brand: string;
  generic: string;
  stock: { text: string; tone: 'good' | 'warn' };
}

export interface RenalBand {
  range: string;
  text: string;
}

// The label's own dose bands, as reference. The dose for this patient is a field that stays empty.
export interface DoseReference {
  drug: string;
  defaults: string;
  bands: string;
  note: string;
  label: {
    title: string;
    bands: RenalBand[];
    patientNote: string;
    disclaimer: string;
  };
}

export interface PrintPhrase {
  id: string;
  local: string;
  en: string;
}

export interface OrdersOverview {
  patient: PatientRef;
  items: OrderItem[];
  templates: OrderTemplate[];
  // Allergies surfaced before the pen moves, as words.
  allergyBanner: string;
  formulary: FormularyRow[];
  formularyTotal: { cost: string; costNote: string; note: string };
  dose: DoseReference;
  printing: { teluguShare: string; phrases: PrintPhrase[] };
  sourcesNote: string;
}

export interface OrderRequest {
  itemIds: string[];
  // The doctor flagged an admission: a bed request is queued to IPD.
  admit: boolean;
}

export interface OrderReceipt {
  summary: string;
  admitFlagged: boolean;
}

export interface TemplateRequest {
  name: string;
  specialty: string;
  itemIds: string[];
}
