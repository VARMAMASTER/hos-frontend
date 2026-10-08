import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { MortalityWidgetProps } from './types';

export function MortalityWidget({
  patientId,
  compactMode,
  className,
}: MortalityWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Mortality Review"
        description="Curated workflow for Mortality Review."
      />
      <TabContent>
        {/* Curated Quality & Accreditation - Mortality Review workflow payload */}
      </TabContent>
    </TabPage>
  );
}
