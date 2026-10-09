import type { PatientRecordDataSource } from './source';
import type {
  CareGap,
  ConsentRecord,
  DpdpKind,
  DpdpRequest,
  FamilyLink,
  FilingReceipt,
  FilingRequest,
  LinkInvite,
  MemoryAnswer,
  PatientDocument,
  TimelineEvent,
  TimelineKind,
} from './types';
import { grants, seedFamily } from './seed-family';
import { READING_ID, seedDocuments, seedReading } from './seed-documents';
import {
  MEMORY_BANK,
  MEMORY_FALLBACK,
  seedMemoryDraft,
  seedMemoryOverview,
} from './seed-memory';
import { PATIENT_ID, seedPatientView, seedProfile } from './seed-patient';
import { CARE_GAP_DONE, seedBrief, seedSnapshot } from './seed-snapshot';
import { seedTimelineEvents, summariseYears } from './seed-timeline';

// The in-memory PatientRecordDataSource: invented sample data (seed-*.ts), held in this closure and
// nowhere else. It makes no network call, writes nothing to browser storage and logs nothing.
// Errors say what failed, never whose record it was. Each call to the factory starts fresh.

const OPEN_YEAR = 2026;
const TODAY = '19 Jul 2026';
const REQUEST_DAY = '18 Jul 2026';
const DUE_DAY = '25 Jul 2026';

// Results are copies, so a caller editing what it got back cannot change the source's state.
function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function requireChart(patientId: string | undefined): void {
  if (patientId !== undefined && patientId !== PATIENT_ID) {
    throw new Error('That chart could not be found.');
  }
}

