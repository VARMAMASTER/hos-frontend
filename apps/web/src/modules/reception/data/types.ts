// The Reception / OPD domain, as the front desk sees it. Every type here is what the module's data
// source returns; the tabs read these and nothing else, so the real API can replace the mock
// without touching a tab. The sample data is invented (see mock.ts): no real patient is in it.

export type Department =
  | 'General Medicine'
  | 'Gynecology'
  | 'Orthopedics'
  | 'Pediatrics';

export type Sex = 'M' | 'F';

// A language a patient is spoken to in, from their record.
export type PatientLanguage = 'te' | 'hi' | 'en';

export interface Doctor {
  id: string;
  name: string;
  department: Department;
  room: string;
}

// A patient as the front desk needs them: enough to call, book and register, never more.
export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  phone?: string;
  abha?: string;
  mrn?: string;
  language?: PatientLanguage;
}

export type KpiTrend = 'up' | 'down' | 'flat';
export type KpiSentiment = 'neutral' | 'good' | 'warn' | 'crit';

// One headline figure of a tab, exactly as the prototype words it.
export interface ReceptionKpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend?: KpiTrend;
  sentiment?: KpiSentiment;
}

// ---- Live queue ------------------------------------------------------------------------------

// A token's life at the front desk: waiting in the hall, called to the room, with the doctor, seen.
export type TokenState = 'waiting' | 'called' | 'in-consultation' | 'done';

export interface QueueToken {
  token: string;
  patientName: string;
  ageSex?: string;
  reason?: string;
  department: Department;
  doctorName: string;
  room: string;
  state: TokenState;
  // Minutes in the hall, while waiting.
  waitingMinutes?: number;
  // When the token was called or seen ("10:41 AM").
  at?: string;
}

export interface QueueSnapshot {
  kpis: ReceptionKpi[];
  tokens: QueueToken[];
}

// ---- Appointments and slots ------------------------------------------------------------------

export type BookingChannel = 'Walk-in' | 'Phone' | 'WhatsApp' | 'AI voice call';
export type PaymentMode = 'upi' | 'counter';

export interface Slot {
  id: string;
  doctorId: string;
  // 24-hour "09:30", and how it is said on a booking ("09:30 AM", "12:00 noon").
  time: string;
  label: string;
  status: 'free' | 'taken';
  // Why a taken slot is taken, when it is not a patient ("OT").
  note?: string;
}

export interface ChannelShare {
  channel: string;
  count: number;
  share: string;
  // Bar length relative to the busiest channel, 0 to 100.
  barPercent: number;
  // Booked by an AI channel with no staff time.
  ai: boolean;
}

export type NoShowAction = 'ai-call-whatsapp' | 'ai-call' | 'whatsapp' | 'none';

export interface NoShowRisk {
  id: string;
  riskPercent: number;
  patientName: string;
  ageSex: string;
  language: string;
  slot: string;
  doctorName: string;
  why: string;
  action: NoShowAction;
  actionLabel: string;
}

// The follow-up a discharge summary asked for, drafted for the front desk to approve.
export interface FollowUpDraft {
  id: string;
  patientName: string;
  summarySource: string;
  askedFor: { title: string; detail: string; date: string };
  proposed: { title: string; detail: string };
  whyNot: { title: string; detail: string };
  caution: string;
  reasons: string[];
  sources: string;
  otherSessions: string;
}

export interface ReminderPlanDraft {
  id: string;
  title: string;
  summary: string;
  signals: string;
}

export interface AppointmentsOverview {
  kpis: ReceptionKpi[];
  slotsDate: string;
  sessionHours: string;
  doctors: Doctor[];
  slots: Slot[];
  channels: ChannelShare[];
  channelNote: string;
  followUp: FollowUpDraft | null;
  reminderPlan: ReminderPlanDraft | null;
  noShowRisks: NoShowRisk[];
  prepaidNote: string;
  consultationFee: string;
}

export interface BookingRequest {
  patientName: string;
  phone: string;
  doctorId: string;
  slotId: string;
  channel: BookingChannel;
  payment: PaymentMode;
}

