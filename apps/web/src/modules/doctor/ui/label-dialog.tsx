import { Dialog, Stack, Text } from '@hos/nova-ui';
import type { DoseReference } from '../data';

export interface LabelDialogProps {
  open: boolean;
  onClose: () => void;
  label: DoseReference['label'];
}

// The metformin label, quoted once and shown the same wherever it opens (the Prescription assistant
// and Lens 1 of Case Discussion): a reference the doctor is invited to check is worthless if two
// screens quote it differently. HOS quotes the band and the value; it does not compute a dose.
export function LabelDialog({ open, onClose, label }: LabelDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={label.title}>
      <Stack gap="s4">
        <Text size="sm" weight="semibold">
          Metformin hydrochloride — renal impairment, from the licensed
          prescribing information:
        </Text>
        <Stack as="ul" gap="s2" className="list-disc pl-s7">
          {label.bands.map((band) => (
            <li key={band.range}>
              <Text as="span" weight="semibold">
                {band.range}
              </Text>{' '}
              <Text as="span">{band.text}</Text>
            </li>
          ))}
        </Stack>
        <Text size="sm">{label.patientNote}</Text>
        <Text size="xs" tone="muted">
          {label.disclaimer}
        </Text>
      </Stack>
    </Dialog>
  );
}
