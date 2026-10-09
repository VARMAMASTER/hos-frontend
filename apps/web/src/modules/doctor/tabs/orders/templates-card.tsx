import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Dialog,
  Grid,
  Heading,
  Select,
  Stack,
  Text,
  TextField,
} from '@hos/nova-ui';
import type { OrderTemplate } from '../../data';

const SPECIALTIES = [
  { value: 'General Medicine', label: 'General Medicine' },
  { value: 'Endocrinology', label: 'Endocrinology' },
  { value: 'Cardiology', label: 'Cardiology' },
];

interface TemplatesCardProps {
  templates: OrderTemplate[];
  onUse: (template: OrderTemplate) => void;
  // Saves the current order as a template; resolves whether it was saved.
  onSave: (name: string, specialty: string) => Promise<boolean>;
}

// The prototype's "Saved templates": disease-specific order bundles. A template ticks its items; the
// Rx dose fields stay blank, because a dose is typed for the patient in front of the doctor.
export function TemplatesCard({
  templates,
  onUse,
  onSave,
}: TemplatesCardProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState(SPECIALTIES[0].value);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    setCreating(false);
    setName('');
    setError(null);
  }

  async function save() {
    if (name.trim() === '') {
      setError('Give the template a name.');
      return;
    }
    setBusy(true);
    const saved = await onSave(name.trim(), specialty);
    setBusy(false);
    if (saved) close();
  }

  return (
    <Card role="region" aria-label="Saved templates">
      <CardHeader
        title="Saved templates"
        description="Disease-specific order + Rx bundles"
        actions={
          <Button size="sm" variant="ghost" onClick={() => setCreating(true)}>
            ＋ New template
          </Button>
        }
      />
      <CardBody>
        <Grid columns={2} gap="s4">
          {templates.map((template) => (
            <Box
              key={template.id}
              border
              radius="card"
              padding="s4"
              surface="elevated"
            >
              <Stack gap="s3" className="h-full">
                <Heading level="h3" size="subhead" weight="semibold">
                  {template.name}
                </Heading>
                <Stack gap="s1">
                  <Text size="xs" tone="muted">
                    Labs: {template.labs}
                  </Text>
                  <Text size="xs" tone="muted">
                    Rx lines: {template.rx}
                    {template.doseNote ? ` — ${template.doseNote}` : ''}
                  </Text>
                  <Text size="xs" tone="muted">
                    Used {template.uses} times
                  </Text>
                </Stack>
                <Stack
                  direction="horizontal"
                  align="center"
                  justify="between"
                  gap="s3"
                  className="mt-auto"
                >
                  <Chip>{template.specialty}</Chip>
                  <Button
                    size="sm"
                    aria-label={`Use template — ${template.name}`}
                    onClick={() => onUse(template)}
                  >
                    Use template
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Grid>
      </CardBody>
      <Dialog
        open={creating}
        onClose={close}
        title="New template"
        description="Build a reusable order bundle from the items ticked now. Give it a name and pick a specialty to save it to your template library."
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => void save()}>
              Save template
            </Button>
          </>
        }
      >
        <Stack gap="s4">
          <TextField
            label="Template name"
            value={name}
            error={error ?? undefined}
            onChange={(event) => {
              setName(event.target.value);
              if (event.target.value.trim() !== '') setError(null);
            }}
          />
          <Select
            label="Specialty"
            value={specialty}
            options={SPECIALTIES}
            onChange={(event) => setSpecialty(event.target.value)}
          />
        </Stack>
      </Dialog>
    </Card>
  );
}
