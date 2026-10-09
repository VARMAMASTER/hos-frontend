// The domain types of the Patient record module. Everything here is invented sample data's shape:
// no real patient, and nothing in these types depends on the UI library, so the real API can
// return the same shapes later.

// A status flag: what it says, and how serious. The words always travel with the tone, so the UI
// never has to rely on colour alone.
export type FlagTone = 'good' | 'warn' | 'crit' | 'info' | 'neutral';

export interface Flag {
  tone: FlagTone;
  label: string;
}

// ---------------------------------------------------------------------------------------------
// The patient, as the persistent header shows them on every tab.
// ---------------------------------------------------------------------------------------------

export interface Allergy {
  id: string;
  substance: string;
  // What happened, when it is known.
  reaction?: string;
  recordedOn: string;
}

export interface PatientHeader {
  id: string;
  name: string;
  initials: string;
  age: number;
  sex: 'Female' | 'Male' | 'Other';
  mrn: string;
  abha: string;
  allergies: Allergy[];
  // The clinician at the screen. A draft is approved against this name.
  clinician: string;
}

// A person's approval of something an AI drafted: who, and when. Nothing AI-made is final without
// one.
export interface DraftApproval {
  draftId: string;
  approver: string;
  // ISO 8601.
  approvedAt: string;
}

// ---------------------------------------------------------------------------------------------
// Clinical snapshot
// ---------------------------------------------------------------------------------------------

export interface BriefDraft {
  id: string;
  title: string;
  paragraphs: string[];
  // Where it was assembled from, in words.
  sources: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  detail: string;
  // The records the finding rests on.
  sources: string;
  // A reference alert (a label limit), left to the clinician's judgement.
  referenceAlert?: boolean;
}

export interface Problem {
  id: string;
  name: string;
  since: string;
  note?: string;
  control: Flag;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  since: string;
  refills: Flag;
}

export interface VitalReading {
  id: string;
  label: string;
  value: string;
  flag?: Flag;
}

export interface VitalsSet {
  recordedOn: string;
  readings: VitalReading[];
}

export interface TrajectoryPoint {
  // "Mar 2022".
  label: string;
  value: number;
}

export interface Trajectory {
  id: string;
  label: string;
  latest: string;
  // The finding in words: "7.1 → 8.4 over 4 yrs".
  direction: Flag;
  target?: string;
  note?: string;
  // A sentence describing the line, for assistive technology.
  description: string;
  unit?: string;
  points: TrajectoryPoint[];
}

export type CareGapAction = 'order' | 'add-today' | 'chase';

export interface CareGap {
  id: string;
  item: string;
  lastDone: string;
  status: Flag;
  // What can be done about it now; absent when nothing is due.
  action?: { kind: CareGapAction; label: string };
  // What was done, once it has been (replaces the action).
  done?: string;
}

export interface OutsideRecord {
  id: string;
  facility: string;
  dateLabel: string;
  summary: string;
  note?: string;
  noteTone?: FlagTone;
}

export interface InteropStep {
  id: string;
  title: string;
  body: string;
}

export interface InteropTrace {
  title: string;
  intro: string;
  steps: InteropStep[];
  // Illustrative, trimmed: never presented as a captured payload.
  payloadNote: string;
  payload: string;
}

export interface PatientSnapshot {
  patient: PatientHeader;
  lastVisit: string;
  // How many events a brief reads.
  eventCount: number;
  vitals: VitalsSet;
  problems: Problem[];
  medications: Medication[];
  attention: AttentionItem[];
  trajectories: Trajectory[];
  careGaps: CareGap[];
  outsideRecords: OutsideRecord[];
  interop: InteropTrace;
}

// ---------------------------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------------------------

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Demographics {
  dateOfBirth: string;
  sex: string;
  phone: string;
  bloodGroup: string;
  address: string;
  emergencyContact: EmergencyContact;
  registeredOn: string;
  registeredBy: string;
}

export interface Condition {
  id: string;
  name: string;
  onset: string;
  detail: string;
  status: string;
  // Entered from an outside record: the source is shown on the row, to verify.
  provenance?: string;
}

export interface ProfileOverview {
  patient: PatientHeader;
  demographics: Demographics;
  conditions: Condition[];
  vitals: VitalsSet;
  bmiCategory: string;
}

// ---------------------------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------------------------

export type TimelineKind = 'visit' | 'lab' | 'rx' | 'ipd' | 'doc' | 'bill';

export type TimelineSource = 'in' | 'ext';

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  // "OPD visit", "Lab result", "Teleconsult".
  kindLabel: string;
  source: TimelineSource;
  year: number;
  dateLabel: string;
  title: string;
  flag?: Flag;
  // The department (and people) that recorded it, or the outside facility.
  where: string;
  // For an outside record: the facility it came from, via ABHA.
  facility?: string;
  summary: string;
  note?: string;
  // The language of the note, when it is not English (te, hi).
  noteLang?: string;
}

