import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  Banner,
  Button,
  Dialog,
  Select,
  Stack,
  Text,
  TextField,
} from '@hos/nova-ui';
import type { LinkInvite } from '../../data';

export interface LinkDialogProps {
  open: boolean;
  patientName: string;
  // Whether an invite is being sent, and what went wrong with the last one.
  busy: boolean;
  error: string | null;
  onClose: () => void;
  // Called with a valid invite; the dialog stays open until the caller closes it.
  onSend: (invite: LinkInvite) => void;
}

const RELATIONS = [
  'Spouse',
  'Son',
  'Daughter',
  'Parent',
  'Sibling',
  'Son-in-law',
  'Daughter-in-law',
  'Other family',
].map((value) => ({ value, label: value }));

interface Errors {
  name?: string;
  phone?: string;
}

function validate(invite: LinkInvite): Errors {
  const errors: Errors = {};
  if (!invite.name.trim()) errors.name = 'Enter their name.';
  const digits = invite.phone.replace(/\D/g, '');
  if (!invite.phone.trim()) errors.phone = 'Enter a phone number.';
  else if (digits.length < 10) {
    errors.phone = 'Enter a phone number with at least 10 digits.';
  }
  return errors;
}

// The invite to link a family member (the prototype's "Link family member"): a secure link request
// they confirm with their own consent before any access is granted.
export function LinkDialog({
  open,
  patientName,
  busy,
  error,
  onClose,
  onSend,
}: LinkDialogProps) {
  const formId = useId();
  const [invite, setInvite] = useState<LinkInvite>({
    name: '',
    relation: RELATIONS[0].value,
    phone: '',
  });
  const [errors, setErrors] = useState<Errors>({});

  // A closed dialog forgets what was typed, so the next invite starts empty.
  useEffect(() => {
    if (open) return;
    setInvite({ name: '', relation: RELATIONS[0].value, phone: '' });
    setErrors({});
  }, [open]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate(invite);
    setErrors(found);
    if (Object.keys(found).length === 0) onSend(invite);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Link family member"
      description={`Send a secure link request so a family member can view ${patientName}’s OPD summaries, lab reports & bills via the HOS patient app.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={busy}>
            Send invite
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate>
        <Stack gap="s4">
          {error ? (
            <Banner tone="crit" title="That did not go through">
              {error}
            </Banner>
          ) : null}
          <Text size="sm" tone="muted">
            They’ll receive an SMS & WhatsApp invite to confirm consent before
            access is granted.
          </Text>
          <TextField
            label="Name"
            required
            autoComplete="off"
            value={invite.name}
            error={errors.name}
            onChange={(event) =>
              setInvite({ ...invite, name: event.target.value })
            }
          />
          <Select
            label="Relationship"
            options={RELATIONS}
            value={invite.relation}
            onChange={(event) =>
              setInvite({ ...invite, relation: event.target.value })
            }
          />
          <TextField
            label="Phone number"
            required
            type="tel"
            autoComplete="off"
            inputMode="tel"
            value={invite.phone}
            error={errors.phone}
            onChange={(event) =>
              setInvite({ ...invite, phone: event.target.value })
            }
          />
        </Stack>
      </form>
    </Dialog>
  );
}
