import { useState } from 'react';
import {
  Banner,
  Card,
  CardBody,
  CardHeader,
  Chip,
  EmptyState,
  Stack,
} from '@hos/nova-ui';
import {
  useReceptionAction,
  useReceptionQuery,
  type AdmissionOverview,
  type AdmissionRequest,
  type AdmissionResult,
  type PayerId,
  type ReceptionDataSource,
} from '../../data';
import {
  ActionFeedback,
  ReceptionKpis,
  ReceptionTab,
  type ActionNotice,
} from '../../ui';
import {
  AdjustEstimateDialog,
  EstimateSection,
  ORIGINAL_CHOICES,
  priceEstimate,
  type EstimateChoices,
} from './admission-estimate';
import { AdmitCard, ReuseTable } from './admission-fanout';
import {
  AttenderStep,
  BedStep,
  ConsentStep,
  IdentityStep,
  PayerStep,
  ReasonStep,
} from './admission-steps';
import type { AdmissionWidgetProps } from './types';

// The prototype's Admission (02-reception.html, data-panel="admission"): one screen, not a wizard.
// Every fact is collected once and then fanned out to IPD, Billing, Claims, Nursing, Lab and OT.
export function AdmissionWidget({
  patientId,
  compactMode,
  className,
}: AdmissionWidgetProps) {
  const { query, source, reload, update } = useReceptionQuery((s) =>
    s.getAdmission(),
  );
  return (
    <ReceptionTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Admission"
      description="Collect it once: identity, payer, bed and consent in one pass, then it fans out to every workspace."
      query={query}
      errorMessage="Could not load admissions."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        <AdmissionDesk
          overview={query.data}
          source={source}
          onChange={update}
        />
      ) : null}
    </ReceptionTab>
  );
}

interface AdmissionDeskProps {
  overview: AdmissionOverview;
  source: ReceptionDataSource;
  onChange: (
    change: (overview: AdmissionOverview) => AdmissionOverview,
  ) => void;
}

function AdmissionDesk({ overview, source, onChange }: AdmissionDeskProps) {
  const { request } = overview;
  if (!request) {
    return (
      <Stack gap="s6">
        <ReceptionKpis label="Admission figures" kpis={overview.kpis} />
        <EmptyState
          title="No admission waiting"
          description="A planned admission appears here once the admitting doctor's note is on file."
        />
      </Stack>
    );
  }
  return (
    <AdmissionForm
      overview={overview}
      request={request}
      source={source}
      onChange={onChange}
    />
  );
}

interface AdmissionFormProps extends AdmissionDeskProps {
  request: AdmissionRequest;
}

