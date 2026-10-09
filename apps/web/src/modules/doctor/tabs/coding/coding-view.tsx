import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { CodingWidgetProps } from './types';

export function CodingWidget({
  patientId,
  compactMode,
  className,
}: CodingWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Coding & Claims"
        description="Curated workflow for Coding & Claims."
      />
      <TabContent>
        {/* Curated Doctor module - Coding & Claims workflow payload */}
      </TabContent>
    </TabPage>
  );
}
