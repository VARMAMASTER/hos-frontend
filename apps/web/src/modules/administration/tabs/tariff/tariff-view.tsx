import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { TariffWidgetProps } from './types';

export function TariffWidget({
  patientId,
  compactMode,
  className,
}: TariffWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Tariff Master"
        description="Curated workflow for Tariff Master."
      />
      <TabContent>
        {/* Curated Administration - Tariff Master workflow payload */}
      </TabContent>
    </TabPage>
  );
}
