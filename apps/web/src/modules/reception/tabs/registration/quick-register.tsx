import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Grid,
  Select,
  Stack,
  Text,
  TextField,
} from '@hos/nova-ui';
import type {
  Department,
  PhoneLookup,
  RegistrationDraft,
  ReceptionDataSource,
} from '../../data';

export interface QuickRegisterValues {
  phone: string;
  name: string;
  ageSex: string;
}

export interface QuickRegisterProps {
  source: ReceptionDataSource;
  departments: Department[];
  // Filled by a consented ABHA fetch.
  values: QuickRegisterValues;
  onValuesChange: (values: QuickRegisterValues) => void;
  // The ABHA number to link: set only when the patient opted in and it was fetched.
  linkedAbha: string | null;
  busy: boolean;
  // Resolves true once registered, so the form clears.
  onRegister: (draft: RegistrationDraft) => Promise<boolean>;
}

interface Errors {
  phone?: string;
  name?: string;
  ageSex?: string;
}

const AGE_SEX = /^\d{1,3}\s*\/\s*[MF]$/i;

function digitsOf(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
}

// The prototype's Quick register: phone, name, age / sex and department, checked against the master
// patient index as the number is typed so the same person never gets two records.
export function QuickRegister({
  source,
  departments,
  values,
  onValuesChange,
  linkedAbha,
  busy,
  onRegister,
}: QuickRegisterProps) {
  const [department, setDepartment] = useState<Department>(
    departments[0] ?? 'General Medicine',
  );
  const [errors, setErrors] = useState<Errors>({});
  const [lookup, setLookup] = useState<PhoneLookup | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const digits = digitsOf(values.phone);

  useEffect(() => {
    if (digits.length !== 10) {
      setLookup(null);
      return undefined;
    }
    let active = true;
    source.lookupPhone(digits).then(
      (result) => {
        if (active) setLookup(result);
      },
      () => {
        if (active) setLookup(null);
      },
    );
    return () => {
      active = false;
    };
  }, [digits, source]);

  function set(field: keyof QuickRegisterValues, value: string) {
    onValuesChange({ ...values, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (digits.length !== 10) next.phone = 'Enter a 10-digit mobile number.';
    if (!values.name.trim()) next.name = "Enter the patient's full name.";
    if (!AGE_SEX.test(values.ageSex.trim())) {
      next.ageSex = 'Enter age and sex, like 44 / M.';
    }
    setErrors(next);
    const first = next.phone
      ? phoneRef.current
      : next.name
        ? nameRef.current
        : next.ageSex
          ? ageRef.current
          : null;
    if (first) {
      first.focus();
      return;
    }
    const registered = await onRegister({
      phone: values.phone,
      name: values.name,
      ageSex: values.ageSex,
      department,
      abhaNumber: linkedAbha ?? '',
      abhaConsent: linkedAbha !== null,
    });
    if (registered) setErrors({});
  }

  return (
    <Card>
      <CardHeader
        title="Quick register"
        actions={
          <Chip tone="good" icon="⚡">
            30-second flow
          </Chip>
        }
      />
      <CardBody>
        <form aria-label="Quick register" noValidate onSubmit={submit}>
          <Stack gap="s4">
            <Grid columns={4} gap="s3">
              <TextField
                ref={phoneRef}
                label="Phone number"
                placeholder="+91 98765 43210"
                inputMode="tel"
                autoComplete="off"
                required
                value={values.phone}
                error={errors.phone}
                onChange={(event) => set('phone', event.target.value)}
              />
              <TextField
                ref={nameRef}
                label="Full name"
                placeholder="Patient name"
                autoComplete="off"
                required
                value={values.name}
                error={errors.name}
                onChange={(event) => set('name', event.target.value)}
              />
              <TextField
                ref={ageRef}
                label="Age / Sex"
                placeholder="e.g. 44 / M"
                autoComplete="off"
                required
                value={values.ageSex}
                error={errors.ageSex}
                onChange={(event) => set('ageSex', event.target.value)}
              />
              <Select
                label="Department"
                value={department}
                onChange={(event) =>
                  setDepartment(event.target.value as Department)
                }
                options={departments.map((item) => ({
                  value: item,
                  label: item,
                }))}
              />
            </Grid>
            <Text size="sm" tone="muted">
              {linkedAbha
                ? `ABHA ${linkedAbha} will be linked — the patient opted in.`
                : 'ABHA not linked — only with the patient’s consent, above.'}
            </Text>
            <Stack direction="horizontal" align="center" gap="s4" wrap>
              <Button type="submit" loading={busy}>
                Register — 30 sec
              </Button>
              <Text as="span" size="sm" tone="muted">
                HOS checks the master patient index before it creates a new MRN.
              </Text>
            </Stack>
            <PhoneLookupPanel digits={digits} lookup={lookup} />
          </Stack>
        </form>
      </CardBody>
    </Card>
  );
}

function PhoneLookupPanel({
  digits,
  lookup,
}: {
  digits: string;
  lookup: PhoneLookup | null;
}) {
  let content = (
    <Text size="sm" tone="muted">
      Type a phone number — HOS checks the master patient index before it
      creates a new MRN, so the same person never gets two records.
    </Text>
  );
  if (digits.length === 10 && lookup?.kind === 'existing') {
    content = (
      <Text size="sm">
        {`Existing record on ${lookup.phone}: `}
        <Text as="span" weight="semibold">
          {lookup.name}
        </Text>
        {` · ${lookup.meta} · ABHA ${lookup.abha} · ${lookup.lastVisit}`}
      </Text>
    );
  } else if (digits.length === 10 && lookup?.kind === 'new') {
    content = (
      <Text size="sm">
        {`No existing record on ${lookup.phone} — `}
        <Text as="span" weight="semibold">
          new MRN will be created
        </Text>
        {` · checked against ${lookup.checkedAgainst}`}
      </Text>
    );
  }
  return (
    <Box
      role="status"
      aria-label="Phone lookup"
      border
      radius="card"
      padding="s3"
    >
      {content}
    </Box>
  );
}
