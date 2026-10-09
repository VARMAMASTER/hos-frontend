import { useState } from 'react';
import {
  AiDraftBlock,
  AiSourceLine,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Dialog,
  Divider,
  Select,
  SplitLayout,
  Stack,
  Text,
  TextField,
  type AiDraftStatus,
} from '@hos/nova-ui';
import type { AdmissionRequest, EstimateLine, PayerOption } from '../../data';
import { rupee, rupeeValue } from './money';

// What a person may change on the AI-assembled estimate: the two items it flagged as different from
// the hospital's last six knee replacements.
export interface EstimateChoices {
  implant: 'cobalt' | 'standard' | 'highflex';
  physio: 'five' | 'four';
  note: string;
}

export const ORIGINAL_CHOICES: EstimateChoices = {
  implant: 'cobalt',
  physio: 'five',
  note: 'Implant model chosen by the surgeon; ₹8,000 above the standard option.',
};

const IMPLANTS: Record<
  EstimateChoices['implant'],
  { option: string; line: string; amount: number }
> = {
  cobalt: {
    option: 'Cobalt-chrome, cemented — ₹76,000 (surgeon’s choice)',
    line: '',
    amount: 76000,
  },
  standard: {
    option: 'Standard cemented — ₹68,000',
    line: 'Knee implant — standard cemented',
    amount: 68000,
  },
  highflex: {
    option: 'High-flex — ₹94,000',
    line: 'Knee implant — high-flex',
    amount: 94000,
  },
};

const PHYSIO: Record<
  EstimateChoices['physio'],
  { option: string; line: string; amount: number }
> = {
  five: {
    option: '5 sessions — ₹2,250 (as planned)',
    line: '',
    amount: 2250,
  },
  four: {
    option: '4 sessions — ₹1,800 (protocol default)',
    line: 'Physiotherapy · 4 sessions @ ₹450',
    amount: 1800,
  },
};

// The estimate's lines with the person's choices applied to the originals (never to a previous
// re-pricing), and the total they add up to.
export function priceEstimate(
  original: EstimateLine[],
  choices: EstimateChoices,
): { lines: EstimateLine[]; total: string } {
  const lines = original.map((line) => {
    if (line.label.startsWith('Knee implant') && choices.implant !== 'cobalt') {
      const pick = IMPLANTS[choices.implant];
      return { label: pick.line, amount: rupee(pick.amount) };
    }
    if (line.label.startsWith('Physiotherapy') && choices.physio !== 'five') {
      const pick = PHYSIO[choices.physio];
      return { label: pick.line, amount: rupee(pick.amount) };
    }
    return line;
  });
  const total = lines.reduce((sum, line) => sum + rupeeValue(line.amount), 0);
  return { lines, total: rupee(total) };
}

export interface EstimateCardProps {
  payer: PayerOption;
  lines: EstimateLine[];
  total: string;
  note: string;
  // What the person wrote for the patient, once they have adjusted the estimate.
  patientNote?: string;
}

// The itemised estimate and the payer's split of it (the prototype's "Estimate at admission").
export function EstimateCard({
  payer,
  lines,
  total,
  note,
  patientNote,
}: EstimateCardProps) {
  return (
    <Card>
      <CardHeader
        title="Estimate at admission"
        description="From the tariff master + the surgeon's plan · good-faith figure, ±10%"
        actions={<Chip tone="info">{payer.chip}</Chip>}
      />
      <CardBody>
        <Stack gap="s4">
          <Stack as="ul" gap="s2" aria-label="Estimate at admission">
            {lines.map((line) => (
              <li key={line.label}>
                <AmountRow label={line.label} amount={line.amount} />
              </li>
            ))}
            <li>
              <AmountRow label="Total estimate" amount={total} total />
            </li>
          </Stack>
          <Divider />
          <Stack as="ul" gap="s2" aria-label="Who pays what">
            {payer.split.map((row) => (
              <li key={row.label}>
                <AmountRow label={row.label} amount={row.amount} />
              </li>
            ))}
          </Stack>
          <Text size="sm" tone="muted">
            {note}
          </Text>
          {patientNote ? (
            <Text size="sm">{`Note for the patient: ${patientNote}`}</Text>
          ) : null}
        </Stack>
      </CardBody>
    </Card>
  );
}

