import { useState } from 'react';
import {
  AiClassChip,
  AiSourceLine,
  Button,
  SoapDraftBlock,
  type SoapSections,
} from '@hos/nova-ui';
import type { ConsultDraft, DoctorDataSource, NoteText } from '../../data';
import { useDraftDecision, type Feedback } from '../../ui';

interface ConsultNoteProps {
  draft: ConsultDraft;
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
}

function initialSections(draft: ConsultDraft): SoapSections {
  const line = (key: 'subjective' | 'objective' | 'assessment') => ({
    text: draft[key].text,
    gloss: draft[key].gloss,
    lang: draft[key].lang,
  });
  // The plan starts empty, on purpose and always: the scribe transcribes the plan the doctor
  // speaks; it never drafts one. A drafted plan would be software proposing therapy (RED tier).
  return {
    subjective: line('subjective'),
    objective: line('objective'),
    assessment: line('assessment'),
    plan: { text: '', lang: 'te' },
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

// The prototype's AI SOAP draft (#scribeDraft): S, O and A written from the transcript and the
// record, and a P that stays empty and blocks approval until the doctor dictates it.
export function ConsultNote({
  draft,
  doctorName,
  source,
  feedback,
}: ConsultNoteProps) {
  const [sections, setSections] = useState<SoapSections>(() =>
    initialSections(draft),
  );
  const decision = useDraftDecision(feedback, {
    approve: () => source.signNote(toNote(sections)),
  });

  return (
    <SoapDraftBlock
      {...decision}
      sections={sections}
      onSectionsChange={setSections}
      approverName={doctorName}
      verb="Approve & sign the note"
      approvedVerb="Signed"
      rejectable={false}
      badges={<AiClassChip tier="green" detail="transcribe & restate" />}
      source={<AiSourceLine>{draft.sourceLine}</AiSourceLine>}
      onDictatePlan={() =>
        feedback.notify({
          tone: 'info',
          title: 'Speak or type your plan in the P box',
          detail:
            'It appears there in your own words. The note stays blocked until it does, and nothing is written for you.',
        })
      }
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            feedback.notify({
              tone: 'info',
              title: 'The plan is still open',
              detail:
                'Three lenses reviewed the record and disagree. Case Discussion has the five questions.',
            })
          }
        >
          Why is this one hard?
        </Button>
      }
    />
  );
}
