import { useState } from 'react';
import {
  Banner,
  Button,
  Chip,
  ExtractedValuesReview,
  Stack,
  Text,
  type ExtractedValue,
  type ExtractedValuesReviewLabels,
  type ExtractionApproval,
  type ExtractionState,
} from '@hos/nova-ui';
import {
  usePatientRecord,
  usePatientRecordAction,
  type FilingReceipt,
  type OutsideReading,
  type PatientHeader,
  type ReadValue,
} from '../../data';
import { ActionFeedback, Section, type ActionNotice } from '../../ui';

export interface OutsideReportProps {
  patient: PatientHeader;
  uploadLimits: string;
  // A read-only chart cannot take in a new report.
  readonly?: boolean;
  // The photo is now (or no longer) part of the record.
  onFiled: (receipt: FilingReceipt) => void;
  onWithdrawn: (documentId: string) => void;
}

// What the review says about where a value falls: against the range printed on the report, and
// nothing more. Transcription is not interpretation, so no value is called abnormal or a disease.
const STATUS_WORDS: ExtractedValuesReviewLabels['status'] = {
  normal: 'Within range',
  low: 'Outside reference range',
  high: 'Outside reference range',
  'critical-low': 'Outside reference range · critical',
  'critical-high': 'Outside reference range · critical',
};

function toExtracted(value: ReadValue): ExtractedValue {
  return {
    id: value.id,
    test: value.test,
    value: value.value,
    unit: value.unit,
    range: {
      low: value.rangeLow,
      high: value.rangeHigh,
      text: value.rangeText,
    },
    confidence: value.confidence,
    source: value.source,
    filed: value.filed,
    filedSource: value.filedSource,
  };
}

function filedSummary(
  reading: OutsideReading,
  approval: ExtractionApproval,
): string {
  const filed = approval.values;
  const left = reading.values.filter(
    (value) => !filed.some((f) => f.id === value.id),
  );
  const list = filed
    .map((v) => `${v.test} ${v.value}${v.unit ? ` ${v.unit}` : ''}`)
    .join(', ');
  const count = filed.length;
  return `Filed ${count} ${count === 1 ? 'value' : 'values'} as observations dated ${reading.reportDate}: ${list}. Attributed to ${reading.lab}, with the photo attached as the source document.${
    left.length > 0 ? ` Not filed: ${left.map((v) => v.test).join(', ')}.` : ''
  }`;
}

// Reading an outside paper report (the prototype's "Reports that arrive on paper"). A printout or a
// phone photo from another clinic is read for its values, which are only PROPOSED: each arrives
// ticked or not, the shaky ones unticked and saying why, and nothing reaches the chart until a person
// approves exactly what they ticked, under their name. Approval can be taken back.
export function OutsideReport({
  patient,
  uploadLimits,
  readonly = false,
  onFiled,
  onWithdrawn,
}: OutsideReportProps) {
  const source = usePatientRecord();
  const action = usePatientRecordAction();
  const [reading, setReading] = useState<OutsideReading | null>(null);
  const [state, setState] = useState<ExtractionState | null>(null);
  const [receipt, setReceipt] = useState<FilingReceipt | null>(null);
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  async function read() {
    setNotice(null);
    setReceipt(null);
    setReading(null);
    setState('reading');
    try {
      const found = await source.readOutsideReport(patient.id);
      setReading(found);
      setState('ready');
    } catch {
      // The reader's own error is not shown: fixed words, nothing about the patient.
      setState('error');
    }
  }

  async function file(approval: ExtractionApproval) {
    if (!reading) return;
    const filed = await action.run(() =>
      source.fileExtractedValues({
        readingId: reading.id,
        approver: approval.approver,
        values: approval.values.map((v) => ({ id: v.id, value: v.value })),
      }),
    );
    if (!filed) {
      // Nothing was filed: the values are still a draft.
      setState('ready');
      return;
    }
    setReceipt(filed);
    onFiled(filed);
    setNotice({
      title: 'Filed to her chart',
      detail: filedSummary(reading, approval),
    });
  }

  async function undo() {
    setNotice(null);
    // Undoing a rejection writes nothing, so only a filing has anything to take back.
    if (!reading || !receipt) return;
    const withdrawn = await action.run(async () => {
      await source.withdrawFiling(reading.id);
      return true;
    });
    if (!withdrawn) {
      // The chart still holds the values: the review stays approved.
      setState('approved');
      return;
    }
    onWithdrawn(receipt.document.id);
    setReceipt(null);
  }

  async function keepAsDocument() {
    if (!reading) return;
    const kept = await action.run(() =>
      source.keepReportAsDocument(reading.id),
    );
    if (!kept) return;
    onFiled(kept);
    setReading(null);
    setState(null);
    setNotice({
      title: 'Kept as a document only',
      detail: 'The file is attached to her record; no values were charted.',
    });
  }

  const mismatch = reading !== null && reading.patientOnReport !== patient.name;

  return (
    <Section
      title="Reports that arrive on paper"
      description="Upload an outside printout or a phone photo: HOS reads the values off it so they can join her own trend lines"
      actions={
        <Chip tone="neutral" title="Transcription is non-diagnostic">
          Transcription · not interpretation
        </Chip>
      }
      footnote="Why this matters more here than anywhere else: a repeat KFT costs her ₹600 and a second trip. The report was already in her hand; it just wasn’t in any system."
    >
      <Stack gap="s6">
        <ActionFeedback
          notice={notice}
          error={action.error}
          onDismissNotice={() => setNotice(null)}
          onDismissError={action.clearError}
        />
        {state === null && !readonly ? (
          <Stack gap="s2" align="start">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => void read()}
            >
              Drop a report photo or PDF here, or browse to upload
            </Button>
            <Text size="sm" tone="muted">
              {uploadLimits}
            </Text>
            <Text size="sm" tone="muted">
              This prototype reads an invented sample report, a photo of a
              printed kidney function test.
            </Text>
          </Stack>
        ) : null}
        {state === null && readonly ? (
          <Banner tone="info" title="This chart is read-only">
            A new report cannot be read into it from here.
          </Banner>
        ) : null}
        {state !== null ? (
          <ExtractedValuesReview
            title={
              reading
                ? `Read from ${reading.fileName} — ${reading.values.length} values found`
                : 'Reading the report'
            }
            lab={reading?.lab}
            reportDate={reading?.reportDate}
            patient={reading?.patientOnReport}
            chartPatient={patient.name}
            patientMismatch={mismatch}
            values={reading ? reading.values.map(toExtracted) : []}
            state={state}
            onStateChange={setState}
            approverName={patient.clinician}
            labels={{ status: STATUS_WORDS }}
            onApprove={(approval) => void file(approval)}
            onUndo={() => void undo()}
            onRetry={() => void read()}
            actions={
              state === 'ready' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void keepAsDocument()}
                >
                  Keep as document only
                </Button>
              ) : undefined
            }
          />
        ) : null}
      </Stack>
    </Section>
  );
}
