import { Box, Grid, Sparkline, Stack, Text } from '@hos/nova-ui';
import type { Trajectory } from '../../data';
import { FlagChip, Section } from '../../ui';

export interface TrajectoriesSectionProps {
  trajectories: Trajectory[];
}

// Result trajectories: the value is the direction, which a single number on a report can never
// show. The line is plotted in the data colour, never a status colour; the direction is in words.
export function TrajectoriesSection({
  trajectories,
}: TrajectoriesSectionProps) {
  return (
    <Section
      title="Result trajectories"
      description="Four years of her own results: the direction is the finding, not any single value"
      footnote="Every point is a result already in her record, 2 of them pulled from other hospitals under her ABHA consent. Nothing here is extrapolated."
    >
      <Grid columns={3} gap="s4" role="list">
        {trajectories.map((trajectory) => (
          <Box
            key={trajectory.id}
            role="listitem"
            surface="inset"
            radius="card"
            padding="s4"
            className="min-w-0"
          >
            <Stack gap="s2">
              <Stack
                direction="horizontal"
                align="baseline"
                justify="between"
                gap="s3"
              >
                <Text as="span" variant="label" tone="muted">
                  {trajectory.label}
                </Text>
                <Text
                  as="span"
                  size="lg"
                  weight="semibold"
                  className="tabular-nums"
                >
                  {trajectory.latest}
                </Text>
              </Stack>
              <Sparkline
                ariaLabel={trajectory.description}
                data={trajectory.points.map((point) => ({
                  label: point.label,
                  value: point.value,
                }))}
                config={{
                  value: { label: trajectory.label, color: 'chart-1' },
                }}
                categoryKey="label"
                seriesKeys={['value']}
                height={56}
                valueFormatter={(value) =>
                  trajectory.unit
                    ? `${value} ${trajectory.unit}`
                    : String(value)
                }
              />
              <Stack
                direction="horizontal"
                align="center"
                justify="between"
                wrap
                gap="s2"
              >
                <FlagChip flag={trajectory.direction} />
                {trajectory.target ? (
                  <Text as="span" size="sm" tone="muted">
                    {trajectory.target}
                  </Text>
                ) : null}
              </Stack>
              {trajectory.note ? (
                <Text size="sm" tone="muted">
                  {trajectory.note}
                </Text>
              ) : null}
            </Stack>
          </Box>
        ))}
      </Grid>
    </Section>
  );
}
