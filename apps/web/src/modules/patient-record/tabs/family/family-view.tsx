import { Grid, Stack } from '@hos/nova-ui';
import { usePatientRecordQuery } from '../../data';
import { PatientRecordTab } from '../../ui';
import { ConsentSection } from './consent-section';
import { DpdpSection } from './dpdp-section';
import { LinksSection } from './links-section';
import type { FamilyWidgetProps } from './types';

// Family and consent: who else may see her records through the patient app, what she has agreed to,
// and her rights under the DPDP Act. Access and consent are explicit: an invitation grants nothing
// until they confirm, and sharing through ABHA is the patient's alone to withdraw.
export function FamilyWidget({
  patientId,
  compactMode,
  readonly,
  className,
}: FamilyWidgetProps) {
  const { query, reload, update } = usePatientRecordQuery(
    (source, id) => source.getFamily(id),
    patientId,
  );
  const family = query.status === 'ready' ? query.data : undefined;

  return (
    <PatientRecordTab
      patientId={patientId}
      compactMode={compactMode}
      readonly={readonly}
      className={className}
      title="Family & Consent"
      description="Linked family accounts, what she has consented to, and her data rights."
      query={query}
      patient={family?.patient}
      errorMessage="Could not load family and consent."
      onRetry={reload}
    >
      {family ? (
        <Grid columns={3} gap="s6">
          <Stack gap="s6" className="min-w-0 md:col-span-2">
            <LinksSection
              links={family.links}
              patientId={family.patient.id}
              patientName={family.patient.name}
              readonly={readonly}
              onLinked={(link) =>
                update((data) => ({ ...data, links: [...data.links, link] }))
              }
            />
            <ConsentSection
              consents={family.consents}
              readonly={readonly}
              onChange={(consent) =>
                update((data) => ({
                  ...data,
                  consents: data.consents.map((c) =>
                    c.id === consent.id ? consent : c,
                  ),
                }))
              }
            />
          </Stack>
          <DpdpSection
            requests={family.requests}
            patientId={family.patient.id}
            patientName={family.patient.name}
            readonly={readonly}
            onRequested={(request) =>
              update((data) => ({
                ...data,
                requests: [...data.requests, request],
              }))
            }
          />
        </Grid>
      ) : null}
    </PatientRecordTab>
  );
}
