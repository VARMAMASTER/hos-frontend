import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { SettlementWidgetProps } from './types';

export function SettlementWidget({
  patientId,
  compactMode,
  className,
}: SettlementWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Settlement & Deductions"
        description="Curated workflow for Settlement & Deductions."
      />
      <TabContent>
        {/* Curated Insurance & Claims - Settlement & Deductions workflow payload */}
      </TabContent>
    </TabPage>
  );
}
