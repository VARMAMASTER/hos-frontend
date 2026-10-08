import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ArrivalsWidgetProps } from './types';

export function ArrivalsWidget({
  patientId,
  compactMode,
  className,
}: ArrivalsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Arrivals"
        description="Curated workflow for Arrivals."
      />
      <TabContent>
        {/* Curated Emergency & Casualty - Arrivals workflow payload */}
      </TabContent>
    </TabPage>
  );
}
