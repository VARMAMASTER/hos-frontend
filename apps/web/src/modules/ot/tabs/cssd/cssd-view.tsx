import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { CssdWidgetProps } from './types';

export function CssdWidget({
  patientId,
  compactMode,
  className,
}: CssdWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Instruments & CSSD"
        description="Curated workflow for Instruments & CSSD."
      />
      <TabContent>
        {/* Curated Operation Theatre - Instruments & CSSD workflow payload */}
      </TabContent>
    </TabPage>
  );
}
