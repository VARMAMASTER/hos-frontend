import { useState } from 'react';
import { Stack } from '@hos/nova-ui';
import {
  usePatientRecordQuery,
  type DocumentsOverview,
  type PatientDocument,
} from '../../data';
import { PatientRecordTab } from '../../ui';
import { FilesSection } from './files-section';
import { OutsideReport } from './outside-report';
import type { DocumentsWidgetProps } from './types';

interface DocumentsBodyProps {
  overview: DocumentsOverview;
  readonly?: boolean;
}

// The loaded tab. The list it shows starts as what the source holds and follows this session's
// filings and withdrawals, so a report filed (or taken back) is reflected at once.
function DocumentsBody({ overview, readonly = false }: DocumentsBodyProps) {
  const [files, setFiles] = useState<PatientDocument[]>(overview.files);
  return (
    <Stack gap="s6">
      <OutsideReport
        patient={overview.patient}
        uploadLimits={overview.uploadLimits}
        readonly={readonly}
        onFiled={(receipt) =>
          setFiles((current) => [receipt.document, ...current])
        }
        onWithdrawn={(documentId) =>
          setFiles((current) => current.filter((f) => f.id !== documentId))
        }
      />
      <FilesSection files={files} />
    </Stack>
  );
}

// The documents tab: the files on record, and the way an outside paper report becomes values in the
// chart. A printout or phone photo from another clinic is read for its values, which are proposed and
// never filed until a person approves exactly what they ticked.
export function DocumentsWidget({
  patientId,
  compactMode,
  readonly,
  className,
}: DocumentsWidgetProps) {
  const { query, reload } = usePatientRecordQuery(
    (source, id) => source.getDocuments(id),
    patientId,
  );
  const overview = query.status === 'ready' ? query.data : undefined;

  return (
    <PatientRecordTab
      patientId={patientId}
      compactMode={compactMode}
      readonly={readonly}
      className={className}
      title="Documents"
      description="Files on record, and outside paper reports read for their values."
      query={query}
      patient={overview?.patient}
      errorMessage="Could not load the documents."
      onRetry={reload}
    >
      {overview ? (
        <DocumentsBody overview={overview} readonly={readonly} />
      ) : null}
    </PatientRecordTab>
  );
}
