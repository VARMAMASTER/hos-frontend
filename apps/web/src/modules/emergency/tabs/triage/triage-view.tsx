import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { TriageWidgetProps } from './types';

export function TriageWidget({
  patientId,
  compactMode,
  className,
}: TriageWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Triage Board"
        description="Curated workflow for Triage Board."
      />
      <TabContent>
        {/* Curated Emergency & Casualty - Triage Board workflow payload */}
      </TabContent>
    </TabPage>
  );
}
