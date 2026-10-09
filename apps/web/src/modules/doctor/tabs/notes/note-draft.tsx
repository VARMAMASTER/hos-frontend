import { useEffect, useState } from 'react';
import {
  AiClassChip,
  AiSourceLine,
  SoapDraftBlock,
  type SoapSections,
} from '@hos/nova-ui';
import type { DoctorDataSource, NoteDraft, NoteText } from '../../data';
import { useDraftDecision, type Feedback } from '../../ui';

interface NoteDraftViewProps {
  draft: NoteDraft;
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
  // The note was filed or rejected: the list moves it out of the queue.
  onSettled: (noteId: string, state: 'filed' | 'rejected') => void;
}

function toSections(draft: NoteDraft): SoapSections {
  return {
    subjective: draft.subjective,
    objective: draft.objective,
    assessment: draft.assessment,
    // The plan is the doctor's own words, transcribed: the scribe did not compose it.
    plan: { ...draft.plan, provenance: 'verbatim' },
  };
}

function toNote(sections: SoapSections): NoteText {
  return {
    subjective: sections.subjective?.text ?? '',
    objective: sections.objective?.text ?? '',
    assessment: sections.assessment?.text ?? '',
    plan: sections.plan?.text ?? '',
  };
}

// A drafted progress note, open for the doctor to read, edit, sign or reject. Nothing is filed until
// the doctor signs it, and every edit is the doctor's own.
export function NoteDraftView({
  draft,
  doctorName,
  source,
  feedback,
  onSettled,
}: NoteDraftViewProps) {
  const [sections, setSections] = useState<SoapSections>(() =>
    toSections(draft),
  );
  const decision = useDraftDecision(feedback, {
    approve: () => source.fileNote(draft.noteId, toNote(sections)),
    reject: (reason) => source.rejectNote(draft.noteId, reason),
  });
  const { status } = decision;
  useEffect(() => {
    if (status === 'approved') onSettled(draft.noteId, 'filed');
    if (status === 'rejected') onSettled(draft.noteId, 'rejected');
  }, [status, draft.noteId, onSettled]);

  return (
    <SoapDraftBlock
      {...decision}
      title={draft.title}
      sections={sections}
      onSectionsChange={setSections}
      approverName={doctorName}
      verb="Approve & file the note"
      approvedVerb="Filed"
      badges={<AiClassChip tier="green" detail="transcribe & restate" />}
      source={<AiSourceLine>{draft.sourceLine}</AiSourceLine>}
    />
  );
}