export interface Appointment {
  id: string;
  token: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  slotId: string;
  slotLabel: string;
  channel: BookingChannel;
  payment: PaymentMode;
}

// ---- Day schedule ----------------------------------------------------------------------------

export type ScheduleEntry =
  | {
      kind: 'booked';
      id: string;
      doctorId: string;
      time: string;
      token: string;
      patientName: string;
      reason: string;
    }
  | { kind: 'free'; id: string; doctorId: string; time: string }
  | { kind: 'break'; id: string; doctorId: string; time: string };

export interface DaySchedule {
  date: string;
  session: string;
  doctors: Doctor[];
  times: string[];
  entries: ScheduleEntry[];
}

export interface ScheduleBookingRequest {
  entryId: string;
  patientName: string;
  reason: string;
}

// ---- Registration ----------------------------------------------------------------------------

// What the quick-register form collects. ABHA linking is an explicit opt-in: abhaConsent is false
// until the patient agrees, and no ABHA number is kept without it.
export interface RegistrationDraft {
  phone: string;
  name: string;
  ageSex: string;
  department: Department;
  abhaNumber: string;
  abhaConsent: boolean;
}

export interface RegisteredPatient {
  id: string;
  name: string;
  ageSex: string;
  department: Department;
  at: string;
  token: string;
  abhaLinked: boolean;
}

// The master patient index's answer for a phone number: the same person never gets two records.
export type PhoneLookup =
  | {
      kind: 'existing';
      phone: string;
      name: string;
      meta: string;
      abha: string;
      lastVisit: string;
    }
  | { kind: 'new'; phone: string; checkedAgainst: string };

export interface AbhaRecord {
  date: string;
  facility: string;
  detail: string;
}

// What a consented ABHA fetch fills in.
export interface AbhaProfile {
  abha: string;
  phone: string;
  name: string;
  ageSex: string;
  records: AbhaRecord[];
}

export interface RegistrationOverview {
  departments: Department[];
  recent: RegisteredPatient[];
}

// ---- Admission -------------------------------------------------------------------------------

export type PayerId = 'star' | 'pmjay' | 'self';

export interface PayerOption {
  id: PayerId;
  label: string;
  chip: string;
  policy: string;
  sum: string;
  code: string;
  split: { label: string; amount: string }[];
  claim: string;
  claimNote: string;
}

export interface EligibilityTerm {
  ok: boolean;
  text: string;
  value: string;
}

export interface WardOption {
  id: string;
  label: string;
  // Room rent a night, in rupees; 0 for a ward that cannot be allocated.
  ratePerNight: number;
  available: boolean;
}

export interface BedOption {
  id: string;
  label: string;
}

export interface AdmissionConsent {
  id: string;
  title: string;
  detail: string;
}

export interface EstimateLine {
  label: string;
  amount: string;
}

export interface FactReuse {
  fact: string;
  source: string;
  reusedIn: string;
}

// One admission, collected once and fanned out: the prototype's D. Prakash case.
export interface AdmissionRequest {
  id: string;
  when: string;
  dateChip: string;
  patient: {
    name: string;
    ageSex: string;
    abha: string;
    mrn: string;
    phone: string;
    address: string;
  };
  reason: {
    noteSource: string;
    doctors: string[];
    types: string[];
    diagnosis: string;
    procedure: string;
    stay: string;
  };
  payers: PayerOption[];
  eligibility: { title: string; terms: EligibilityTerm[]; footer: string };
  bed: {
    wards: WardOption[];
    beds: BedOption[];
    tariff: string;
    icuNote: string;
    nights: number;
    subLimitPerDay: number;
    estimateTotal: number;
    nonPayable: number;
    pharmacy: number;
    baseRatePerNight: number;
  };
  attender: { name: string; relationship: string; phone: string };
  consents: AdmissionConsent[];
  estimate: { lines: EstimateLine[]; total: string; note: string };
  estimateDraft: { title: string; body: string; source: string };
  reuse: FactReuse[];
}

