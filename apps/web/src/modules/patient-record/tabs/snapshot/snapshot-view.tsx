import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { SnapshotWidgetProps } from './types';

export function SnapshotWidget({
  patientId,
  compactMode,
  className,
}: SnapshotWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Clinical Snapshot"
        description="Curated workflow for Clinical Snapshot."
      />
      <TabContent>
        {/* Curated Patient Records - Clinical Snapshot workflow payload */}
      </TabContent>
    </TabPage>
  );
}
