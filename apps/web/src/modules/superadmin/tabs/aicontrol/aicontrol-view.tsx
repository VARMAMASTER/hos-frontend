import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AicontrolWidgetProps } from './types';

export function AicontrolWidget({
  patientId,
  compactMode,
  className,
}: AicontrolWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="AI Fleet Control"
        description="Curated workflow for AI Fleet Control."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - AI Fleet Control workflow payload */}
      </TabContent>
    </TabPage>
  );
}