export interface AdmissionOverview {
  kpis: ReceptionKpi[];
  banner: string;
  request: AdmissionRequest | null;
}

export interface AdmitInstruction {
  requestId: string;
  payer: PayerId;
  wardId: string;
  bedId: string;
  consentIds: string[];
}

export interface FanOutRecord {
  workspace: string;
  record: string;
  detail: string;
}

export interface AdmissionResult {
  summary: string;
  records: FanOutRecord[];
  freeBeds: string;
}

// ---- Referrals -------------------------------------------------------------------------------

export type ReferralStatus = 'pending' | 'accepted';

export interface Referral {
  id: string;
  source: string;
  sourceDetail: string;
  patientName: string;
  ageSex: string;
  reason: string;
  date: string;
  status: ReferralStatus;
}

export interface ReferralReplyDraft {
  id: string;
  referralId: string;
  recipient: string;
  message: string;
}

export interface ReferralsOverview {
  summary: string;
  referrals: Referral[];
  replyDraft: ReferralReplyDraft | null;
}

// ---- WhatsApp assistant ----------------------------------------------------------------------

export interface WhatsAppMessage {
  id: string;
  // in: the patient; out: the hospital.
  direction: 'in' | 'out';
  // The hospital's AI assistant wrote it (marked with the AI mark and in words).
  ai: boolean;
  text: string;
  lang?: PatientLanguage;
  gloss?: string;
  time: string;
  quickReplies?: { value: string; label: string }[];
  chosenReply?: string;
}

// An AI-drafted reply, which a person approves before it is sent.
export interface WhatsAppDraft {
  id: string;
  title: string;
  summary: string;
  message: string;
}

export interface WhatsAppConversation {
  id: string;
  patientName: string;
  phone: string;
  topic: string;
  messages: WhatsAppMessage[];
  draft: WhatsAppDraft | null;
}

export interface WhatsAppStat {
  label: string;
  value: string;
}

export interface WhatsAppOverview {
  banner: string;
  stats: WhatsAppStat[];
  conversations: WhatsAppConversation[];
}

// ---- AI calling ------------------------------------------------------------------------------

export interface CallTurnText {
  te: string;
  hi: string;
  en: string;
}

export type AiCallStep =
  | {
      kind: 'turn';
      id: string;
      ai: boolean;
      at: string;
      speaker: string;
      text: CallTurnText;
    }
  | { kind: 'system'; id: string; text: string; critical?: boolean };

export interface AiCall {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  durationSeconds: number;
  steps: AiCallStep[];
  writeBack: { id: string; title: string; detail: string }[];
  // The AI-written follow-up message: a draft until a person approves it.
  followUp: (WhatsAppDraft & { recipient: string }) | null;
}

export interface CallCampaign {
  id: string;
  name: string;
  detail: string;
  called: number;
  outcome: string;
  languages: string;
  minutes: string;
  cost: string;
  running: boolean;
}

export interface CallQueueEntry {
  id: string;
  patientName: string;
  ageSex: string;
  why: string;
  language: string;
  languageCode: PatientLanguage;
  doNotCall: boolean;
}

export type CallOutcomeTone = 'good' | 'warn' | 'crit' | 'neutral';

export interface CallLogEntry {
  id: string;
  outcome: string;
  outcomeTone: CallOutcomeTone;
  time: string;
  direction: string;
  who: string;
  whoDetail: string;
  about: string;
  language: string;
  duration: string;
  cost: string;
}

export interface DoNotCallRequest {
  id: string;
  patientName: string;
  detail: string;
  confirmed: boolean;
}

export interface AiCallingOverview {
  banner: string;
  kpis: ReceptionKpi[];
  calls: AiCall[];
  recallDraft: { id: string; title: string; body: string; source: string };
  campaigns: CallCampaign[];
  campaignNote: string;
  queue: CallQueueEntry[];
  limits: { mark: '✕' | '→' | '✓'; text: string }[];
  consent: {
    window: string;
    optOut: string;
    doNotCallCount: number;
    maxAttempts: number;
    request: DoNotCallRequest | null;
  };
  log: CallLogEntry[];
}
