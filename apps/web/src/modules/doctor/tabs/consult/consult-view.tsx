import { EmptyState, Stack } from '@hos/nova-ui';
import { useDoctorQuery } from '../../data';
import { ActionFeedback, DoctorTab, useFeedback } from '../../ui';
import { BriefingCard } from './briefing-card';
import { ReferenceCheckCard } from './reference-check';
import { ScribeSection } from './scribe-card';
import type { ConsultWidgetProps } from './types';

// The prototype's Consultation (03-doctor.html, data-panel="consult"): the AI briefing, the
// reference check on request, and the ambient scribe with the note and prescription it drafts.
// Everything the AI writes here is a draft until the doctor approves it.
export function ConsultWidget({
  patientId,
  compactMode,
  className,
}: ConsultWidgetProps) {
  const { query, source, reload } = useDoctorQuery((s) => s.getConsultation());
  const feedback = useFeedback();
  const consult = query.status === 'ready' ? query.data : null;

  return (
    <DoctorTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Consultation"
      description="The briefing, the reference check and the scribe for the patient in your room."
      query={query}
      errorMessage="Could not load the consultation."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        consult ? (
          <Stack gap="s6">
            <ActionFeedback {...feedback.props} />
            <BriefingCard consult={consult} />
            <ReferenceCheckCard
              consult={consult}
              source={source}
              feedback={feedback}
            />
            <ScribeSection
              consult={consult}
              source={source}
              feedback={feedback}
            />
          </Stack>
        ) : (
          <EmptyState
            title="No consultation chart is open"
            description="Open a patient from My Queue. A briefing, the check and the scribe appear for a patient whose chart has been prepared."
          />
        )
      ) : null}
    </DoctorTab>
  );
}
