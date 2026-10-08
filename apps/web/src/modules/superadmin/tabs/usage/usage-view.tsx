import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { UsageWidgetProps } from './types';

export function UsageWidget({
  patientId,
  compactMode,
  className,
}: UsageWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Usage Metering"
        description="Curated workflow for Usage Metering."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - Usage Metering workflow payload */}
      </TabContent>
    </TabPage>
  );
}
