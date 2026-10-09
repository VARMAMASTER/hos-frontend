import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { HistoryWidgetProps } from './types';

export function HistoryWidget({
  patientId,
  compactMode,
  className,
}: HistoryWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Patient History"
        description="Curated workflow for Patient History."
      />
      <TabContent>
        {/* Curated Doctor module - Patient History workflow payload */}
      </TabContent>
    </TabPage>
  );
}
