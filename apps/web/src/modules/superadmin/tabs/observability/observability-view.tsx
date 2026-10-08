import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ObservabilityWidgetProps } from './types';

export function ObservabilityWidget({
  patientId,
  compactMode,
  className,
}: ObservabilityWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Telemetry & Logs"
        description="Curated workflow for Telemetry & Logs."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - Telemetry & Logs workflow payload */}
      </TabContent>
    </TabPage>
  );
}
