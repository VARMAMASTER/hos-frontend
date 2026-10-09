import { useState } from 'react';
import {
  AiClassChip,
  Banner,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stack,
  StatusDot,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  TextField,
} from '@hos/nova-ui';
import type { Feedback } from '../../ui';
import { LabelDialog, Prose, TierNote } from '../../ui';
import type { DoctorDataSource, OrdersOverview } from '../../data';

interface PrescriptionAssistantProps {
  orders: OrdersOverview;
  source: DoctorDataSource;
  feedback: Feedback;
}

// The prototype's "Prescription assistant" (03-doctor.html): everything around the prescribing that
// is lookup and printing, and nothing of the decision. The dose field for this patient stays empty:
// choosing a dose is a RED-tier action, so the field says so and the doctor types it.
export function PrescriptionAssistant({
  orders,
  source,
  feedback,
}: PrescriptionAssistantProps) {
  const { dose, printing } = orders;
  const [typed, setTyped] = useState('');
  const [labelOpen, setLabelOpen] = useState(false);
  const [telugu, setTelugu] = useState(true);

  async function recordDose() {
    const ok = await feedback.attempt(() =>
      source.recordDose(dose.drug, typed),
    );
    if (ok) {
      feedback.notify({
        title: `Dose recorded — ${typed.trim()}`,
        detail: 'Yours, typed by you, logged with your name.',
      });
    }
  }

  return (
    <Card role="region" aria-label="Prescription assistant">
      <CardHeader
        title={
          <>
            <Text as="span" aria-hidden="true">
              ✦
            </Text>{' '}
            Prescription assistant — {orders.patient.name}
          </>
        }
        description="Formulary, generics, her allergies, and Telugu printing. The prescribing is yours."
        actions={
          <>
            <AiClassChip tier="green" detail="lookup & printing" />
            <AiClassChip tier="amber" detail="allergy & label alerts" />
          </>
        }
      />
      <CardBody>
        <Stack gap="s6">
          <Banner tone="warn" title="Check the allergies before you write">
            <Prose text={orders.allergyBanner} />
          </Banner>

          <Stack gap="s3">
            <Heading level="h3" size="caption" tone="muted">
              Formulary &amp; generic equivalents · what 30 days costs her
            </Heading>
            <Table
              caption="Formulary and generic equivalents"
              density="compact"
            >
              <TableHead>
                <TableRow>
                  <TableHeaderCell numeric>30 days costs her</TableHeaderCell>
                  <TableHeaderCell>Drug</TableHeaderCell>
                  <TableHeaderCell numeric>Brand ₹/unit</TableHeaderCell>
                  <TableHeaderCell numeric>Generic ₹/unit</TableHeaderCell>
                  <TableHeaderCell>Stock here</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.formulary.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell numeric>
                      <Text as="span" weight="bold">
                        {row.cost}
                      </Text>
                      <Text size="xs" tone="muted">
                        {row.costNote}
                      </Text>
                    </TableCell>
                    <TableCell>
                      {row.drug}{' '}
                      <Text
                        as="span"
                        size="xs"
                        tone={row.tag.tone === 'ai' ? 'default' : 'muted'}
                      >
                        {row.tag.tone === 'ai' ? '✦ ' : ''}
                        {row.tag.text}
                      </Text>
                    </TableCell>
                    <TableCell numeric>{row.brand}</TableCell>
                    <TableCell numeric>{row.generic}</TableCell>
                    <TableCell>
                      <StatusDot tone={row.stock.tone} label={row.stock.text} />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell numeric>
                    <Text as="span" weight="bold">
                      {orders.formularyTotal.cost}
                    </Text>
                    <Text size="xs" tone="muted">
                      {orders.formularyTotal.costNote}
                    </Text>
                  </TableCell>
                  <TableCell colSpan={4}>
                    <Box className="text-caption text-ink-2">
                      <Prose text={orders.formularyTotal.note} />
                    </Box>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Stack>

          <Stack gap="s3">
            <Heading level="h3" size="caption" tone="muted">
              Dose — the label&apos;s numbers, and an empty field
            </Heading>
            <Stack direction="horizontal" align="end" gap="s4" wrap>
              <TextField
                label={`${dose.drug} daily dose`}
                placeholder="type the dose"
                autoComplete="off"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => void recordDose()}
              >
                Record the dose
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setLabelOpen(true)}
              >
                Show the label&apos;s renal bands
              </Button>
              <AiClassChip
                tier="red"
                detail="dose recommendation"
                reason="A dose chosen for a named patient is a RED-tier action under the CDSCO SaMD framework. HOS is not licensed for it, so it is not built: this field stays empty and the dose is yours."
              />
            </Stack>
            <Text size="xs" tone="muted">
              Formulary defaults for this molecule: {dose.defaults}. Renal bands
              in the licensed label: {dose.bands}.
            </Text>
            <Prose text={dose.note} />
          </Stack>

          <Stack gap="s3">
            <Heading level="h3" size="caption" tone="muted">
              Vernacular printing
            </Heading>
            <Switch
              label={`Print dosage instructions in Telugu · ${printing.teluguShare}`}
              checked={telugu}
              onCheckedChange={(on) => {
                setTelugu(on);
                feedback.notify(
                  on
                    ? {
                        title: 'Telugu instructions on',
                        detail:
                          'Printed above the English line, in your spoken register.',
                      }
                    : {
                        tone: 'info',
                        title: 'Telugu instructions off',
                        detail:
                          'English only — she signs in Telugu, so this is worth a second thought.',
                      },
                );
              }}
            />
            {printing.phrases.map((phrase) => (
              <Stack
                key={phrase.id}
                gap="s1"
                className="border-l-emphasis border-ai-line pl-s5"
              >
                {telugu ? <Text lang="te">{phrase.local}</Text> : null}
                <Text size="sm" tone="muted" lang="en">
                  {phrase.en}
                </Text>
              </Stack>
            ))}
            <Stack direction="horizontal" gap="s3" wrap>
              <Button
                size="sm"
                onClick={async () => {
                  const ok = await feedback.attempt(() => source.queuePrint());
                  if (ok) {
                    feedback.notify({
                      title: 'Prescription queued for print — Telugu + English',
                      detail:
                        'The same two-language sheet the pharmacy counter hands her.',
                    });
                  }
                }}
              >
                Print Telugu + English sheet
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const ok = await feedback.attempt(() =>
                    source.prepareVoiceNote(),
                  );
                  if (ok) {
                    feedback.notify({
                      tone: 'info',
                      title: 'Voice note prepared as a draft',
                      detail:
                        'It goes with the WhatsApp prescription only after you approve it in the Consultation tab.',
                    });
                  }
                }}
              >
                Prepare a voice note
              </Button>
            </Stack>
          </Stack>

          <TierNote text={orders.sourcesNote} />
        </Stack>
      </CardBody>

      <LabelDialog
        open={labelOpen}
        onClose={() => setLabelOpen(false)}
        label={dose.label}
      />
    </Card>
  );
}
