import { AiDraftBlock, BarChart, Button, Chip, Stack } from '@hos/nova-ui';
import type { DoctorDataSource, InsightCard } from '../../data';
import { Prose, useDraftDecision, type Feedback } from '../../ui';

interface InsightBlockProps {
  insight: InsightCard;
  doctorName: string;
  source: DoctorDataSource;
  feedback: Feedback;
}

// One insight. It is a suggestion the doctor can act on or dismiss, never a report card: acting on
// it is the doctor's approval, dismissing it takes a reason, and nothing changes before either.
export function InsightBlock({
  insight,
  doctorName,
  source,
  feedback,
}: InsightBlockProps) {
  const decision = useDraftDecision(feedback, {
    approve: async () => {
      await source.actOnInsight(insight.id, insight.action.id);
      feedback.notify({
        title: 'Insight actioned',
        detail: insight.action.doneLabel,
      });
    },
    reject: (reason) => source.dismissInsight(insight.id, reason),
  });

  async function runSecondary() {
    const secondary = insight.secondary;
    if (!secondary) return;
    const ok = await feedback.attempt(() =>
      source.actOnInsight(insight.id, secondary.id),
    );
    if (ok) {
      feedback.notify({
        title: 'Insight actioned',
        detail: secondary.doneLabel,
      });
    }
  }

  return (
    <AiDraftBlock
      {...decision}
      title={insight.title}
      approverName={doctorName}
      verb={insight.action.label}
      approvedVerb="Done"
      badges={<Chip tone={insight.chipTone}>{insight.chip}</Chip>}
      actions={
        insight.secondary ? (
          <Button variant="ghost" size="sm" onClick={() => void runSecondary()}>
            {insight.secondary.label}
          </Button>
        ) : undefined
      }
    >
      <Stack gap="s4">
        <Prose text={insight.text} />
        {insight.chart ? (
          <BarChart
            ariaLabel={insight.chart.label}
            data={insight.chart.bars.map(({ label, value }) => ({
              label,
              value,
            }))}
            config={{ value: { label: insight.chart.unit, color: 'chart-2' } }}
            categoryKey="label"
            seriesKeys={['value']}
            orientation="horizontal"
            height={160}
          />
        ) : null}
      </Stack>
    </AiDraftBlock>
  );
}
