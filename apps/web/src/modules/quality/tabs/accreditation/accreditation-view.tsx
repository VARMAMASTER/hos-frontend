import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AccreditationWidgetProps } from './types';

export function AccreditationWidget({
  patientId,
  compactMode,
  className,
}: AccreditationWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Accreditation"
        description="Curated workflow for Accreditation."
      />
      <TabContent>
        {/* Curated Quality & Accreditation - Accreditation workflow payload */}
      </TabContent>
    </TabPage>
  );
}
