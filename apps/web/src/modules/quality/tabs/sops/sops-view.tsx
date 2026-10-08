import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { SopsWidgetProps } from './types';

export function SopsWidget({
  patientId,
  compactMode,
  className,
}: SopsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="SOP Library"
        description="Curated workflow for SOP Library."
      />
      <TabContent>
        {/* Curated Quality & Accreditation - SOP Library workflow payload */}
      </TabContent>
    </TabPage>
  );
}