function AmountRow({
  label,
  amount,
  total,
}: {
  label: string;
  amount: string;
  total?: boolean;
}) {
  return (
    <Stack direction="horizontal" justify="between" align="center" gap="s4">
      <Text as="span" size="sm" weight={total ? 'bold' : undefined}>
        {label}
      </Text>
      <Text
        as="span"
        size="sm"
        font="mono"
        weight={total ? 'bold' : 'semibold'}
      >
        {amount}
      </Text>
    </Stack>
  );
}

export interface EstimateDraftProps {
  draft: AdmissionRequest['estimateDraft'];
  // Sends the estimate. Resolves false when the source refused, so the draft goes back to pending.
  onApprove: () => Promise<boolean>;
  onAdjust: () => void;
  busy: boolean;
}

// The AI-assembled estimate. The patient sees nothing until a person approves it.
export function EstimateDraftBlock({
  draft,
  onApprove,
  onAdjust,
  busy,
}: EstimateDraftProps) {
  const [status, setStatus] = useState<AiDraftStatus>('pending');
  return (
    <AiDraftBlock
      title={draft.title}
      status={status}
      onStatusChange={setStatus}
      verb="Approve estimate & send on WhatsApp"
      approvedVerb="Sent"
      undoable={false}
      busy={busy}
      onApprove={() => {
        void onApprove().then((ok) => {
          if (!ok) setStatus('pending');
        });
      }}
      actions={
        <Button variant="ghost" size="sm" onClick={onAdjust}>
          Adjust items
        </Button>
      }
      source={<AiSourceLine label="Read from">{draft.source}</AiSourceLine>}
    >
      <Text size="sm">{draft.body}</Text>
    </AiDraftBlock>
  );
}

export interface AdjustEstimateDialogProps {
  choices: EstimateChoices;
  onSave: (choices: EstimateChoices) => void;
  onClose: () => void;
}

export function AdjustEstimateDialog({
  choices,
  onSave,
  onClose,
}: AdjustEstimateDialogProps) {
  const [draft, setDraft] = useState(choices);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Adjust estimate items"
      description="Two items the AI flagged as different from the last 6 TKRs here. Change them and the total re-prices; the payer split is recalculated when the estimate is approved."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)}>Save items</Button>
        </>
      }
    >
      <Stack gap="s4">
        <Select
          label="Knee implant"
          value={draft.implant}
          onChange={(event) =>
            setDraft({
              ...draft,
              implant: event.target.value as EstimateChoices['implant'],
            })
          }
          options={(Object.keys(IMPLANTS) as EstimateChoices['implant'][]).map(
            (key) => ({ value: key, label: IMPLANTS[key].option }),
          )}
        />
        <Select
          label="Physiotherapy sessions"
          value={draft.physio}
          onChange={(event) =>
            setDraft({
              ...draft,
              physio: event.target.value as EstimateChoices['physio'],
            })
          }
          options={(Object.keys(PHYSIO) as EstimateChoices['physio'][]).map(
            (key) => ({ value: key, label: PHYSIO[key].option }),
          )}
        />
        <TextField
          label="Note for the patient"
          value={draft.note}
          onChange={(event) => setDraft({ ...draft, note: event.target.value })}
        />
      </Stack>
    </Dialog>
  );
}

export interface EstimateSectionProps {
  request: AdmissionRequest;
  payer: PayerOption;
  choices: EstimateChoices;
  busy: boolean;
  onApprove: () => Promise<boolean>;
  onAdjust: () => void;
}

// The estimate beside the AI draft that assembled it.
export function EstimateSection({
  request,
  payer,
  choices,
  busy,
  onApprove,
  onAdjust,
}: EstimateSectionProps) {
  const priced = priceEstimate(request.estimate.lines, choices);
  const changed =
    choices.implant !== ORIGINAL_CHOICES.implant ||
    choices.physio !== ORIGINAL_CHOICES.physio ||
    choices.note !== ORIGINAL_CHOICES.note;
  return (
    <SplitLayout
      ratio="1-1"
      primary={
        <EstimateCard
          payer={payer}
          lines={priced.lines}
          total={priced.total}
          note={request.estimate.note}
          patientNote={changed ? choices.note : undefined}
        />
      }
      secondary={
        <EstimateDraftBlock
          draft={request.estimateDraft}
          onApprove={onApprove}
          onAdjust={onAdjust}
          busy={busy}
        />
      }
    />
  );
}
