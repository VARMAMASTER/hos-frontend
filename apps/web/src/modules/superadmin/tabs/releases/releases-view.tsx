import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ReleasesWidgetProps } from './types';

export function ReleasesWidget({
  patientId,
  compactMode,
  className,
}: ReleasesWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Release & Rollout"
        description="Curated workflow for Release & Rollout."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - Release & Rollout workflow payload */}
      </TabContent>
    </TabPage>
  );
}
