import { Box, Grid, Stack, Text } from '@hos/nova-ui';
import type { DoctorMetric } from '../data';
import { Prose } from './prose';

export interface MetricStripProps {
  // Names the strip for assistive technology.
  label: string;
  metrics: DoctorMetric[];
  columns?: 2 | 3 | 4;
}

// The prototype's honest-metric strip (.metric-strip): a figure with the sentence that says what it
// measures, and where a published number comes from. Never a bare percentage.
export function MetricStrip({ label, metrics, columns = 4 }: MetricStripProps) {
  return (
    <Grid columns={columns} gap="s4" role="list" aria-label={label}>
      {metrics.map((metric) => (
        <Box
          key={metric.id}
          role="listitem"
          border
          radius="card"
          surface="inset"
          padding="s4"
        >
          <Stack gap="s1">
            <Text font="display" size="lg" weight="bold">
              {metric.value}
            </Text>
            <Box className="text-caption text-ink-2">
              <Prose text={metric.label} />
            </Box>
            {metric.source ? (
              <Text size="xs" tone="muted">
                {metric.source}
              </Text>
            ) : null}
          </Stack>
        </Box>
      ))}
    </Grid>
  );
}
