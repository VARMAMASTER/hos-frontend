import {
  AiMark,
  Card,
  CardBody,
  CardHeader,
  Chip,
  EmptyState,
  Stack,
  Text,
  VitalsChart,
  type VitalsConfig,
} from '@hos/nova-ui';
import { useDoctorQuery, type BpReading } from '../../data';
import { AskPanel, DoctorTab } from '../../ui';
import type { HistoryWidgetProps } from './types';

// Her blood pressure against the reference range, one reading per visit. The shaded band is the
// published adult reference (below 140/90); the readings are the record's own.
const BP_CONFIG = {
  sys: {
    label: 'Systolic',
    unit: 'mmHg',
    color: 'chart-5',
    normal: { min: 90, max: 140 },
  },
  dia: {
    label: 'Diastolic',
    unit: 'mmHg',
    color: 'chart-6',
    normal: { min: 60, max: 90 },
  },
} satisfies VitalsConfig;

function bpData(readings: BpReading[]) {
  return readings.map((reading) => ({
    visit: reading.visit,
    sys: reading.systolic,
    dia: reading.diastolic,
  }));
}

// The prototype's Patient History (03-doctor.html, data-panel="history"): the AI Health Memory. Ask
// anything about this patient's record and the answer cites the visit it came from. The answers are
// facts and where they came from; none of them says what to do.
export function HistoryWidget({
  patientId,
  compactMode,
  className,
}: HistoryWidgetProps) {
  const { query, source, reload } = useDoctorQuery((s) => s.getHistory());
  const history = query.status === 'ready' ? query.data : null;

  return (
    <DoctorTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Patient History"
      description="Ask the AI Health Memory about the patient in your room."
      query={query}
      errorMessage="Could not load the patient history."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        history ? (
          <Stack gap="s6">
            <Card>
              <CardHeader
                title="Her blood pressure across visits"
                description="One reading per visit, against the published reference of below 140/90"
              />
              <CardBody>
                <VitalsChart
                  ariaLabel="Blood pressure across visits, systolic and diastolic in mmHg"
                  description="Systolic blood pressure has stayed above 140 at every visit since July 2024, from 142 to 148."
                  data={bpData(history.bp)}
                  config={BP_CONFIG}
                  categoryKey="visit"
                  seriesKeys={['sys', 'dia']}
                  panels={[
                    {
                      key: 'bp',
                      label: 'Blood pressure',
                      unit: 'mmHg',
                      seriesKeys: ['sys', 'dia'],
                    },
                  ]}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader
                title={`AI Health Memory — ${history.patient.name}`}
                description="Ask anything about this patient's history · answers cite the source visit"
                actions={
                  <Chip tone="ai" icon={<AiMark />}>
                    AI memory
                  </Chip>
                }
              />
              <CardBody>
                <AskPanel
                  ask={(question) => source.askHistory(question)}
                  suggestions={history.suggestions}
                  name="AI Health Memory"
                  threadLabel="Conversation with AI Health Memory"
                  composerLabel="Ask about this patient"
                  placeholder="Ask about this patient… e.g. adherence, allergies, overdue tests"
                  emptyHint={
                    <Text as="span" size="sm" tone="muted">
                      {history.indexedNote}
                    </Text>
                  }
                  thinkLabel="Searching 4 years of records"
                  errorMessage="AI Health Memory could not answer that."
                />
              </CardBody>
            </Card>
          </Stack>
        ) : (
          <EmptyState
            title="No patient history is open"
            description="Open a patient from My Queue to ask about their record."
          />
        )
      ) : null}
    </DoctorTab>
  );
}
