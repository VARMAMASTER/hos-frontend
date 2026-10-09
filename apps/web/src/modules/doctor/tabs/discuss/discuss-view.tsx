import {
  AiMark,
  AiClassChip,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Stack,
} from '@hos/nova-ui';
import { useDoctorQuery } from '../../data';
import { ActionFeedback, AskPanel, DoctorTab, useFeedback } from '../../ui';
import { FactsCard } from './facts-card';
import { PanelCard } from './panel-card';
import type { DiscussWidgetProps } from './types';

// The prototype's Case Discussion (03-doctor.html, data-panel="discuss"): what the record contains,
// three AI lenses that disagree, and a panel to ask for evidence. The lenses recommend nothing and
// there is no chairman to resolve them: the decision is the doctor's.
export function DiscussWidget({
  patientId,
  compactMode,
  className,
}: DiscussWidgetProps) {
  const { query, source, reload } = useDoctorQuery((s) => s.getDiscussion());
  const feedback = useFeedback();
  const discussion = query.status === 'ready' ? query.data : null;

  return (
    <DoctorTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Case Discussion"
      description="Three lenses read the record of the patient in your room, and disagree."
      query={query}
      errorMessage="Could not load the case discussion."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        discussion ? (
          <Stack gap="s6">
            <ActionFeedback {...feedback.props} />
            <FactsCard discussion={discussion} />
            <PanelCard
              discussion={discussion}
              source={source}
              feedback={feedback}
            />
            <Card>
              <CardHeader
                title={
                  <>
                    <AiMark /> Ask the panel
                  </>
                }
                description="Follow-up questions get evidence, with the record it came from named. They do not get advice — try asking for some."
                actions={
                  <AiClassChip tier="amber" detail="evidence from the record" />
                }
              />
              <CardBody>
                <AskPanel
                  ask={(question) => source.askPanel(question)}
                  suggestions={discussion.suggestions}
                  name="The panel"
                  threadLabel="Conversation with the panel"
                  composerLabel="Ask the panel"
                  placeholder="Ask the panel… e.g. show me the label, the lipid order, the allergy contradiction"
                  emptyHint="The three lenses stay available after they report. Ask any of them for the evidence behind a line — or ask the panel what to do, and watch what happens."
                  thinkLabel="Three lenses checking her record"
                  errorMessage="The panel could not answer that."
                />
              </CardBody>
            </Card>
          </Stack>
        ) : (
          <EmptyState
            title="No case is open for discussion"
            description="Open a patient from My Queue to convene the panel on their record."
          />
        )
      ) : null}
    </DoctorTab>
  );
}
