import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AdmissionWidgetProps } from './types';

export function AdmissionWidget({
  patientId,
  compactMode,
  className,
}: AdmissionWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Admission"
        description="Curated workflow for Admission."
      />
      <TabContent>
        {/* Curated Reception / OPD - Admission workflow payload */}
      </TabContent>
    </TabPage>
  );
}
