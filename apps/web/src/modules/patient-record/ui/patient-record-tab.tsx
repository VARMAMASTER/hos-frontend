import type { ReactNode } from 'react';
import {
  Button,
  EmptyState,
  TabContent,
  TabHeader,
  TabPage,
} from '@hos/nova-ui';
import type { ComposableWidgetProps } from '../../types';
import type { PatientHeader, PatientRecordQuery } from '../data';
import { PatientBanner } from './patient-banner';

export interface PatientRecordTabProps extends ComposableWidgetProps {
  title: string;
  description: string;
  actions?: ReactNode;
  query: PatientRecordQuery<unknown>;
  // The patient the loaded data belongs to; their header sits above the tab.
  patient?: PatientHeader;
  // What the error banner says when the tab's data cannot be loaded. Fixed words: the source's own
  // error never reaches the screen here, so nothing about a patient can leak through it.
  errorMessage: string;
  onRetry: () => void;
  // Shown instead of the content when the data loaded but there is nothing on it to show.
  empty?: ReactNode;
  // The tab's content, drawn once the data is ready.
  children?: ReactNode;
}

// The frame every Patient record tab shares: the TabPage, the patient header, the tab's own header
// (shown in every state, so the title stays put while the body loads), and the loading, error and
// empty states.
export function PatientRecordTab({
  patientId,
  compactMode,
  className,
  title,
  description,
  actions,
  query,
  patient,
  errorMessage,
  onRetry,
  empty,
  children,
}: PatientRecordTabProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      error={query.status === 'error' ? errorMessage : null}
    >
      {query.status === 'ready' && patient ? (
        <PatientBanner patient={patient} />
      ) : null}
      <TabHeader
        title={title}
        description={description}
        actions={query.status === 'ready' && !empty ? actions : undefined}
      />
      {query.status === 'loading' ? (
        <TabPage loading compactMode>
          {null}
        </TabPage>
      ) : null}
      {query.status === 'error' ? (
        <EmptyState
          title="Nothing to show yet"
          description="The patient record did not load. Nothing was changed."
          action={<Button onClick={onRetry}>Try again</Button>}
        />
      ) : null}
      {query.status === 'ready' ? (
        <TabContent>{empty ?? children}</TabContent>
      ) : null}
    </TabPage>
  );
}
