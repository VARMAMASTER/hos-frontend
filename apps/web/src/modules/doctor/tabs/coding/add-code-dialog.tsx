import { useState } from 'react';
import { Button, Dialog, Stack, TextField } from '@hos/nova-ui';

// An ICD-10 code: a letter, two digits, and up to four more after a dot (E11.65, I10, N18.30).
const ICD10 = /^[A-Za-z]\d{2}(\.\d{1,4})?$/;

interface AddCodeDialogProps {
  open: boolean;
  onClose: () => void;
  // Adds the code; resolves whether the source accepted it.
  onAdd: (code: string, term: string) => Promise<boolean>;
}

// The prototype's "Add a code by hand". Anything the doctor adds is a stronger signal than anything
// the model proposed: codes added that HOS missed are the first thing its next evaluation is tested
// against.
export function AddCodeDialog({ open, onClose, onAdd }: AddCodeDialogProps) {
  const [code, setCode] = useState('');
  const [term, setTerm] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [termError, setTermError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    setCode('');
    setTerm('');
    setCodeError(null);
    setTermError(null);
    onClose();
  }

  async function add() {
    const badCode = ICD10.test(code.trim())
      ? null
      : 'Enter an ICD-10 code like E11.65.';
    const badTerm = term.trim() === '' ? 'Enter the term for the code.' : null;
    setCodeError(badCode);
    setTermError(badTerm);
    if (badCode || badTerm) return;
    setBusy(true);
    const added = await onAdd(code.trim().toUpperCase(), term.trim());
    setBusy(false);
    if (added) close();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add a code by hand"
      description="Search ICD-10 by term or code. Anything you add by hand is a stronger signal than anything the model proposed — codes you add that HOS missed are the first thing its next evaluation run is tested against."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button loading={busy} onClick={() => void add()}>
            Add the code
          </Button>
        </>
      }
    >
      <Stack gap="s4">
        <TextField
          label="ICD-10 code"
          value={code}
          error={codeError ?? undefined}
          onChange={(event) => setCode(event.target.value)}
        />
        <TextField
          label="Term"
          value={term}
          error={termError ?? undefined}
          onChange={(event) => setTerm(event.target.value)}
        />
      </Stack>
    </Dialog>
  );
}
