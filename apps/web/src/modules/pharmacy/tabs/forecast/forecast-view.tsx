import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ForecastWidgetProps } from './types';

export function ForecastWidget({
  patientId,
  compactMode,
  className,
}: ForecastWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Demand Forecast"
        description="Curated workflow for Demand Forecast."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Demand Forecast workflow payload */}
      </TabContent>
    </TabPage>
  );
}
