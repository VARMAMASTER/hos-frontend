import {
  BarChart,
  Card,
  CardBody,
  CardHeader,
  Grid,
  LineChart,
  Text,
} from '@hos/nova-ui';
import type { QueueOverview } from '../../data';

// The prototype's pace charts (03-doctor.html, .pace-chart-wrap): consults completed per hour, and
// the week's average wait. Both carry their data table as the accessible alternative.
export function QueueCharts({ queue }: { queue: QueueOverview }) {
  const hourly = queue.hourly.map((hour) => ({
    hour: hour.partial ? `${hour.hour} (so far)` : hour.hour,
    consults: hour.consults,
  }));
  return (
    <Grid columns={2} gap="s6">
      <Card>
        <CardHeader
          title="Consults per hour"
          description="Today's session · 09:00 AM – 01:00 PM"
        />
        <CardBody>
          <BarChart
            ariaLabel="Consults per hour, today's session"
            data={hourly}
            config={{
              consults: { label: 'Consults completed', color: 'chart-2' },
            }}
            categoryKey="hour"
            seriesKeys={['consults']}
            height={180}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Wait time this week"
          description="Minutes, average per session"
        />
        <CardBody>
          <LineChart
            ariaLabel="Wait time this week, minutes per session"
            data={queue.weekWait.map(({ day, minutes }) => ({ day, minutes }))}
            config={{ minutes: { label: 'Average wait', color: 'chart-1' } }}
            categoryKey="day"
            seriesKeys={['minutes']}
            valueFormatter={(value) => `${value} min`}
            height={180}
          />
          <Text size="xs" tone="muted">
            {queue.weekWaitNote}
          </Text>
        </CardBody>
      </Card>
    </Grid>
  );
}
