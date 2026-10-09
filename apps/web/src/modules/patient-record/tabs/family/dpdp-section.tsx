import { useState } from 'react';
import { Button, Stack, Text, Textarea } from '@hos/nova-ui';
import type { DpdpKind, DpdpRequest } from '../../data';
import { usePatientRecord, usePatientRecordAction } from '../../data';
import {
  ActionFeedback,
  FlagGlyph,
  Section,
  type ActionNotice,
} from '../../ui';

export interface DpdpSectionProps {
  requests: DpdpRequest[];
  patientId: string;
  patientName: string;
  readonly?: boolean;
  onRequested: (request: DpdpRequest) => void;
}

const VERB: Record<DpdpKind, string> = {
  export: 'Data export requested',
  correction: 'Correction request logged',
};

// The DPDP data request tool: under the Digital Personal Data Protection Act she can ask for an
// export of her health records, or a correction to inaccurate data. A request is logged with a
// reference and a due date; nothing is exported or changed here.
export function DpdpSection({
  requests,
  patientId,
  patientName,
  readonly = false,
  onRequested,
}: DpdpSectionProps) {
  const source = usePatientRecord();
  const action = usePatientRecordAction();
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  async function request(kind: DpdpKind) {
    setNotice(null);
    const logged = await action.run(() =>
      source.requestDpdp(kind, note, patientId),
    );
    if (!logged) return;
    onRequested(logged);
    setNote('');
    setNotice({
      title: 'Request logged — fulfilled within 7 days',
      detail: `${kind === 'export' ? 'Data export' : 'Correction request'} · ref ${logged.ref}`,
    });
  }

  return (
    <Section
      title="DPDP data request"
      description="Patient rights"
      footnote="Patient-initiated requests are logged and fulfilled within 7 days."
    >
      <Stack gap="s5">
        <Text size="sm" tone="muted">
          {`Under the Digital Personal Data Protection Act, ${patientName} can request an export of her health records held by this hospital, or request a correction to inaccurate data.`}
        </Text>
        <ActionFeedback
          notice={notice}
          error={action.error}
          onDismissNotice={() => setNotice(null)}
          onDismissError={action.clearError}
        />
        {readonly ? null : (
          <>
            <Textarea
              label="Note (optional)"
              rows={2}
              placeholder="e.g. Please correct date of birth on file to 22 Aug 1967"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <Stack direction="horizontal" wrap gap="s2">
              <Button
                size="sm"
                disabled={action.busy}
                onClick={() => void request('export')}
              >
                Request my data export
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={action.busy}
                onClick={() => void request('correction')}
              >
                Request correction
              </Button>
            </Stack>
          </>
        )}
        {requests.length === 0 ? (
          <Text size="sm" tone="muted">
            No pending requests on file. Last export: none requested yet.
          </Text>
        ) : (
          <Stack as="ul" gap="s3">
            {requests.map((item) => (
              <li key={item.id}>
                <Stack gap="s1">
                  <Text size="sm">
                    <FlagGlyph
                      tone="good"
                      className="mr-s1 inline size-icon-xs align-text-bottom text-good-deep"
                    />
                    {`${VERB[item.kind]} ${item.requestedOn} · ref ${item.ref} · status: ${item.status} — due ${item.dueOn}.`}
                  </Text>
                  {item.note ? (
                    <Text size="sm" tone="muted">
                      {item.note}
                    </Text>
                  ) : null}
                </Stack>
              </li>
            ))}
          </Stack>
        )}
      </Stack>
    </Section>
  );
}
