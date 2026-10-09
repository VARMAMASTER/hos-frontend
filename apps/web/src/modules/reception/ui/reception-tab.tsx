import type { ReactNode } from 'react';
import {
  Box,
  Button,
  EmptyState,
  KpiTile,
  TabContent,
  TabHeader,
  TabKPIStrip,
  TabPage,
} from '@hos/nova-ui';
import type { ComposableWidgetProps } from '../../types';
import type { ReceptionKpi, ReceptionQuery } from '../data';

export interface ReceptionTabProps extends ComposableWidgetProps {
  title: string;
  description: string;
  actions?: ReactNode;
  query: ReceptionQuery<unknown>;
  // What the error banner says when the tab's data cannot be loaded. Fixed words: the source's own
  // error never reaches the screen here, so nothing about a patient can leak through it.
  errorMessage: string;
  onRetry: () => void;
  // The tab's content, drawn once the data is ready.
  children?: ReactNode;
}

// The frame every Reception tab shares: the TabPage, its header (shown in every state, so the
// title stays put while the body loads), and the TabPage loading and error states.
export function ReceptionTab({
  patientId,
  compactMode,
  className,
  title,
  description,
  actions,
  query,
  errorMessage,
  onRetry,
  children,
}: ReceptionTabProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      error={query.status === 'error' ? errorMessage : null}
    >
      <TabHeader
        title={title}
        description={description}
        actions={query.status === 'ready' ? actions : undefined}
      />
      {query.status === 'loading' ? (
        <TabPage loading compactMode>
          {null}
        </TabPage>
      ) : null}
      {query.status === 'error' ? (
        <EmptyState
          title="Nothing to show yet"
          description="The front desk data did not load. Nothing was changed."
          action={<Button onClick={onRetry}>Try again</Button>}
        />
      ) : null}
      {query.status === 'ready' ? <TabContent>{children}</TabContent> : null}
    </TabPage>
  );
}

export interface ReceptionKpisProps {
  // Names the strip for assistive technology ("Queue figures").
  label: string;
  kpis: ReceptionKpi[];
}

// A tab's headline figures: the prototype's .kpi-row.
export function ReceptionKpis({ label, kpis }: ReceptionKpisProps) {
  return (
    <Box as="section" aria-label={label}>
      <TabKPIStrip columns={4}>
        {kpis.map((kpi) => (
          <KpiTile
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            trend={kpi.trend}
            tone={kpi.sentiment ?? 'neutral'}
          />
        ))}
      </TabKPIStrip>
    </Box>
  );
}
