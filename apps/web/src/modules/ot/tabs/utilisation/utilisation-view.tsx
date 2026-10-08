import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { UtilisationWidgetProps } from './types';

export function UtilisationWidget({
  patientId,
  compactMode,
  className,
}: UtilisationWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="OT Utilisation"
        description="Curated workflow for OT Utilisation."
      />
      <TabContent>
        {/* Curated Operation Theatre - OT Utilisation workflow payload */}
      </TabContent>
    </TabPage>
  );
}
