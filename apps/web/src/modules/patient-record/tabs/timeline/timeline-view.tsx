import { useState } from 'react';
import {
  Box,
  Chip,
  EmptyState,
  FilterChip,
  Grid,
  Stack,
  Text,
} from '@hos/nova-ui';
import {
  usePatientRecordAction,
  usePatientRecordQuery,
  type TimelineEvent,
  type TimelineKind,
  type TimelineOverview,
  type TimelineSource,
} from '../../data';
import { ActionFeedback, PatientRecordTab, Section } from '../../ui';
import { MemoryPanel } from './memory-panel';
import { YearSection } from './year-section';
import { YearStrip } from './year-strip';
import type { TimelineWidgetProps } from './types';

type KindFilter = 'all' | TimelineKind;
type SourceFilter = 'all' | TimelineSource;

const KIND_FILTERS: Array<{ id: KindFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'visit', label: 'Visits' },
  { id: 'lab', label: 'Labs' },
  { id: 'rx', label: 'Pharmacy' },
  { id: 'ipd', label: 'Admissions' },
  { id: 'doc', label: 'Documents' },
  { id: 'bill', label: 'Billing' },
];

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

// The longitudinal timeline: every department's events, plus records pulled from other hospitals
// under her ABHA consent, assembled on their own. Four years must be graspable without scrolling, so
// the years other than the open one are collapsed, each with an honest count. Provenance is visible,
// not inferred. Every event is a recorded fact; nothing is predicted.
export function TimelineWidget({
  patientId,
  compactMode,
  readonly,
  className,
}: TimelineWidgetProps) {
  const { query, source, reload, update } = usePatientRecordQuery(
    (src, id) => src.getTimeline(id),
    patientId,
  );
  const action = usePatientRecordAction();
  const [kind, setKind] = useState<KindFilter>('all');
  const [origin, setOrigin] = useState<SourceFilter>('all');
  const [loadingYear, setLoadingYear] = useState<number | null>(null);
  const timeline = query.status === 'ready' ? query.data : undefined;

  const passes = (event: TimelineEvent) =>
    (kind === 'all' || event.kind === kind) &&
    (origin === 'all' || event.source === origin);

  async function openYear(year: number) {
    const found = timeline?.years.find((y) => y.year === year);
    if (!found) return;
    if (found.events !== null) {
      document
        .getElementById(`timeline-year-${year}`)
        ?.scrollIntoView?.({ block: 'nearest' });
      return;
    }
    setLoadingYear(year);
    const events = await action.run(() =>
      source.getTimelineYear(year, patientId),
    );
    setLoadingYear(null);
    if (!events) return;
    update((data: TimelineOverview) => ({
      ...data,
      years: data.years.map((y) => (y.year === year ? { ...y, events } : y)),
    }));
  }

  const years = timeline?.years ?? [];
  const oldestFirst = [...years].sort((a, b) => a.year - b.year);
  const range =
    oldestFirst.length > 0
      ? `${oldestFirst[0].year} → ${oldestFirst[oldestFirst.length - 1].year}`
      : '';

  return (
    <PatientRecordTab
      patientId={patientId}
      compactMode={compactMode}
      readonly={readonly}
      className={className}
      title="Timeline"
      description="Every department's events and her records from other hospitals, in one place."
      query={query}
      patient={timeline?.patient}
      errorMessage="Could not load the timeline."
      onRetry={reload}
      empty={
        timeline && timeline.totals.events === 0 ? (
          <EmptyState
            title="No events recorded yet"
            description="Visits, results, medicines and documents appear here as they are recorded."
          />
        ) : undefined
      }
    >
      {timeline ? (
        <Grid columns={3} gap="s6">
          <Stack gap="s6" className="min-w-0 md:col-span-2">
            <ActionFeedback
              notice={null}
              error={action.error}
              onDismissError={action.clearError}
            />
            <Section
              title="Four years in one record"
              description={`${timeline.totals.events} events · ${timeline.totals.departments} departments · ${timeline.totals.facilities} other ${plural(timeline.totals.facilities, 'hospital', 'hospitals')} — assembled automatically, none of it re-typed`}
              actions={
                <>
                  <Chip tone="ai">
                    {`${timeline.totals.external} ${plural(timeline.totals.external, 'event', 'events')} from other hospitals`}
                  </Chip>
                  <Chip tone="neutral">{range}</Chip>
                </>
              }
            >
              <Stack gap="s6">
                <YearStrip
                  years={oldestFirst}
                  onSelect={(y) => void openYear(y)}
                />
                <Stack
                  direction="horizontal"
                  gap="s6"
                  wrap
                  align="center"
                  aria-hidden="true"
                >
                  <Stack direction="horizontal" gap="s2" align="center">
                    <Box className="size-s3 rounded-tag bg-primary" />
                    <Text as="span" size="sm" tone="muted">
                      This hospital
                    </Text>
                  </Stack>
                  <Stack direction="horizontal" gap="s2" align="center">
                    <Box className="size-s3 rounded-tag bg-highlight" />
                    <Text as="span" size="sm" tone="muted">
                      Another hospital, via ABHA
                    </Text>
                  </Stack>
                  <Text as="span" size="sm" tone="muted">
                    Bar height = events recorded that year. Click a year to open
                    it below.
                  </Text>
                </Stack>
                <Stack gap="s4" className="border-t border-border pt-s5">
                  <Stack
                    direction="horizontal"
                    gap="s2"
                    wrap
                    role="group"
                    aria-label="Filter timeline by department"
                  >
                    {KIND_FILTERS.map((filter) => (
                      <FilterChip
                        key={filter.id}
                        pressed={kind === filter.id}
                        onPressedChange={() => setKind(filter.id)}
                      >
                        {`${filter.label} ${filter.id === 'all' ? timeline.totals.events : timeline.kindCounts[filter.id]}`}
                      </FilterChip>
                    ))}
                  </Stack>
                  <Stack
                    direction="horizontal"
                    gap="s2"
                    wrap
                    role="group"
                    aria-label="Filter timeline by source"
                  >
                    <FilterChip
                      pressed={origin === 'all'}
                      onPressedChange={() => setOrigin('all')}
                    >
                      All sources
                    </FilterChip>
                    <FilterChip
                      pressed={origin === 'in'}
                      onPressedChange={() => setOrigin('in')}
                    >
                      {`This hospital ${timeline.totals.internal}`}
                    </FilterChip>
                    <FilterChip
                      pressed={origin === 'ext'}
                      onPressedChange={() => setOrigin('ext')}
                    >
                      {`Other hospitals · ABHA ${timeline.totals.external}`}
                    </FilterChip>
                  </Stack>
                  <Text size="sm" tone="muted">
                    Counts cover the whole record {range}, including years still
                    collapsed below.
                  </Text>
                </Stack>
              </Stack>
            </Section>

            <Stack gap="s6">
              {years.map((year) => (
                <YearSection
                  key={year.year}
                  year={year}
                  visible={(year.events ?? []).filter(passes)}
                  loading={loadingYear === year.year}
                  onExpand={(y) => void openYear(y)}
                />
              ))}
            </Stack>
          </Stack>

          <MemoryPanel
            memory={timeline.memory}
            clinician={timeline.patient.clinician}
            patientId={timeline.patient.id}
            readonly={readonly}
          />
        </Grid>
      ) : null}
    </PatientRecordTab>
  );
}
