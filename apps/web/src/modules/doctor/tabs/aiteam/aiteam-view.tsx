import { useState } from 'react';
import { Banner, Grid, Stack } from '@hos/nova-ui';
import {
  useDoctorQuery,
  type AiTeamOverview,
  type DoctorDataSource,
  type PersonalAgent,
} from '../../data';
import {
  ActionFeedback,
  DoctorTab,
  Prose,
  useFeedback,
  type Feedback,
} from '../../ui';
import { SahayakaCard } from './sahayaka-card';
import { SandarbhaCard } from './sandarbha-card';
import type { AiteamWidgetProps } from './types';

// The prototype's My AI Team (03-doctor.html, data-panel="aiteam"): two agents, both on a leash the
// doctor can see. Sahayaka learns the doctor and shows every learned behaviour with an off switch;
// Sandarbha is the General Medicine reference and cites everything. Neither diagnoses, and neither
// prescribes: those are not switched-off features, they are not built.
export function AiteamWidget({
  patientId,
  compactMode,
  className,
}: AiteamWidgetProps) {
  const { query, source, reload } = useDoctorQuery((s) => s.getAiTeam());
  const feedback = useFeedback();
  const team = query.status === 'ready' ? query.data : null;

  return (
    <DoctorTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="My AI Team"
      description="The two agents that work for you, and what each has learned or may say."
      query={query}
      errorMessage="Could not load your AI team."
      onRetry={reload}
    >
      {team ? (
        <AiTeamDesk team={team} source={source} feedback={feedback} />
      ) : null}
    </DoctorTab>
  );
}

interface AiTeamDeskProps {
  team: AiTeamOverview;
  source: DoctorDataSource;
  feedback: Feedback;
}

function AiTeamDesk({ team, source, feedback }: AiTeamDeskProps) {
  // The personal agent's rows change as the doctor switches them, so the card keeps its own copy.
  const [sahayaka, setSahayaka] = useState<PersonalAgent>(team.sahayaka);

  return (
    <Stack gap="s6">
      <ActionFeedback {...feedback.props} />
      <Banner tone="ai" title="Two agents, both on a leash you can see">
        <Prose text={team.intro} />
      </Banner>
      <Grid columns={2} gap="s6">
        <SahayakaCard
          agent={sahayaka}
          onChange={setSahayaka}
          source={source}
          feedback={feedback}
        />
        <SandarbhaCard
          agent={team.sandarbha}
          doctorName={team.doctorName}
          source={source}
          feedback={feedback}
        />
      </Grid>
    </Stack>
  );
}
