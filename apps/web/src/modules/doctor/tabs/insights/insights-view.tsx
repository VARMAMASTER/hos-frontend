import {
  AiButton,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Stack,
  Text,
} from '@hos/nova-ui';
import {
  useDoctorQuery,
  type DoctorDataSource,
  type InsightsOverview,
} from '../../data';
import {
  ActionFeedback,
  AiRunSteps,
  DoctorTab,
  useAiRun,
  useFeedback,
  type Feedback,
} from '../../ui';
import { InsightBlock } from './insight-block';
import type { InsightsWidgetProps } from './types';

// The prototype's AI Insights (03-doctor.html, data-panel="insights"): patterns across the doctor's
// own approved consultations. On request, private to the doctor, and every insight is a suggestion
// they can act on or dismiss: never a report card, and nothing changes until they approve it.
export function InsightsWidget({
  patientId,
  compactMode,
  className,
}: InsightsWidgetProps) {
  const { query, source, reload } = useDoctorQuery((s) => s.getInsights());
  const feedback = useFeedback();
  const overview = query.status === 'ready' ? query.data : null;

  return (
    <DoctorTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="AI Insights"
      description="What your last 30 days of consultations show that one visit cannot."
      query={query}
      errorMessage="Could not load your insights."
      onRetry={reload}
    >
      {overview ? (
        <InsightsDesk overview={overview} source={source} feedback={feedback} />
      ) : null}
    </DoctorTab>
  );
}

interface InsightsDeskProps {
  overview: InsightsOverview;
  source: DoctorDataSource;
  feedback: Feedback;
}

function InsightsDesk({ overview, source, feedback }: InsightsDeskProps) {
  const run = useAiRun(() => source.analyzeInsights(), overview.steps.length);
  const result = run.result;

  return (
    <Stack gap="s6">
      <ActionFeedback {...feedback.props} />
      <Card>
        <CardHeader
          title={
            <>
              <Text as="span" aria-hidden="true">
                ✦
              </Text>{' '}
              Patterns across your consultations
            </>
          }
          description={overview.intro}
          actions={
            <AiButton
              state={
                run.phase === 'running'
                  ? 'thinking'
                  : run.phase === 'done'
                    ? 'done'
                    : 'idle'
              }
              thinkingLabel="Analyzing…"
              doneLabel="Analysis complete"
              aria-disabled={
                run.phase === 'running' || run.phase === 'done'
                  ? true
                  : undefined
              }
              onClick={run.start}
            >
              Analyze my last 30 days
            </AiButton>
          }
        />
        {run.phase !== 'idle' ? (
          <CardBody>
            <Stack gap="s4">
              <AiRunSteps
                steps={overview.steps}
                run={run}
                label="Insight analysis progress"
              />
              {run.phase === 'error' ? (
                <Text tone="crit">
                  The analysis could not run. Nothing was changed — try again.
                </Text>
              ) : null}
              {result && result.insights.length === 0 ? (
                <EmptyState
                  title="No new patterns in the last 30 days"
                  description="Nothing in your approved consultations stands out beyond what you already know."
                />
              ) : null}
              {result && result.insights.length > 0 ? (
                <>
                  {result.insights.map((insight) => (
                    <InsightBlock
                      key={insight.id}
                      insight={insight}
                      doctorName={overview.doctorName}
                      source={source}
                      feedback={feedback}
                    />
                  ))}
                  <Text size="xs" tone="muted">
                    {result.footnote}
                  </Text>
                </>
              ) : null}
            </Stack>
          </CardBody>
        ) : null}
      </Card>
    </Stack>
  );
}
