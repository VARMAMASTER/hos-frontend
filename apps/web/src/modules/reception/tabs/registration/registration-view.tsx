import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { RegistrationWidgetProps } from './types';

export function RegistrationWidget({
  patientId,
  compactMode,
  className,
}: RegistrationWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Registration"
        description="Curated workflow for Registration."
      />
      <TabContent>
        {/* Curated Reception / OPD - Registration workflow payload */}
      </TabContent>
    </TabPage>
  );
}