function AdmissionForm({
  overview,
  request,
  source,
  onChange,
}: AdmissionFormProps) {
  const action = useReceptionAction();
  const [running, setRunning] = useState<'estimate' | 'admit' | null>(null);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [payerId, setPayerId] = useState<PayerId>(
    request.payers[0]?.id ?? 'self',
  );
  const [wardId, setWardId] = useState(request.bed.wards[0]?.id ?? '');
  const [bedId, setBedId] = useState(request.bed.beds[0]?.id ?? '');
  const [captured, setCaptured] = useState<ReadonlySet<string>>(new Set());
  const [choices, setChoices] = useState<EstimateChoices>(ORIGINAL_CHOICES);
  const [adjusting, setAdjusting] = useState(false);
  const [result, setResult] = useState<AdmissionResult | null>(null);

  const payer = request.payers.find((item) => item.id === payerId);
  if (!payer) return null;
  const missing = request.consents.length - captured.size;
  const hint =
    missing === 0
      ? 'All consents captured — ready to admit'
      : `Consent switches must be captured first (${captured.size} of ${request.consents.length})`;

  async function perform<R>(kind: typeof running, task: () => Promise<R>) {
    setRunning(kind);
    setNotice(null);
    setBlocked(null);
    const done = await action.run(task);
    setRunning(null);
    return done;
  }

  // The patient's consent is asked for on their own phone; nothing is pulled until they approve it.
  function repull() {
    setBlocked(null);
    setNotice({
      title: 'Consent requested on the patient’s phone',
      detail:
        'Nothing is pulled from ABHA until they approve. The request expires in 5 minutes.',
    });
  }

  async function approveEstimate(): Promise<boolean> {
    const sent = await perform('estimate', async () => {
      await source.approveEstimate(request.id);
      return true;
    });
    if (!sent) return false;
    setNotice({
      title: 'Estimate approved & sent',
      detail: `${request.patient.name} · ${priceTotal(request, choices)} ±10% · WhatsApp copy to the patient and to ${request.attender.name}`,
    });
    return true;
  }

  async function admit() {
    if (missing > 0) {
      setNotice(null);
      setBlocked(
        `Cannot admit yet — ${missing} consent${missing === 1 ? '' : 's'} missing`,
      );
      return;
    }
    const admitted = await perform('admit', () =>
      source.admit({
        requestId: request.id,
        payer: payerId,
        wardId,
        bedId,
        consentIds: request.consents
          .filter((consent) => captured.has(consent.id))
          .map((consent) => consent.id),
      }),
    );
    if (!admitted) return;
    setResult(admitted);
    onChange((current) => ({
      ...current,
      kpis: current.kpis.map((kpi) =>
        kpi.id === 'free-beds' ? { ...kpi, value: admitted.freeBeds } : kpi,
      ),
    }));
    setNotice({
      title: `${request.patient.name} admitted to ${bedId}`,
      detail:
        'IPD, billing, claims, nursing, lab and OT all written from this one form',
    });
  }

  return (
    <Stack gap="s6">
      <ActionFeedback
        notice={notice}
        error={adjusting ? null : action.error}
        onDismissNotice={() => setNotice(null)}
        onDismissError={action.clearError}
      />
      {blocked ? (
        <Banner
          tone="warn"
          title={blocked}
          onDismiss={() => setBlocked(null)}
          dismissLabel="Dismiss the warning"
        >
          HOS will not open an IPD encounter without them. This is the one place
          a blocking check is worth the friction.
        </Banner>
      ) : null}
      <ReceptionKpis label="Admission figures" kpis={overview.kpis} />
      <Banner tone="good" title="One pass, then it fans out.">
        {overview.banner.replace(/^One pass, then it fans out\.\s*/, '')}
      </Banner>
      <Card>
        <CardHeader
          title="Admit a patient"
          description={request.when}
          actions={<Chip tone="info">{request.dateChip}</Chip>}
        />
        <CardBody>
          <IdentityStep patient={request.patient} onRepull={repull} />
          <ReasonStep reason={request.reason} />
          <PayerStep
            request={request}
            payer={payerId}
            onPayerChange={setPayerId}
          />
          <BedStep
            request={request}
            payer={payerId}
            wardId={wardId}
            bedId={bedId}
            onWardChange={setWardId}
            onBedChange={setBedId}
          />
          <AttenderStep attender={request.attender} />
          <ConsentStep
            consents={request.consents}
            captured={captured}
            onToggle={(id, on) => {
              setBlocked(null);
              setCaptured((current) => {
                const next = new Set(current);
                if (on) next.add(id);
                else next.delete(id);
                return next;
              });
            }}
          />
        </CardBody>
      </Card>
      <EstimateSection
        request={request}
        payer={payer}
        choices={choices}
        busy={running === 'estimate'}
        onApprove={approveEstimate}
        onAdjust={() => {
          setNotice(null);
          setAdjusting(true);
        }}
      />
      <AdmitCard
        patientName={request.patient.name}
        bedId={bedId}
        payer={payer}
        hint={hint}
        busy={running === 'admit'}
        result={result}
        onAdmit={() => void admit()}
      />
      <ReuseTable reuse={request.reuse} />
      {adjusting ? (
        <AdjustEstimateDialog
          choices={choices}
          onClose={() => setAdjusting(false)}
          onSave={(next) => {
            setChoices(next);
            setAdjusting(false);
            setNotice({
              title: 'Estimate re-priced',
              detail:
                'Still awaiting your sign-off — the patient sees nothing yet',
            });
          }}
        />
      ) : null}
    </Stack>
  );
}

function priceTotal(request: AdmissionRequest, choices: EstimateChoices) {
  return priceEstimate(request.estimate.lines, choices).total;
}
