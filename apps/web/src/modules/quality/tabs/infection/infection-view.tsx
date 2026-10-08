import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { InfectionWidgetProps } from './types';

export function InfectionWidget({
  patientId,
  compactMode,
  className,
}: InfectionWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Infection Control"
        description="Curated workflow for Infection Control."
      />
      <TabContent>
        {/* Curated Quality & Accreditation - Infection Control workflow payload */}
      </TabContent>
    </TabPage>
  );
}
