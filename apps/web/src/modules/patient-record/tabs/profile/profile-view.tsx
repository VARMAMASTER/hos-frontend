import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ProfileWidgetProps } from './types';

export function ProfileWidget({
  patientId,
  compactMode,
  className,
}: ProfileWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader title="Profile" description="Curated workflow for Profile." />
      <TabContent>
        {/* Curated Patient Records - Profile workflow payload */}
      </TabContent>
    </TabPage>
  );
}
