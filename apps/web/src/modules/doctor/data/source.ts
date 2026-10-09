import type {
  ChatReply,
  CheckBlock,
  CodingOverview,
  HistoryOverview,
  IcdProposal,
  InsightsOverview,
  InsightsResult,
  ManualCode,
  ReferralLetter,
  ReferralsOverview,
  TeluguCopy,
  ConsultationOverview,
  ConsultDraft,
  NoteDraft,
  OrderReceipt,
  OrderRequest,
  OrdersOverview,
  OrderTemplate,
  NotesOverview,
  NoteText,
  QueueOverview,
  ReferenceCheck,
  RxLine,
  TemplateRequest,
} from './types';

// Everything the Doctor module reads and writes. The tabs depend on this interface only (through
// useDoctor), never on mock.ts, so the real API client implements it later and no tab changes.
//
// The AI rule holds here too: a method that files, sends, orders or prescribes something an AI
// drafted is only ever called from a person's approval (an ApprovalBar), and the source never acts
// on its own. No method returns a dose, a drug choice or a diagnosis: those are the doctor's.
export interface DoctorDataSource {
  // My queue.
  getQueue(): Promise<QueueOverview>;
  // Opens a patient's consultation: they are in the room, and the patient who was in the room is
  // marked seen.
  startConsultation(token: string): Promise<QueueOverview>;

  // Consultation. null when the patient in the room has no chart prepared.
  getConsultation(): Promise<ConsultationOverview | null>;
  // The reference and consistency check, on request: values beside published ranges and her own
  // history, and contradictions between records. Facts and questions; never an instruction.
  runReferenceCheck(): Promise<ReferenceCheck>;
  // The doctor accepted a block: it goes on today's note.
  attachCheckBlock(blockId: CheckBlock['id']): Promise<void>;
  // The doctor dismissed a block, with a reason: dismissals are logged with their name.
  dismissCheckBlock(blockId: CheckBlock['id'], reason: string): Promise<void>;
  // The scribe's draft after the consultation: S, O and A, and a carry-forward of the existing
  // prescription. Never a plan.
  draftConsultNote(): Promise<ConsultDraft>;
  // The doctor signed the note. Rejects while the plan is empty: it is theirs to dictate.
  signNote(note: NoteText): Promise<void>;
  // Re-checks the edited durations against the allergy file and the labels.
  checkPrescription(lines: Pick<RxLine, 'id' | 'duration'>[]): Promise<string>;
  // The doctor approved the prescription: it goes to the patient's WhatsApp.
  approvePrescription(lines: Pick<RxLine, 'id' | 'duration'>[]): Promise<void>;

  // Progress notes.
  getNotes(): Promise<NotesOverview>;
  // Assembles a ready note from the recorded encounter, for the doctor to read and sign.
  openNote(noteId: string): Promise<NoteDraft>;
  // The doctor signed the note (as drafted or as edited): it is filed. Nothing is filed before.
  fileNote(noteId: string, note: NoteText): Promise<void>;
  // The doctor rejected the draft, with the reason: the strongest signal the assistant gets.
  rejectNote(noteId: string, reason: string): Promise<void>;

  // Orders & prescriptions. null when no chart is open.
  getOrders(): Promise<OrdersOverview | null>;
  // The doctor sent the order they chose. Nothing is ordered for them: an AI suggestion never
  // auto-orders, and the ticked boxes are the doctor's.
  sendOrder(request: OrderRequest): Promise<OrderReceipt>;
  saveTemplate(request: TemplateRequest): Promise<OrderTemplate>;
  // The doctor typed a dose for the patient in front of them: it is recorded as theirs.
  recordDose(drug: string, dose: string): Promise<void>;
  // The print sheet (Telugu + English) is queued; nothing is sent to the patient.
  queuePrint(): Promise<void>;
  // The Telugu instructions as audio, prepared as a draft that goes only with the prescription once
  // the doctor has approved it.
  prepareVoiceNote(): Promise<void>;

  // Patient history: ask the AI Health Memory about the patient's record. null when no chart is open.
  getHistory(): Promise<HistoryOverview | null>;
  askHistory(question: string): Promise<ChatReply>;

  // Referrals out. Without a chart open there is no recipient to pick, but the list still shows.
  getReferrals(): Promise<ReferralsOverview>;
  // Drafts a letter for the recipient, assembled from facts already in the record.
  draftReferralLetter(recipientId: string): Promise<ReferralLetter>;
  // The doctor signed the letter, with the attachments they ticked and the ask in their own words.
  // Nothing leaves the hospital before.
  signReferral(
    letterId: string,
    attachmentIds: string[],
    ask: string,
  ): Promise<void>;
  // A separate one-page Telugu sheet the patient can read, drafted for the doctor to approve.
  draftTeluguCopy(letterId: string): Promise<TeluguCopy>;
  approveTeluguCopy(letterId: string): Promise<void>;

  // Coding & claims. null when no chart is open.
  getCoding(): Promise<CodingOverview | null>;
  // The doctor approved the codes they confirmed. Nothing is filed that they did not confirm.
  approveCodes(codes: string[]): Promise<void>;
  // A code the doctor added by hand: a stronger signal than anything the model proposed.
  addManualCode(code: ManualCode): Promise<IcdProposal>;

  // AI insights: patterns across the doctor's own consultations, private to them.
  getInsights(): Promise<InsightsOverview>;
  analyzeInsights(): Promise<InsightsResult>;
  // The doctor approved acting on an insight (add a screen to a template, adjust slots).
  actOnInsight(insightId: string, actionId: string): Promise<void>;
  // The doctor dismissed an insight, with a reason.
  dismissInsight(insightId: string, reason: string): Promise<void>;
}
