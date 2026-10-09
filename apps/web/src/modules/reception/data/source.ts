import type {
  AbhaProfile,
  AdmissionOverview,
  AdmissionResult,
  AdmitInstruction,
  AiCallingOverview,
  Appointment,
  AppointmentsOverview,
  BookingRequest,
  DaySchedule,
  PhoneLookup,
  QueueSnapshot,
  Referral,
  ReferralsOverview,
  RegisteredPatient,
  RegistrationDraft,
  RegistrationOverview,
  ScheduleBookingRequest,
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppOverview,
} from './types';

// Everything the Reception module reads and writes. The tabs depend on this interface only (through
// useReception), never on mock.ts, so the real API client implements it later and no tab changes.
//
// The AI rule holds here too: a method that sends or books something an AI drafted is only ever
// called from a person's approval (an ApprovalBar), and the source never sends anything by itself.
export interface ReceptionDataSource {
  // Live queue.
  getQueue(): Promise<QueueSnapshot>;
  // Calls the next waiting token to the room; the token in consultation is marked seen.
  callNext(): Promise<QueueSnapshot>;

  // Appointments and slots.
  getAppointments(): Promise<AppointmentsOverview>;
  bookAppointment(request: BookingRequest): Promise<Appointment>;
  // A person approved the discharge follow-up draft: book it.
  approveFollowUp(draftId: string): Promise<Appointment>;
  // A person approved the reminder plan: queue the reminders.
  approveReminderPlan(planId: string): Promise<void>;

  // Day schedule.
  getSchedule(): Promise<DaySchedule>;
  bookScheduleSlot(request: ScheduleBookingRequest): Promise<DaySchedule>;
  rescheduleEntry(entryId: string, toEntryId: string): Promise<DaySchedule>;

  // Registration.
  getRegistration(): Promise<RegistrationOverview>;
  lookupPhone(phone: string): Promise<PhoneLookup>;
  // Only called with the patient's consent (the form's opt-in); rejects without it.
  fetchAbhaProfile(abha: string, consent: boolean): Promise<AbhaProfile>;
  registerPatient(draft: RegistrationDraft): Promise<RegisteredPatient>;

  // Admission.
  getAdmission(): Promise<AdmissionOverview>;
  // A person approved the AI-assembled estimate: send it to the patient.
  approveEstimate(requestId: string): Promise<void>;
  admit(instruction: AdmitInstruction): Promise<AdmissionResult>;

  // Referrals.
  getReferrals(): Promise<ReferralsOverview>;
  acceptReferral(referralId: string): Promise<Referral>;
  // A person approved the AI-drafted acceptance reply (as drafted or edited).
  sendReferralReply(draftId: string, message: string): Promise<void>;

  // WhatsApp assistant.
  getWhatsApp(): Promise<WhatsAppOverview>;
  // A person approved the AI-drafted reply (as drafted or edited); returns the sent message.
  sendWhatsAppReply(
    conversationId: string,
    message: string,
  ): Promise<WhatsAppMessage>;
  // Finds the next unanswered missed call and starts its conversation with an AI-drafted reply,
  // which is not sent: a person approves it through sendWhatsAppReply. null when none is left.
  recoverMissedCall(): Promise<WhatsAppConversation | null>;

  // AI calling.
  getAiCalling(): Promise<AiCallingOverview>;
  // A person approved the recall list: the agent may start dialling.
  approveRecallList(draftId: string): Promise<void>;
  // A person approved the AI-written follow-up after a call (as drafted or edited).
  sendCallFollowUp(callId: string, message: string): Promise<void>;
  setCampaignRunning(campaignId: string, running: boolean): Promise<void>;
  queueCall(entryId: string): Promise<void>;
  // A person confirmed a do-not-call request: permanent across voice and WhatsApp.
  confirmDoNotCall(requestId: string): Promise<number>;
}
