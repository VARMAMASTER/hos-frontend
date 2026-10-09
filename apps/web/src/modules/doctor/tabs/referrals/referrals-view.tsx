import { Banner, EmptyState, Stack } from '@hos/nova-ui';
import { useDoctorQuery } from '../../data';
import { ActionFeedback, DoctorTab, useFeedback } from '../../ui';
import { RecipientCard } from './recipient-card';
import { ReferralsOutCard } from './referrals-out';
import type { ReferralsWidgetProps } from './types';

// The prototype's Referrals Out (03-doctor.html, data-panel="referrals"): GREEN drafting. Pick a
// recipient, have the letter assembled from facts already in the record, and sign it off; below, who
// the doctor referred in the last 30 days and whether anything came back.
export function ReferralsWidget({
  patientId,
  compactMode,
  className,
}: ReferralsWidgetProps) {
  const { query, source, reload } = useDoctorQuery((s) => s.getReferrals());
  const feedback = useFeedback();
  const overview = query.status === 'ready' ? query.data : null;

  return (
    <DoctorTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Referrals Out"
      description="Refer the patient in your room, and see which referrals have had no reply."
      query={query}
      errorMessage="Could not load your referrals."
      onRetry={reload}
    >
      {overview ? (
        !overview.patient && overview.out.length === 0 ? (
          <EmptyState
            title="No referrals sent in the last 30 days"
            description="Referrals you send appear here, with whether a reply has come back."
          />
        ) : (
          <Stack gap="s6">
            <ActionFeedback {...feedback.props} />
            {overview.patient ? (
              <RecipientCard
                key={overview.patient.token}
                overview={overview}
                source={source}
                feedback={feedback}
              />
            ) : (
              <Banner tone="info" title="No chart is open">
                Open a patient from My Queue to draft a referral for them.
              </Banner>
            )}
            <ReferralsOutCard rows={overview.out} note={overview.outNote} />
          </Stack>
        )
      ) : null}
    </DoctorTab>
  );
}
