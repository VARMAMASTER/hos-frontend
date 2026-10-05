import { useState, type FormEvent } from 'react';
import { Banner } from '../components/banner/banner';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Checkbox } from '../components/checkbox/checkbox';
import { Dialog } from '../components/dialog/dialog';
import { Menu, MenuItem } from '../components/menu/menu';
import { Radio } from '../components/radio/radio';
import { Select } from '../components/select/select';
import { Switch } from '../components/switch/switch';
import { TextField } from '../components/text-field/text-field';
import { Textarea } from '../components/textarea/textarea';
import { Tooltip } from '../components/tooltip/tooltip';

const WARDS = [
  { value: 'general', label: 'General ward' },
  { value: 'icu', label: 'Intensive care' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'isolation', label: 'Isolation (no free beds)', disabled: true },
];

interface Draft {
  name: string;
  mrn: string;
  phone: string;
  ward: string;
  sex: string;
  complaint: string;
  consent: boolean;
  sms: boolean;
}

// The mobile number is short and the ward is empty, so the story opens showing real error states.
const INITIAL: Draft = {
  name: 'Ramesh',
  mrn: '',
  phone: '98765',
  ward: '',
  sex: 'm',
  complaint: '',
  consent: false,
  sms: true,
};

type Errors = Partial<Record<'name' | 'phone' | 'ward', string>>;

function validate(draft: Draft): Errors {
  const errors: Errors = {};
  if (!draft.name.trim()) errors.name = 'Enter the patient name';
  if (!/^\d{10}$/.test(draft.phone)) {
    errors.phone = 'Enter a 10-digit mobile number';
  }
  if (!draft.ward) errors.ward = 'Choose a ward before admitting';
  return errors;
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="6" y="2.5" width="8" height="15" rx="2" />
      <path d="M9 14.5h2" />
    </svg>
  );
}

export function AdmissionForm() {
  const [draft, setDraft] = useState(INITIAL);
  const [attempted, setAttempted] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [admitted, setAdmitted] = useState(false);
  const [allergyDismissed, setAllergyDismissed] = useState(false);

  const errors = attempted ? validate(draft) : {};
  const errorCount = Object.keys(errors).length;

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setAdmitted(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(validate(draft)).length === 0) setConfirmOpen(true);
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader
        title="Admit patient"
        description="Fields marked * are required."
        actions={
          <>
            <Tooltip content="Saved to this device every 30 seconds">
              <Button size="sm" variant="ghost">
                Draft saved
              </Button>
            </Tooltip>
            <Menu
              trigger={
                <Button size="sm" variant="secondary">
                  More
                </Button>
              }
              open={menuOpen}
              onOpenChange={setMenuOpen}
            >
              <MenuItem onClick={() => setDraft(INITIAL)}>
                Reset the form
              </MenuItem>
              <MenuItem>Print wristband</MenuItem>
              <MenuItem disabled>Transfer in (needs sign-off)</MenuItem>
            </Menu>
          </>
        }
      />
      <CardBody>
        <form noValidate onSubmit={submit} className="flex flex-col gap-5">
          {admitted ? (
            <Banner
              tone="good"
              title="Patient admitted"
              onDismiss={() => setAdmitted(false)}
            />
          ) : null}
          {errorCount > 0 ? (
            <Banner
              tone="crit"
              title={`${errorCount} ${errorCount === 1 ? 'field needs' : 'fields need'} attention`}
            >
              Fix the highlighted fields, then admit again.
            </Banner>
          ) : null}
          {allergyDismissed ? null : (
            <Banner
              tone="warn"
              title="Penicillin allergy on file"
              action={
                <Button size="sm" variant="secondary">
                  Review
                </Button>
              }
              onDismiss={() => setAllergyDismissed(true)}
              dismissLabel="Dismiss allergy notice"
            >
              Documented at the last visit.
            </Banner>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Patient name"
              required
              autoComplete="off"
              value={draft.name}
              onChange={(event) => set('name', event.target.value)}
              error={errors.name}
            />
            <TextField
              label="MRN"
              hint="Printed on the wristband"
              autoComplete="off"
              value={draft.mrn}
              onChange={(event) => set('mrn', event.target.value)}
            />
            <TextField
              label="Mobile number"
              type="tel"
              inputMode="numeric"
              required
              leadingIcon={<PhoneIcon />}
              value={draft.phone}
              onChange={(event) => set('phone', event.target.value)}
              error={errors.phone}
            />
            <Select
              label="Ward"
              required
              placeholder="Choose a ward"
              options={WARDS}
              value={draft.ward}
              onChange={(event) => set('ward', event.target.value)}
              error={errors.ward}
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-ink">Sex</legend>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
              {[
                ['f', 'Female'],
                ['m', 'Male'],
                ['o', 'Other'],
              ].map(([value, label]) => (
                <Radio
                  key={value}
                  name="sex"
                  value={value}
                  label={label ?? value}
                  checked={draft.sex === value}
                  onChange={() => set('sex', value ?? '')}
                />
              ))}
            </div>
          </fieldset>

          <Textarea
            label="Presenting complaint"
            rows={3}
            hint="Onset, duration and anything that changes it"
            value={draft.complaint}
            onChange={(event) => set('complaint', event.target.value)}
          />

          <div className="flex flex-col gap-3">
            <Checkbox
              label="The patient has consented to treatment"
              required
              checked={draft.consent}
              onChange={(event) => set('consent', event.target.checked)}
            />
            <Switch
              label="Send SMS reminders"
              checked={draft.sms}
              onCheckedChange={(on) => set('sms', on)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDraft(INITIAL)}>
              Cancel
            </Button>
            <Button type="submit">Admit patient</Button>
          </div>
        </form>
      </CardBody>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Admit this patient?"
        description={`${draft.name} will be admitted to ${
          WARDS.find((ward) => ward.value === draft.ward)?.label ?? 'a ward'
        }.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Go back
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                setAdmitted(true);
              }}
            >
              Admit
            </Button>
          </>
        }
      />
    </Card>
  );
}