export interface TimelineYear {
  year: number;
  total: number;
  external: number;
  // What the year holds, in a line.
  blurb: string;
  preview: string[];
  // Null until the year is opened.
  events: TimelineEvent[] | null;
}

export interface MemoryOverview {
  suggestions: string[];
  // The input's placeholder names the patient.
  askPlaceholder: string;
}

export interface TimelineOverview {
  patient: PatientHeader;
  years: TimelineYear[];
  totals: {
    events: number;
    departments: number;
    facilities: number;
    external: number;
    internal: number;
  };
  kindCounts: Record<TimelineKind, number>;
  memory: MemoryOverview;
}

export interface MemoryDraft {
  id: string;
  title: string;
  findings: string[];
  sources: string;
}

export type Confidence = 'high' | 'medium' | 'low';

export interface MemoryAnswer {
  id: string;
  question: string;
  // Markdown, with **bold** for the recorded values.
  text: string;
  // The records the answer is drawn from. An answer without one is never shown.
  sources: string;
  confidence: Confidence;
  followups: string[];
}

// ---------------------------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------------------------

export interface DocumentPreview {
  heading: string;
  lines: string[];
}

export interface PatientDocument {
  id: string;
  name: string;
  format: 'PDF' | 'JPG' | 'PNG';
  category: string;
  sizeLabel: string;
  uploadedOn: string;
  uploadedBy: string;
  // Insurance and ID scans stay with staff; the patient's own app never shows them.
  staffOnly: boolean;
  preview: DocumentPreview;
}

export interface DocumentsOverview {
  patient: PatientHeader;
  files: PatientDocument[];
  uploadLimits: string;
}

export interface ReadValue {
  id: string;
  test: string;
  // As read off the page, a string: the page may say something the person must see for themselves.
  value: string;
  unit: string;
  // The range printed on the report.
  rangeLow?: number;
  rangeHigh?: number;
  rangeText: string;
  confidence: Confidence;
  // Where on the page it was read.
  source: string;
  // Already in the chart (an ABHA pull delivered it), so it is proposed unticked.
  filed?: boolean;
  filedSource?: string;
}

export interface OutsideReading {
  id: string;
  fileName: string;
  sizeLabel: string;
  uploadedOn: string;
  uploadedBy: string;
  lab: string;
  reportDate: string;
  // The patient the report itself names.
  patientOnReport: string;
  values: ReadValue[];
}

export interface FilingRequest {
  readingId: string;
  approver: string;
  // Exactly what the person ticked, with their corrections.
  values: Array<{ id: string; value: string }>;
}

export interface FilingReceipt {
  readingId: string;
  filedCount: number;
  filedOn: string;
  // The source photo, now attached to the record.
  document: PatientDocument;
  // Who approved the filing; absent when the report was only kept as a document.
  approver?: string;
}

// ---------------------------------------------------------------------------------------------
// Family and consent
// ---------------------------------------------------------------------------------------------

export interface AccessGrant {
  category: string;
  allowed: boolean;
}

export interface FamilyLink {
  id: string;
  name: string;
  initials: string;
  relation: string;
  phone: string;
  abha?: string;
  status: 'linked' | 'invited';
  statusDate: string;
  access: AccessGrant[];
}

export interface ConsentRecord {
  id: string;
  title: string;
  detail: string;
  enabled: boolean;
  // WhatsApp reminders can be turned off here; ABHA sharing is withdrawn by the patient herself.
  changeable: boolean;
}

export type DpdpKind = 'export' | 'correction';

export interface DpdpRequest {
  id: string;
  kind: DpdpKind;
  ref: string;
  requestedOn: string;
  status: 'In progress';
  dueOn: string;
  note?: string;
}

export interface FamilyOverview {
  patient: PatientHeader;
  links: FamilyLink[];
  consents: ConsentRecord[];
  requests: DpdpRequest[];
}

export interface LinkInvite {
  name: string;
  relation: string;
  phone: string;
}

// ---------------------------------------------------------------------------------------------
// Patient view
// ---------------------------------------------------------------------------------------------

export interface PatientViewCategory {
  id: string;
  label: string;
  hint?: string;
  visibleToPatient: Flag;
  sharedOutside: Flag;
  // Structurally excluded from her app, never merely hidden behind a setting.
  excluded: boolean;
}

export interface PatientAppRow {
  id: string;
  title: string;
  body: string;
  note?: string;
}

export interface PatientAppPreview {
  greeting: string;
  subline: string;
  rows: PatientAppRow[];
  // What her app does not show.
  withheld: string[];
}

export interface PatientViewOverview {
  patient: PatientHeader;
  categories: PatientViewCategory[];
  app: PatientAppPreview;
}
