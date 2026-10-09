import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  EmptyState,
  SplitLayout,
  Stack,
  Text,
} from '@hos/nova-ui';
import {
  useReceptionAction,
  useReceptionQuery,
  type RegistrationDraft,
  type RegistrationOverview,
  type ReceptionDataSource,
} from '../../data';
import { ActionFeedback, ReceptionTab, type ActionNotice } from '../../ui';
import { AbhaCard } from './abha-card';
import { QuickRegister, type QuickRegisterValues } from './quick-register';
import type { RegistrationWidgetProps } from './types';

// The prototype's Registration (02-reception.html, data-panel="registration"): ABHA linking with
// explicit consent, the 30-second quick-register form (checked against the master patient index) and
// today's registrations.
export function RegistrationWidget({
  patientId,
  compactMode,
  className,
}: RegistrationWidgetProps) {
  const { query, source, reload, update } = useReceptionQuery((s) =>
    s.getRegistration(),
  );
  return (
    <ReceptionTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Registration"
      description="Link ABHA with consent, register a patient in 30 seconds, and see who registered today."
      query={query}
      errorMessage="Could not load registration."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        <RegistrationDesk
          overview={query.data}
          source={source}
          onChange={update}
        />
      ) : null}
    </ReceptionTab>
  );
}

interface RegistrationDeskProps {
  overview: RegistrationOverview;
  source: ReceptionDataSource;
  onChange: (
    change: (overview: RegistrationOverview) => RegistrationOverview,
  ) => void;
}

const BLANK: QuickRegisterValues = { phone: '', name: '', ageSex: '' };

function RegistrationDesk({
  overview,
  source,
  onChange,
}: RegistrationDeskProps) {
  const register = useReceptionAction();
  const abhaAction = useReceptionAction();
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [values, setValues] = useState<QuickRegisterValues>(BLANK);
  const [consent, setConsent] = useState(false);
  const [profile, setProfile] = useState<Awaited<
    ReturnType<ReceptionDataSource['fetchAbhaProfile']>
  > | null>(null);

  async function fetchProfile(abha: string) {
    setNotice(null);
    const fetched = await abhaAction.run(() =>
      source.fetchAbhaProfile(abha, consent),
    );
    if (!fetched) return;
    setProfile(fetched);
    setValues({
      phone: fetched.phone,
      name: fetched.name,
      ageSex: fetched.ageSex,
    });
    setNotice({
      title: 'ABHA linked — consent on file',
      detail: `${fetched.name} · ${fetched.records.length} prior records found. The form is filled in; check it, then register.`,
    });
  }

  async function registerPatient(draft: RegistrationDraft): Promise<boolean> {
    setNotice(null);
    const registered = await register.run(() => source.registerPatient(draft));
    if (!registered) return false;
    onChange((current) => ({
      ...current,
      recent: [registered, ...current.recent],
    }));
    setValues(BLANK);
    setProfile(null);
    setConsent(false);
    setNotice({
      title: `Patient registered — token ${registered.token}`,
      detail: `${registered.name} · ${registered.department}${
        registered.abhaLinked ? ' · ABHA linked' : ''
      }`,
    });
    return true;
  }

  return (
    <Stack gap="s6">
      <ActionFeedback
        notice={notice}
        error={register.error ?? abhaAction.error}
        onDismissNotice={() => setNotice(null)}
        onDismissError={() => {
          register.clearError();
          abhaAction.clearError();
        }}
      />
      <AbhaCard
        consent={consent}
        onConsentChange={setConsent}
        profile={profile}
        busy={abhaAction.busy}
        onFetch={(abha) => void fetchProfile(abha)}
      />
      <SplitLayout
        ratio="2-1"
        primary={
          <QuickRegister
            source={source}
            departments={overview.departments}
            values={values}
            onValuesChange={setValues}
            linkedAbha={profile && consent ? profile.abha : null}
            busy={register.busy}
            onRegister={registerPatient}
          />
        }
        secondary={<RecentlyRegistered recent={overview.recent} />}
      />
    </Stack>
  );
}

function RecentlyRegistered({
  recent,
}: {
  recent: RegistrationOverview['recent'];
}) {
  return (
    <Card>
      <CardHeader
        title="Recently registered"
        actions={
          <Text as="span" size="xs" tone="muted">
            Today
          </Text>
        }
      />
      <CardBody>
        {recent.length === 0 ? (
          <EmptyState
            title="No one registered yet today"
            description="Patients you register appear here, newest first."
          />
        ) : (
          <Stack as="ul" gap="s3" aria-label="Recently registered">
            {recent.map((item) => (
              <li key={item.id}>
                <Stack
                  direction="horizontal"
                  align="center"
                  justify="between"
                  gap="s3"
                >
                  <Stack gap="none">
                    <Text as="span" weight="semibold">
                      {item.name}
                    </Text>
                    <Text as="span" size="sm" tone="muted">
                      {`${item.ageSex} · ${item.department} · ${item.at}`}
                    </Text>
                  </Stack>
                  <Chip tone="neutral">{item.token}</Chip>
                </Stack>
              </li>
            ))}
          </Stack>
        )}
      </CardBody>
    </Card>
  );
}
