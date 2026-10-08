import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { PreauthWidgetProps } from './types';

export function PreauthWidget({
  patientId,
  compactMode,
  className,
}: PreauthWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Pre-auth & Enhancement"
        description="Curated workflow for Pre-auth & Enhancement."
      />
      <TabContent>
        {/* Curated Insurance & Claims - Pre-auth & Enhancement workflow payload */}
      </TabContent>
    </TabPage>
  );
}