function requireApprover(approver: string): string {
  const name = approver.trim();
  if (!name) throw new Error('An approval needs the approver’s name.');
  return name;
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

const GAP_STATUS = {
  order: 'Ordered',
  'add-today': 'Added to today’s visit',
  chase: 'Lab chased',
} as const;

export function createMockPatientRecordSource(): PatientRecordDataSource {
  const snapshot = seedSnapshot();
  const events = seedTimelineEvents();
  const documents = seedDocuments();
  const family = seedFamily();
  const briefs = new Set<string>();
  const memoryDrafts = new Set<string>();
  const readings = new Map<string, { filed: boolean }>();
  let answerSeq = 0;
  let dpdpSeq = 447;
  let inviteSeq = 0;

  function approval(draftId: string, approver: string) {
    return {
      draftId,
      approver: requireApprover(approver),
      approvedAt: new Date().toISOString(),
    };
  }

  function attach(
    document: PatientDocument,
    readingId: string,
    filedCount: number,
    approver?: string,
  ): FilingReceipt {
    documents.files.unshift(document);
    readings.set(readingId, { filed: true });
    return {
      readingId,
      filedCount,
      filedOn: TODAY,
      document: copy(document),
      approver,
    };
  }

  return {
    async getSnapshot(patientId) {
      requireChart(patientId);
      return copy(snapshot);
    },

    async generateBrief(patientId) {
      requireChart(patientId);
      const brief = seedBrief();
      briefs.add(brief.id);
      return brief;
    },

    async approveBrief(briefId, approver) {
      if (!briefs.has(briefId))
        throw new Error('That draft could not be found.');
      return approval(briefId, approver);
    },

    async actOnCareGap(gapId, patientId): Promise<CareGap> {
      requireChart(patientId);
      const gap = snapshot.careGaps.find((g) => g.id === gapId);
      if (!gap) throw new Error('That care gap could not be found.');
      if (!gap.action) throw new Error('There is nothing to do for that item.');
      gap.done = CARE_GAP_DONE[gap.id] ?? 'Done';
      gap.status = { tone: 'info', label: GAP_STATUS[gap.action.kind] };
      gap.action = undefined;
      return copy(gap);
    },

    async getProfile(patientId) {
      requireChart(patientId);
      return seedProfile();
    },

    async getTimeline(patientId) {
      requireChart(patientId);
      const kinds: TimelineKind[] = [
        'visit',
        'lab',
        'rx',
        'ipd',
        'doc',
        'bill',
      ];
      const kindCounts = Object.fromEntries(
        kinds.map((kind) => [
          kind,
          events.filter((e) => e.kind === kind).length,
        ]),
      ) as Record<TimelineKind, number>;
      const external = events.filter((e) => e.source === 'ext');
      return {
        patient: copy(snapshot.patient),
        years: copy(summariseYears(events, OPEN_YEAR)),
        totals: {
          events: events.length,
          departments: kinds.length,
          facilities: new Set(external.map((e) => e.facility)).size,
          external: external.length,
          internal: events.length - external.length,
        },
        kindCounts,
        memory: seedMemoryOverview(),
      };
    },

    async getTimelineYear(year, patientId): Promise<TimelineEvent[]> {
      requireChart(patientId);
      const inYear = events.filter((e) => e.year === year);
      if (inYear.length === 0)
        throw new Error('That year is not on the record.');
      return copy(inYear);
    },

    async summarizeHistory(patientId) {
      requireChart(patientId);
      const draft = seedMemoryDraft();
      memoryDrafts.add(draft.id);
      return draft;
    },

    async approveMemoryDraft(draftId, approver) {
      if (!memoryDrafts.has(draftId)) {
        throw new Error('That draft could not be found.');
      }
      return approval(draftId, approver);
    },

    async askMemory(question, patientId): Promise<MemoryAnswer> {
      requireChart(patientId);
      const text = question.trim();
      if (!text) throw new Error('Ask a question about the record.');
      const lower = text.toLowerCase();
      let best = MEMORY_FALLBACK;
      let bestScore = 0;
      for (const entry of MEMORY_BANK) {
        const score = entry.keywords.filter((k) => lower.includes(k)).length;
        if (score > bestScore) {
          best = entry;
          bestScore = score;
        }
      }
      answerSeq += 1;
      return {
        id: `answer-${answerSeq}`,
        question: text,
        text: best.text,
        sources: best.sources,
        confidence: best === MEMORY_FALLBACK ? 'low' : 'high',
        followups: [...best.followups],
      };
    },

    async getDocuments(patientId) {
      requireChart(patientId);
      return copy(documents);
    },

    async readOutsideReport(patientId) {
      requireChart(patientId);
      const reading = seedReading();
      if (!readings.has(reading.id)) readings.set(reading.id, { filed: false });
      return reading;
    },

    async fileExtractedValues(request: FilingRequest) {
      const state = readings.get(request.readingId);
      if (!state) throw new Error('That report could not be found.');
      const approver = requireApprover(request.approver);
      if (request.values.length === 0) {
        throw new Error('Nothing was ticked, so nothing was filed.');
      }
      const reading = seedReading();
      for (const filed of request.values) {
        if (!reading.values.some((v) => v.id === filed.id)) {
          throw new Error('One of those values is not on the report.');
        }
        if (!filed.value.trim())
          throw new Error('Every filed value needs a value.');
      }
      if (state.filed) throw new Error('That report was already filed.');
      const count = request.values.length;
      return attach(
        {
          id: 'doc-yashoda-kft',
          name: reading.fileName,
          format: 'JPG',
          category: 'Outside report',
          sizeLabel: reading.sizeLabel,
          uploadedOn: reading.uploadedOn,
          uploadedBy: reading.uploadedBy,
          staffOnly: false,
          preview: {
            heading: 'Image preview',
            lines: [
              `Outside lab report · ${reading.lab}`,
              `Report dated ${reading.reportDate} · ${count} ${count === 1 ? 'value' : 'values'} filed to the chart`,
              `Approved by ${approver}`,
            ],
          },
        },
        request.readingId,
        count,
        approver,
      );
    },

    async keepReportAsDocument(readingId) {
      const state = readings.get(readingId);
      if (!state || readingId !== READING_ID) {
        throw new Error('That report could not be found.');
      }
      if (state.filed) throw new Error('That report was already filed.');
      const reading = seedReading();
      return attach(
        {
          id: 'doc-yashoda-kft',
          name: reading.fileName,
          format: 'JPG',
          category: 'Outside report',
          sizeLabel: reading.sizeLabel,
          uploadedOn: reading.uploadedOn,
          uploadedBy: reading.uploadedBy,
          staffOnly: false,
          preview: {
            heading: 'Image preview',
            lines: [
              `Outside lab report · ${reading.lab}`,
              'Kept as a document only: no values were charted',
            ],
          },
        },
        readingId,
        0,
      );
    },

    async getFamily(patientId) {
      requireChart(patientId);
      return copy(family);
    },

    async setConsent(consentId, enabled): Promise<ConsentRecord> {
      const consent = family.consents.find((c) => c.id === consentId);
      if (!consent) throw new Error('That consent could not be found.');
      if (!consent.changeable) {
        throw new Error('That consent is changed by the patient herself.');
      }
      consent.enabled = enabled;
      return copy(consent);
    },

    async requestFamilyLink(
      invite: LinkInvite,
      patientId,
    ): Promise<FamilyLink> {
      requireChart(patientId);
      const name = invite.name.trim();
      const phone = invite.phone.trim();
      if (!name || !phone)
        throw new Error('A name and a phone number are needed.');
      inviteSeq += 1;
      const link: FamilyLink = {
        id: `link-invite-${inviteSeq}`,
        name,
        initials: initialsOf(name),
        relation: invite.relation.trim() || 'Family',
        phone,
        status: 'invited',
        statusDate: TODAY,
        // Nothing is shared until they confirm consent.
        access: grants(false),
      };
      family.links.push(link);
      return copy(link);
    },

    async requestDpdp(kind: DpdpKind, note, patientId): Promise<DpdpRequest> {
      requireChart(patientId);
      const request: DpdpRequest = {
        id: `dpdp-${dpdpSeq}`,
        kind,
        ref: `DPDP-2026-${String(dpdpSeq).padStart(4, '0')}`,
        requestedOn: REQUEST_DAY,
        status: 'In progress',
        dueOn: DUE_DAY,
        note: note.trim() || undefined,
      };
      dpdpSeq += 1;
      family.requests.push(request);
      return copy(request);
    },

    async getPatientView(patientId) {
      requireChart(patientId);
      return seedPatientView();
    },
  };
}
