import { useEffect, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/button/button';
import {
  ExtractedValuesReview,
  type ExtractedValuesReviewProps,
  type ExtractionState,
} from '../components/extracted-values-review/extracted-values-review';
import {
  KFT_REPORT_EDITS,
  KFT_REPORT_VALUES,
} from '../components/extracted-values-review/extracted-values-review.stories';

// Reading paper reports: an outside lab printout is read by AI, and the clinician reviews every
// value before anything enters the chart. The patient, the lab and the staff are fictional. Flip the
// toolbar's scheme, theme and material, or open the Dark stories.
const meta = { title: 'AI/Reading paper reports' } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DARK = { scheme: 'dark' } as const;

const REPORT = {
  title: 'Kidney function test',
  lab: 'Sunrise Diagnostics, Secunderabad',
  reportDate: '14 Mar 2026',
  patient: 'Lakshmi Devi, 58F',
  approverName: 'Dr. K. Ramesh',
  values: KFT_REPORT_VALUES,
  defaultEdits: KFT_REPORT_EDITS,
  onViewSource: () => undefined,
} satisfies ExtractedValuesReviewProps;

const STEPS = [
  'Uploading lakshmi-kft_14mar2026.jpg (2.1 MB)',
  'Straightening and sharpening the photo',
  'Reading the page: a mixed Telugu and English layout',
  'Matching test names to LOINC codes',
  'Comparing with results already in her chart',
];

function Frame({ children }: { children: ReactNode }) {
  return <div className="max-w-5xl">{children}</div>;
}

// The nine-value report under review: two low-confidence rows and the already-filed eGFR arrive
// unticked, potassium is critical, and the urea the AI misread as 4.2 has been corrected to 42.
export const LabReport: Story = {
  render: () => (
    <Frame>
      <ExtractedValuesReview {...REPORT} />
    </Frame>
  ),
};
export const LabReportDark: Story = { ...LabReport, globals: DARK };

// The whole flow: the report is read step by step, then the review opens. Read it again to restart.
function ReadingFlow() {
  const [run, setRun] = useState(0);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<ExtractionState>('reading');

  useEffect(() => {
    if (state !== 'reading') return;
    const timer = window.setTimeout(() => {
      if (step + 1 < STEPS.length) setStep(step + 1);
      else setState('ready');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [state, step]);

  return (
    <Frame>
      <div className="flex flex-col gap-s5">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRun(run + 1);
              setStep(0);
              setState('reading');
            }}
          >
            Read the report again
          </Button>
        </div>
        <ExtractedValuesReview
          key={run}
          {...REPORT}
          defaultEdits={undefined}
          values={state === 'reading' ? [] : KFT_REPORT_VALUES}
          state={state}
          onStateChange={setState}
          readingSteps={STEPS}
          readingStep={step}
        />
      </div>
    </Frame>
  );
}

export const ReadAndReview: Story = { render: () => <ReadingFlow /> };

export const Reading: Story = {
  render: () => (
    <Frame>
      <ExtractedValuesReview
        {...REPORT}
        values={[]}
        state="reading"
        readingSteps={STEPS}
        readingStep={2}
      />
    </Frame>
  ),
};
export const ReadingDark: Story = { ...Reading, globals: DARK };

export const Approved: Story = {
  render: () => (
    <Frame>
      <ExtractedValuesReview
        {...REPORT}
        defaultState="approved"
        approvedBy="Dr. K. Ramesh"
        approvedAt="10:52 AM"
      />
    </Frame>
  ),
};
export const ApprovedDark: Story = { ...Approved, globals: DARK };

export const Rejected: Story = {
  render: () => (
    <Frame>
      <ExtractedValuesReview
        {...REPORT}
        defaultState="rejected"
        rejectedBy="Dr. K. Ramesh"
        rejectionReason="This is her 2019 report; we already have newer values."
      />
    </Frame>
  ),
};
export const RejectedDark: Story = { ...Rejected, globals: DARK };

export const CouldNotRead: Story = {
  name: 'Error',
  render: () => (
    <Frame>
      <ExtractedValuesReview
        {...REPORT}
        values={[]}
        state="error"
        errorMessage="The photo is too blurred to read. Retake it in good light, flat on a table."
        onRetry={() => undefined}
        onEnterManually={() => undefined}
      />
    </Frame>
  ),
};
export const CouldNotReadDark: Story = {
  ...CouldNotRead,
  name: 'Error dark',
  globals: DARK,
};

// The report names someone else: approval waits until the clinician confirms they have checked.
export const PatientMismatch: Story = {
  render: () => (
    <Frame>
      <ExtractedValuesReview
        {...REPORT}
        patient="Laxmi D., 61F"
        chartPatient="Lakshmi Devi, 58F"
        patientMismatch
      />
    </Frame>
  ),
};
export const PatientMismatchDark: Story = {
  ...PatientMismatch,
  globals: DARK,
};

// A narrow screen: the table scrolls sideways under a pinned Include column.
export const NarrowScreen: Story = {
  render: () => (
    <div className="max-w-sm">
      <ExtractedValuesReview {...REPORT} />
    </div>
  ),
};
