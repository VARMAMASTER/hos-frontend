import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AgeingWidgetProps } from './types';

export function AgeingWidget({
  patientId,
  compactMode,
  className,
}: AgeingWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Ageing by Payer"
        description="Curated workflow for Ageing by Payer."
      />
      <TabContent>
        {/* Curated Insurance & Claims - Ageing by Payer workflow payload */}
      </TabContent>
    </TabPage>
  );
}
