import type {
  BriefDraft,
  CareGap,
  DocumentsOverview,
  DraftApproval,
  DpdpKind,
  DpdpRequest,
  FamilyLink,
  FamilyOverview,
  FilingReceipt,
  FilingRequest,
  LinkInvite,
  MemoryAnswer,
  MemoryDraft,
  OutsideReading,
  PatientSnapshot,
  PatientViewOverview,
  ProfileOverview,
  TimelineEvent,
  TimelineOverview,
  ConsentRecord,
} from './types';

// Everything the Patient record module reads and writes. The tabs depend on this interface only
// (through usePatientRecord), never on mock.ts, so the real API client implements it later and no
// tab changes.
//
// patientId is optional: left out, the source means the chart that is open.
//
// The AI rule holds here too: a method that files something an AI drafted (approveBrief,
// approveMemoryDraft, fileExtractedValues) is only ever called from a person's approval, and the
// source never files anything by itself.
export interface PatientRecordDataSource {
  // Clinical snapshot.
  getSnapshot(patientId?: string): Promise<PatientSnapshot>;
  // Drafts the pre-consult briefing. It is a draft until approveBrief.
  generateBrief(patientId?: string): Promise<BriefDraft>;
  approveBrief(briefId: string, approver: string): Promise<DraftApproval>;
  // Acts on a care gap (orders it, adds it to today's visit, chases the lab).
  actOnCareGap(gapId: string, patientId?: string): Promise<CareGap>;

  // Profile.
  getProfile(patientId?: string): Promise<ProfileOverview>;

  // Timeline. Years other than the open one load on demand.
  getTimeline(patientId?: string): Promise<TimelineOverview>;
  getTimelineYear(year: number, patientId?: string): Promise<TimelineEvent[]>;
  // The patient-memory summary, and the Q&A over the record.
  summarizeHistory(patientId?: string): Promise<MemoryDraft>;
  approveMemoryDraft(draftId: string, approver: string): Promise<DraftApproval>;
  askMemory(question: string, patientId?: string): Promise<MemoryAnswer>;

  // Documents.
  getDocuments(patientId?: string): Promise<DocumentsOverview>;
  // Reads the values off an outside paper report. Nothing is filed: the values are proposed.
  readOutsideReport(patientId?: string): Promise<OutsideReading>;
  // Files exactly the values a person ticked (called only from their approval).
  fileExtractedValues(request: FilingRequest): Promise<FilingReceipt>;
  // Keeps the report as a document only: no value is charted.
  keepReportAsDocument(readingId: string): Promise<FilingReceipt>;

  // Family and consent.
  getFamily(patientId?: string): Promise<FamilyOverview>;
  setConsent(consentId: string, enabled: boolean): Promise<ConsentRecord>;
  requestFamilyLink(
    invite: LinkInvite,
    patientId?: string,
  ): Promise<FamilyLink>;
  requestDpdp(
    kind: DpdpKind,
    note: string,
    patientId?: string,
  ): Promise<DpdpRequest>;

  // Patient view.
  getPatientView(patientId?: string): Promise<PatientViewOverview>;
}
