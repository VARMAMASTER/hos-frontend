import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { DocumentsWidgetProps } from './types';

export function DocumentsWidget({
  patientId,
  compactMode,
  className,
}: DocumentsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Documents"
        description="Curated workflow for Documents."
      />
      <TabContent>
        {/* Curated Patient Records - Documents workflow payload */}
      </TabContent>
    </TabPage>
  );
}
